var moment = require('moment');
var later = require('later');
var console = require('tracer').colorConsole();
var Inky = require('inky').Inky;
var cheerio = require('cheerio');

var Report = require('../report');

class WeeklyReport extends Report {
    _getStringSchedule() {
        return 'every 20 sec';
    }

    _getReportSubject() {
        return 'beebon weekly report';
    }

    _prepareContent(tablesCount, days) {
        var result = [
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

        return Promise.resolve(result.join(""));
    }

    _prepareEmailTemplate(content, beginDate, endDate) {
        var input = ['<container>',
            '<row>' , 
            '<columns large="12" small="12">Период: ' + beginDate + '-' + endDate + '</columns>',
            '</row>',
            '<row>',
            '<columns large="12" small="12">' + content + '</columns>',
            '</row>',
            '</container>'
        ].join("");
        
        var i = new Inky();
        var html = cheerio.load(input)
        var convertedHtml = i.releaseTheKraken(html);

        console.log(convertedHtml);
        return Promise.resolve(convertedHtml);
    };

    run() {
        var beginDate = moment().subtract(7, 'days');
        var currentDate = beginDate.clone();
        var endDate = moment();

        var days = [];
        while (currentDate < endDate) {
            var day = {
                beginDate: currentDate.clone(),
            };
            currentDate = currentDate.add(1, 'days');
            day.endDate = currentDate.clone();
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
            .then((tablesCount)=>this._prepareContent(
                tablesCount,
                days                
            ))
            .then((data)=>this._prepareEmailTemplate(
                data,
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