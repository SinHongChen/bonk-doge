const db = require('../db');

module.exports = {
    login: ({ Name, Email }) => {
        return new Promise((resolve, reject) => {
            db.select('Users', { whereInfo: { Email } }).then(results => {
                if (results.length === 0)
                    db.insert('Users', {
                        Name,
                        Email
                    }).then(results => resolve(results))
                else
                    resolve(results[0])
            }).catch(err => reject(err));
        })
    },
    list: () => {
        return new Promise((resolve, reject) => {
            db.select('Users')
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    },
    get: (ID) => {
        return new Promise((resolve, reject) => {
            db.get('Users', ID)
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    },
    update: ({ ID, Name, Email }) => {
        return new Promise((resolve, reject) => {
            db.update('Users', {
                updateInfo: {
                    Name,
                    Email
                },
                whereInfo: {
                    ID
                }
            })
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    },
    delete: (ID) => {
        return new Promise((resolve, reject) => {
            db.delete('Users', { ID })
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    }
}