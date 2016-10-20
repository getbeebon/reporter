var console = require('tracer').colorConsole();
var mysql = require('mysql2');

var DBManager = function (config) {
    var getConnection = function () {
        var conn = mysql.createConnection(config.mysql);

        var handleDisconnect = function (connection) {
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
        return conn;
    };

    return {
        getConnection: getConnection
    };
};

module.exports = DBManager;