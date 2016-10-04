var mysql = require('mysql2');
var later = require('later');
var config = require('config');
var console = require('tracer').colorConsole();
var Joi = require('joi');

var Mailer = require('./lib/mailer');
var DailyReport = require('./lib/reports/daily/report');
var configSchema = require('./lib/configSchema');

var server = function (config) {

    var init = function () {
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
        console.log('start');
    };

    var run = function () {
        Joi.validate(config, configSchema, function (err, config) {
            if (err) {
                console.log(err);
                process.exit(1);
            } else {
                init();            
            }
        });
    };

    return {
        run: run
    };
};

module.exports = server;