const db = require('../db');
const Minio = require('./minio');
const { v5: uuidv5 } = require('uuid');
const moment = require('moment');

const categoryArray = ['Role', 'Effect'];
const token = process.env.TOKEN;

const self = module.exports = {
    create: (Category, args) => {
        return new Promise(async (resolve, reject) => {
            const UUID = await self.genCardUUID(args.Name);
            const { mimetype, createReadStream } = await args.Img;

            self.uploadCardImg(UUID, mimetype, createReadStream).then(fileName => {
                args.Img = fileName;
                args.UUID = UUID;
                db.insert(`${Category}_Card`, args)
                    .then(() => resolve(UUID))
                    .catch(err => reject(err));
            }).catch(err => reject(err));
        })
    },
    get: (UUID) => {
        return new Promise((resolve, reject) => {
            Promise.all(categoryArray.map(table => db.select(`${table}_Card`, { whereInfo: { UUID } })))
                .then(results => resolve([].concat(...results)[0]))
                .catch(err => reject(err));
        })
    },
    getCards: (UUID_Array) => {
        return new Promise((resolve, reject) => {
            Promise.all(categoryArray.map(table => db.select(`${table}_Card`)))
                .then(results => {
                    let res = [];
                    const cards = [].concat(...results);
                    UUID_Array.map(UUID => {
                        const find = cards.find(card => card.UUID === UUID);
                        if (find)
                            res.push(find);
                    })
                    resolve(res);
                })
                .catch(err => reject(err));
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
    update: (Category, { UUID, ...args }) => {
        return new Promise(async (resolve, reject) => {
            try {
                // upload new image
                const { mimetype, createReadStream } = await args.Img;
                const fileName = await self.uploadCardImg(UUID, mimetype, createReadStream);
                args.Img = fileName;
                // delete old img
                const card = await self.get(UUID);
                await Minio.deleteObject(Minio.buckets.card, card.Img);
            } catch (e) {
                delete args.Img;
            }
            db.update(`${Category}_Card`, { updateInfo: args, whereInfo: { UUID } })
                .then(() => resolve(UUID))
                .catch(err => reject(err));
        })
    },
    delete: (UUID) => {
        return new Promise((resolve, reject) => {
            self.get(UUID).then(card => {
                const category = card.Nature_ID ? 'Effect' : 'Role';
                const Img = card.Img;
                return Promise.all([
                    db.delete(`${category}_Card`, { UUID }),
                    Minio.deleteObject(Minio.buckets.card, Img),
                ])
            })
                .then(resultes => resolve(resultes[0]))
                .catch(err => reject(err));
        })
    },
    uploadCardImg: (UUID, mimetype, createReadStream) => {
        return new Promise((resolve, reject) => {
            const stream = createReadStream();
            const ext = mimetype.split('/')[1];
            const fileName = `${UUID}.${ext}`;
            Minio.uploadObject(Minio.buckets.card, fileName, stream)
                .then(() => resolve(fileName))
                .catch(err => reject(err));
        })
    },
    genCardUUID: () => {
        return new Promise((resolve) => {
            resolve(uuidv5(moment().toISOString(), token));
        })
    },
    natureList: () => {
        return new Promise((resolve, reject) => {
            db.select('Natures')
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    },
    attributeList: () => {
        return new Promise((resolve, reject) => {
            db.select('Attributes')
                .then(results => resolve(results))
                .catch(err => reject(err));
        })
    },
    raceList: () => {
        return new Promise((resolve, reject) => {
            db.select('Races')
                .then(results => resolve(results))
                .catch(err => reject(err));
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
}