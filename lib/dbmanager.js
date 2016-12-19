var console = require('tracer').colorConsole();
var mysql = require('mysql2');

var DBManager = function (config) {
    var getConnection = function () {
        var conn = mysql.createConnection(config.mysql);
        return conn;
    };

    return {
        getConnection: getConnection
    };
};

module.exports = DBManager;