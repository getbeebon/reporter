var console = require('tracer').colorConsole();
var nodemailer = require('nodemailer');
var Q = require('q');

var Mailer = function (config) {
    var mailer = nodemailer.createTransport(config.reporter.mail);

    var send = function (params) {
        var defer = Q.defer();
        mailer.sendMail({
            from: config.reporter.from,
            to: config.reporter.to,
            subject: params.subject,
            html: params.data
        }, function (err, info) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(info);
            }
        })
        return defer.promise;
    };

    return {
        send: send
    };
};

module.exports = Mailer;