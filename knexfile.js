// Update with your config settings.

module.exports = {
    development: {
	client: 'mysql',
	connection: {
	    host: process.env.MYSQL_HOST,
	    port: process.env.MYSQL_PORT,
	    database: process.env.MYSQL_DATABASE,
	    user: process.env.MYSQL_USER,
	    password: process.env.MYSQL_PASSWORD,
            multipleStatements: true
	},
	pool: {
	    min: 2,
	    max: 50
	},
	migrations: {
	    tableName: 'knex_migrations'
	}
    },
    staging: {
	client: 'mysql',
	connection: {
	    host: process.env.MYSQL_HOST,
	    port: process.env.MYSQL_PORT,
	    database: process.env.MYSQL_DATABASE,
	    user: process.env.MYSQL_USER,
	    password: process.env.MYSQL_PASSWORD,
	    multipleStatements: true
	},
	pool: {
	    min: 2,
	    max: 50
	},
	migrations: {
	    tableName: 'knex_migrations'
	}
	},
    production: {
	client: 'mysql',
	connection: {
	    host: process.env.MYSQL_HOST,
	    port: process.env.MYSQL_PORT,
	    database: process.env.MYSQL_DATABASE,
	    user: process.env.MYSQL_USER,
	    password: process.env.MYSQL_PASSWORD,
	    multipleStatements: true
	},
	pool: {
	    min: 2,
	    max: 50
	},
	migrations: {
	    tableName: 'knex_migrations'
	}
    }
};
