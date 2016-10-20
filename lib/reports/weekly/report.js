var moment = require('moment');
var later = require('later');
var console = require('tracer').colorConsole();
var Report = require('../report');
class WeeklyReport extends Report {
    _getStringSchedule() {
        return 'at 10:00am every monday';
    }

    _getReportSubject() {
        return 'beebon weekly report';
    }

    _prepareEmailTemplate(tablesCount, days, beginDate, endDate) {
        console.log('prepare email');
        var result = [
            `<h4>Количество записей за ${beginDate} по ${endDate}</h4>`,
            "<table border='1'>"];
        var header = '<tr><td>Ключ</td>';
        days.forEach((day)=> {
            header += `<td>${day.beginDate.format('YYYY-MM-DD')}</td>`;
        });
        header += '</td>';
        result.push(header);

        tablesCount.forEach((table)=> {
            var row = `<tr><td>${table[0].table}</td>`;
            table.forEach((tableRow)=> {
                row += `<td>${tableRow.count}</td>`
            });
            row += '</tr>';
            result.push(row);
        });
        result.push("</table>");

        console.log('result:', result);
        return Promise.resolve(result.join(""));
    }

    run() {
        var beginDate = moment().subtract(7, 'days');
        var endDate = moment();
        var days = [];
        while (beginDate < endDate) {
            var day = {
                beginDate: beginDate.clone(),
            };
            beginDate = beginDate.add(1, 'days');
            day.endDate = beginDate.clone();
            days.push(day);
        }
        this._getTablesList()
            .then((tables)=> {
                return Promise.all(tables.map((table)=> {
                    return Promise.all(days.map((day)=> {
                        return this._getTableCount(
                            table,
                            day.beginDate.format('YYYY-MM-DD 00:00:00'),
                            day.endDate.format('YYYY-MM-DD 00:00:00')
                        )
                    }));
                }));
            })
            .then((tablesCount)=>this._prepareEmailTemplate(
                tablesCount,
                days,
                beginDate.format('YYYY-MM-DD 00:00:00'),
                endDate.format('YYYY-MM-DD 00:00:00')
            ))
            .then((data)=>this._sendEmail(data))
            .then((info)=> {
                console.log('info', info);
            })
            .catch(function (err) {
                console.log('err', err);
            });
    }

}
module.exports = WeeklyReport;