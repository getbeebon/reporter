var mysql = require('mysql2');
var later = require('later');
var config = require('config');
var console = require('tracer').colorConsole();

var Mailer = require('./lib/mailer');
var DailyReport = require('./lib/reports/daily/report');

var mailer = new Mailer(config);
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

var dailyReport = new DailyReport(conn, mailer);
var timer = later.setInterval(dailyReport.run, dailyReport.schedule);
