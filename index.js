var later = require('later');
var console = require('tracer').colorConsole();
var Joi = require('joi');

var Mailer = require('./lib/mailer');
var DailyReport = require('./lib/reports/daily/report');
var configSchema = require('./lib/configSchema');
var DBManager = require('./lib/dbmanager');

var server = function (config) {

    var init = function () {
        var mailer = new Mailer(config);
        var dbManager = new DBManager(config);
        
        var dailyReport = new DailyReport(dbManager, mailer);

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