var mysql = require('mysql2');
var nodemailer = require('nodemailer');
var moment = require('moment');
var Q = require('q');
var later = require('later');
var config = require('config');
var console = require('tracer').colorConsole();

var mailer = nodemailer.createTransport(config.reporter.mail);
var conn = mysql.createConnection(config.mysql);


function handleDisconnect(connection) {
    connection.on('error', function (err) {
        if (!err.fatal) {
            return;
        }
        if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
            throw err;
        }
        console.log('Re-connecting lost connection: ' + err.stack);
        conn = mysql.createConnection(connection.config);
        handleDisconnect(conn);
        conn.connect();
    });
}
handleDisconnect(conn);

//var agenda = new Agenda({db: {address: config.report.agendaDb}});

var textSched = later.parse.text('every 1 min');

var getReportData = function (callback, err) {
    conn.query("SHOW TABLES", function (err, rows) {

        if (err) {
            console.log('err', err);
            callback('', err);
        } else {
            var beginDate = moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
            var endDate = moment().format('YYYY-MM-DD HH:mm:ss');
            Q.all(rows.map(function (row) {

                var table = row['Tables_in_' + config.mysql.database];
                var deferred = Q.defer();
                conn.query("SELECT count(id) FROM " + table + " WHERE timestamp > '" + beginDate + "'", function (error, counts) {
                    if (err) {
                        deferred.reject(err)
                    } else {
                        console.log('counts', counts);
                        deferred.resolve({
                            table: table,
                            count: counts[0]['count(id)']
                        });
                    }
                });
                return deferred.promise
            }))
                .then(function (tablesCount) {
                    var result = "<h4>Количество записей за " + beginDate + " по " + endDate + "</h4>" +
                        "<table border='1'><tr><td>Ключ</td><td>Количество записей</td></tr>";
                    tablesCount.forEach(function (table) {
                        result += "<tr><td>" + table.table + "</td><td>" + table.count + "</td></tr>";
                    });
                    result += "</table>";
                    callback(result);
                })
                .catch(function (err) {
                    callback('', err);
                })
        }
    });
};

var run = function() {
    console.log('start daily report');


    getReportData(function (data, err) {
        if (!err) {
            console.log('send email');
            mailer.sendMail({
                from: 'avat12111@yandex.ru',
                to: config.reporter.to,
                subject: 'beebon daily report',
                html: data
            }, function (err, info) {
                if (err) {
                    console.log('err', err);
                }
                if (info) {
                    console.log('info', info);
                }                
            })
        } else {
            console.log('err', err);
        }

    })

};


//run();
var timer = later.setTimeout(run, textSched);