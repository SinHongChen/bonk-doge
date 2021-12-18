const { google } = require('googleapis');
const oauth = require('./oauth');
const redis = require('./redis');
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

                // save access_tolen and refresh_token to session
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
            const sessionID = req.headers['session-id'];
            const origin = req.get('origin');
            const auth = oauth(origin);
            const session = await redis.getSess(sessionID);
            if (session) {
                const { tokens } = JSON.parse(session);
                auth.setCredentials(tokens);
                const oauth2 = google.oauth2({ version: 'v2', auth });
                oauth2.userinfo.get().then(userinfo => {
                    const Session_ID = sessionID;
                    const Picture_Url = userinfo.data.picture;
                    const Email = userinfo.data.email;
    
                    db.select('Users', { whereInfo: { Email } }).then(results => {
                        resolve(Object.assign({ Picture_Url, Session_ID }, results[0]));
                    }).catch(err => reject(err));
                }).catch(() => reject(new Error('GET_USER_INFO_ERROR')));
            } else {
                reject(new Error('GET_SESSION_ERROR'));
            }
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
                const sessionID = req.headers['session-id'];
                const origin = req.get('origin');
                const auth = oauth(origin);
                const session = await redis.getSess(sessionID);
                if (session) {
                    const { tokens } = JSON.parse(session);
                    auth.setCredentials(tokens);
                    await redis.delSess(sessionID);
                    await auth.revokeCredentials();
                }
                resolve('LOGOUT_SUCCESS');
            } catch (err) {
                console.log(err);
                reject(new Error('LOGOUT_FAILED'));
            }
        })
    }
}