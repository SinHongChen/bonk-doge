const { google } = require('googleapis');
const oauth = require('./oauth');
const db = require('../db');

module.exports = {
    login: ({ Code }, req) => {
        return new Promise((resolve, reject) => {
            const origin = req.get('origin');
            const auth = oauth(origin);
            auth.getToken(Code).then(async token => {
                auth.setCredentials(token.tokens);
                const oauth2 = google.oauth2({ version: 'v2', auth });
                const userinfo = await oauth2.userinfo.get();

                const Access_Token = token.tokens.access_token;
                const Refresh_Token = token.tokens.refresh_token;
                const Picture_Url = userinfo.data.picture;
                const Name = userinfo.data.name;
                const Email = userinfo.data.email;
                db.select('Users', { whereInfo: { Email } }).then(results => {
                    if (results.length === 0)
                        db.insert('Users', {
                            Name,
                            Email
                        }).then(results => resolve(Object.assign({ Access_Token, Refresh_Token, Picture_Url }, results)))
                    else
                        resolve(Object.assign({ Access_Token, Refresh_Token, Picture_Url }, results[0]))
                }).catch(err => reject(err));
            }).catch(err => {
                if (err.response)
                    console.log(err.response.data); //err.response.data
                else
                    console.log(err);
                reject(new Error('ACCESS_GOOGLEAPI_ERROR'));
            })
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