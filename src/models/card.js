const db = require('../db');
const { v5: uuidv5 } = require('uuid');

const categoryArray = ['Role', 'Effect'];
const token = process.env.TOKEN;

module.exports = {
    create: ({ Category, ...args }) => {
        return new Promise((resolve, reject) => {

        })
    },
    list: ({ Keyword, Category }) => {
        return new Promise((resolve, reject) => {
            const whereInfo = Keyword ? (builder) => { builder.where('Name', 'like', `%${Keyword}%`) } : {};
            const tables = Category && categoryArray.indexOf(Category) !== -1 ? [Category] : categoryArray;
            Promise.all(tables.map(table => db.select(`${table}_Card`, { whereInfo })))
                .then(results => resolve([].concat(...results)))
                .catch(err => reject(err));
        })
    },
    update: ({ ID, ...args }) => {
        return new Promise((resolve, reject) => {

        })
    },
    delete: (ID) => {
        return new Promise((resolve, reject) => {

        })
    },
    nature: (ID) => {
        return new Promise((resolve, reject) => {
            db.get('Natures', ID)
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    },
    attribute: (ID) => {
        return new Promise((resolve, reject) => {
            db.get('Attributes', ID)
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    },
    race: (ID) => {
        return new Promise((resolve, reject) => {
            db.get('Races', ID)
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    },
    genCardUUID: (Name) => {
        return new Promise((resolve) => {
            resolve(uuidv5(Name, token));
        })
    }
}