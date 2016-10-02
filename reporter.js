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
};

handleDisconnect(conn);

var schedule = later.parse.text('every 1 min');
var beginDate, endDate;

var getTableCount = function(table){
    var deferred = Q.defer();
    conn.query("SELECT count(id) FROM " + table + " WHERE timestamp > '" + beginDate + "'", function (error, counts) {
        if (error) {
            deferred.reject(error)
        } else {
            console.log('counts', counts);
            deferred.resolve({
                table: table,
                count: counts[0]['count(id)']
            });
        }
    });
    return deferred.promise;
};

var getReportData = function () {
    var defer = Q.defer();
    conn.query("SHOW TABLES", function (err, rows) {
        if (err) {
            defer.reject(err);
        } else {
            beginDate = moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment().format('YYYY-MM-DD HH:mm:ss');

            Q.all(rows.map(function (row) {
                var table = row['Tables_in_' + config.mysql.database];
                return getTableCount(table);
            }))
            .then(function(results){
                console.log('results', results);
                defer.resolve(results);
            });
        }
    });
    return defer.promise;
};

var prepareEmail = function (tablesCount) {
    console.log('prepare email');
    var result = [
        "<h4>Количество записей за " + beginDate + " по " + endDate + "</h4>",
        "<table border='1'><tr><td>Ключ</td><td>Количество записей</td></tr>"];

    tablesCount.forEach(function (table) {
        result.push("<tr><td>" + table.table + "</td><td>" + table.count + "</td></tr>");
    });
    result.push("</table>");

    console.log('result:', result);
    return Q.resolve(result.join(""));
};

var run = function() {
    console.log('start daily report');

    getReportData()
    .then(prepareEmail)
    .then(function (data) {
        console.log('send email', data);
        mailer.sendMail({
            from: config.reporter.mail.from,
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
    })
    .catch(function(err){
        console.log('err', err);
    });
};

var timer = later.setInterval(run, schedule);