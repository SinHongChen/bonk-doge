const db = require('../db');

const categoryArray = ['Role', 'Effect'];

module.exports = {
    create: ({  }) => {
        return new Promise((resolve, reject) => {

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
    getDeckCards: ({ ID, Keyword, Category }) => {
        return new Promise((resolve, reject) => {
            const whereInfo = Keyword ? (builder) => { builder.where('Name', 'like', `%${Keyword}%`) } : {};
            const tables = Category && categoryArray.indexOf(Category) !== -1 ? [Category] : categoryArray;
            Promise.all(tables.map(table => db.select(`${table}_Card`, { whereInfo })))
                .then(async results => {
                    const res = [];
                    const cards = [].concat(...results);
                    const deck = await db.get('Decks', ID);
                    JSON.parse(deck.Cards).map(UUID => {
                        const find = cards.find(card => card.UUID === UUID);
                        if (find)
                            res.push(find);
                    })
                    resolve(res);
                })
                .catch(err => reject(err));
        })
    },
}