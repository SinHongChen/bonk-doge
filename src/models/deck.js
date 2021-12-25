const db = require('../db');

const self = module.exports = {
    create: ({ User_ID, Name, UUID_Array }) => {
        return new Promise((resolve, reject) => {
            db.insert('Decks', { User_ID, Name, Cards: JSON.stringify(UUID_Array) })
                .then(deck => self.get({ ID: deck.ID }))
                .then(result => resolve(result))
                .catch(err => reject(err));
        })
    },
    update: ({ ID, User_ID, Name, UUID_Array }) => {
        return new Promise((resolve, reject) => {
            db.update('Decks', { updateInfo: { User_ID, Name, Cards: JSON.stringify(UUID_Array) }, whereInfo: { ID } })
                .then(deck => self.get({ ID: deck.ID }))
                .then(result => resolve(result))
                .catch(err => reject(err));
        })
    },
    delete: (ID) => {
        return new Promise((resolve, reject) => {
            db.delete('Decks', { ID })
                .then(result => resolve(result))
                .catch(err => reject(err));
        })
    },
    list: ({ User_ID }) => {
        return new Promise((resolve, reject) => {
            db.select('Decks', { whereInfo: { User_ID } })
                .then(results => {
                    results = results.map(deck => {
                        deck.Cards = JSON.parse(deck.Cards);
                        return deck;
                    })
                    resolve(results);
                })
                .catch(err => reject(err));
        })
    },
    get: ({ ID }) => {
        return new Promise((resolve, reject) => {
            db.get('Decks', ID)
                .then(deck => {
                    deck.Cards = JSON.parse(deck.Cards);
                    resolve(deck);
                })
                .catch(err => reject(err));
        })
    }
}