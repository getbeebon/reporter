var moment = require('moment');
var Q = require('q');
var later = require('later');
var config = require('config');
var console = require('tracer').colorConsole();

var DailyReport = function (dbmanager, mailer) {
    var beginDate, endDate, conn;

    var getTableCount = function (table) {
        var deferred = Q.defer();
        conn.query("SELECT count(id) FROM ?? WHERE timestamp between ? and ?;", 
            [table, beginDate, endDate], 
            function (error, counts) {
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
                Q.all(rows.map(function (row) {
                    var table = row['Tables_in_' + config.mysql.database];
                    return getTableCount(table);
                }))
                .then(function (results) {
                    console.log('results', results);
                    defer.resolve(results);
                });
            }
        });
        return defer.promise;
    };

    var prepareEmailTemplate = function (tablesCount) {
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

    var sendEmail = function (data) {
        return mailer.send({subject: 'beebon daily report', data: data});
    };

    var run = function () {

        conn = dbmanager.getConnection();
        beginDate = moment().subtract(1, 'days').format('YYYY-MM-DD 00:00:00');
        endDate = moment().format('YYYY-MM-DD 00:00:00');

        console.log('period:', beginDate, endDate);

        getReportData()
        .then(prepareEmailTemplate)
        .then(sendEmail)
        .then(function (info) {
            console.log('info', info);
        })
        .catch(function (err) {
            console.log('err', err);
        });
    };

    return {
        schedule: later.parse.text('every 1 min'),
        run: run
    };
};

module.exports = DailyReport;