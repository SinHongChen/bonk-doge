const db = require('./db/db');

db.migrate.latest().then(() => {
    console.log('Migrate Latest Done.');
}).catch(err => {
    console.log(err);
})