Joi = require('joi');

var configSchema = Joi.object().keys({
	collector: Joi.object().keys({
    	port: Joi.number().integer().min(1).max(65535).required()
    }),
    mysql: Joi.object().keys({
    	host: Joi.string().required(),
    	port: Joi.number().integer().min(1).max(65535).default(3306),
      	user: Joi.string().required(),
      	password: Joi.string().allow('').required(),
      	database: Joi.string().required(),
      	multipleStatements: Joi.boolean().default(true)
    }),
    amqp: Joi.object().keys({
    	connectionString: Joi.string().required(),
    	queue: Joi.string().default('beebon')
    }),
    reporter: Joi.object().keys({
    	to: Joi.string().required(),
        from: Joi.string().required(),
    	mail: Joi.object().keys({
            service: Joi.string().required(),
            auth: Joi.object().keys({
                user: Joi.string().required(),
                pass: Joi.string().required()
            })
        })
    }),
    web: Joi.object().keys({
    	port: Joi.number().integer().min(1).max(65535).required()
    })
});

module.exports = configSchema;