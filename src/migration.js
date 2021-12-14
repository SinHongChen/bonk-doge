const db = require('./db/db');

module.exports = new Promise((resolve) => {
    db.migrate.latest().then(() => {
        console.log('Migrate Latest Done.');
        resolve();
    }).catch(err => {
        console.log('Migrate Latest Failed.');
        console.log(err);
        resolve();
    })
})