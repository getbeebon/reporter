const later = require('later');
var config = require('config');
var console = require('tracer').colorConsole();

class Report {
    constructor(dbmanager, mailer) {
        this._conn = dbmanager.getConnection();
        this._mailer = mailer;
        this.schedule = later.parse.text(this._getStringSchedule());
    }

    _getStringSchedule() {
        return 'every hour';
    }

    _getReportSubject() {
        return 'beebon report';
    }

    _getTableCount(table, beginDate, endDate) {
        return new Promise((resolve, reject)=> {
            this._conn.query("SELECT count(id) FROM ?? WHERE timestamp between ? and ?;",
                [table, beginDate, endDate],
                (error, counts)=> {
                    if (error) {
                        reject(error)
                    } else {
                        console.log('counts', counts);
                        resolve({
                            table: table,
                            count: counts[0]['count(id)']
                        });
                    }
                });
        });
    }

    _getTablesList() {
        return new Promise((resolve, reject)=> {
            this._conn.query("SHOW TABLES", function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map((row)=> {
                        return row['Tables_in_' + config.mysql.database];
                    }))
                }
            })
        })
    }

    _sendEmail(data) {
        return this._mailer.send({subject: this._getReportSubject(), data: data});
    };


    run() {
        console.log('base report body');
    }

}
module.exports = Report;