const { google } = require('googleapis');
const redis = require('./redis');
const db = require('../db');

module.exports = {
    login: ({ Code }, req) => {
        return new Promise((resolve, reject) => {
            const auth = req.auth;
            auth.getToken(Code).then(async token => {
                auth.setCredentials(token.tokens);
                const oauth2 = google.oauth2({ version: 'v2', auth });
                const userinfo = await oauth2.userinfo.get();

                // save tokens to session
                req.session.tokens = token.tokens;
                
                const Session_ID = req.sessionID;
                const Picture_Url = userinfo.data.picture;
                const Name = userinfo.data.name;
                const Email = userinfo.data.email;
                db.select('Users', { whereInfo: { Email } }).then(results => {
                    if (results.length === 0)
                        db.insert('Users', {
                            Name,
                            Email
                        }).then(results => resolve(Object.assign({ Picture_Url, Session_ID }, results)))
                    else
                        resolve(Object.assign({ Picture_Url, Session_ID }, results[0]))
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
    get: (req) => {
        return new Promise(async (resolve, reject) => {
            const auth = req.auth;
            const oauth2 = google.oauth2({ version: 'v2', auth });
            oauth2.userinfo.get().then(userinfo => {
                const Session_ID = req.headers['session-id'];
                const Picture_Url = userinfo.data.picture;
                const Email = userinfo.data.email;

                db.select('Users', { whereInfo: { Email } }).then(results => {
                    resolve(Object.assign({ Picture_Url, Session_ID }, results[0]));
                }).catch(err => reject(err));
            }).catch(() => reject(new Error('GET_USER_INFO_ERROR')));
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
    },
    logout: (req) => {
        return new Promise(async (resolve, reject) => {
            try {
                const auth = req.auth;
                await redis.delSess(req.headers['session-id']);
                await auth.revokeCredentials();
                resolve('LOGOUT_SUCCESS');
            } catch (err) {
                console.log(err);
                reject(new Error('LOGOUT_FAILED'));
            }
        })
    }
}