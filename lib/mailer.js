var nodemailer = require('nodemailer');

var Mailer = function (config) {
    var mailer = nodemailer.createTransport(config.reporter.mail);

    var send = function (params) {
        return new Promise((resolve, reject)=> {
            mailer.sendMail({
                from: config.reporter.from,
                to: config.reporter.to,
                subject: params.subject,
                html: params.data
            }, function (err, info) {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            })
        });
    };

    return {
        send
    };
};

module.exports = Mailer;