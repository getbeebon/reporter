module.exports = {
    collector: {
    	port: '3000',
    },
    mysql: {
        host: '127.0.0.1',
        user: 'root',
        password: '1234',
        database: 'beebon',
        multipleStatements: true
    },
    reporter: {
        to: 'serge.dmitriev@gmail.com',
        mail: {
            service: 'Yandex',
            auth: {
                user: 'avat12111',
                pass: 'nononame'
            }
        }
    }
};