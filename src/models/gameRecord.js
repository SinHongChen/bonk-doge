const db = require('../db');

module.exports = {
    create: ({ Winner, Loser, IsTie, Winner_Cards, Loser_Cards, Total_Time }) => {
        return new Promise((resolve, reject) => {
            db.insert('Game_Record', { Winner, Loser, IsTie, Winner_Cards, Loser_Cards, Total_Time })
                .then(result => resolve(result))
                .catch(err => reject(err));
        })
    },
    list: ({ User_ID }) => {
        return new Promise((resolve, reject) => {
            Promise.all([
                db.select('Game_Record', { whereInfo: { Winner: User_ID } }),
                db.select('Game_Record', { whereInfo: { Loser: User_ID } })
            ])
                .then(results => {
                    const gameRecords = [].concat(...results);
                    resolve(gameRecords);
                })
                .catch(err => reject(err));
        })
    },
    get: ({ ID }) => {
        return new Promise((resolve, reject) => {
            db.get('Game_Record', ID)
                .then(result => resolve(result))
                .catch(err => reject(err));
        })
    }
}