const redis = require('redis');
const redisClient = redis.createClient(6379, 'redis');
redisClient.auth(process.env.REDIS_PASSWORD);

const listKey = {
    playerQueue: 'playerQueue'
}

const self = module.exports = {
    redisClient,
    listKey,
    get: (key) => {
        return new Promise(async (resolve, reject) => {
            if (!key)
                resolve(null);
            else if (await self.exists(key))
                redisClient.get(key, (err, value) => {
                    if (err)
                        reject(err);
                    else
                        resolve(value);
                })
            else
                resolve(undefined);
        })
    },
    set: (key, value) => {
        return new Promise((resolve, reject) => {
            if (!key || !value)
                reject('key && value are required');
            else
                redisClient.set(key, value, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(true);
                })
        })
    },
    del: (key) => {
        return new Promise(async (resolve, reject) => {
            if (!key)
                reject('key is required');
            else if (await self.exists(key))
                redisClient.del(key, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(true);
                })
            else
                resolve(false);
        })
    },
    pushList: (key, value) => {
        return new Promise(async (resolve, reject) => {
            if (!key || !value)
                reject('key && value are required');
            else
                redisClient.rpush(key, value, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(true);
                })
        })
    },
    leftPushList: (key, value) => {
        return new Promise(async (resolve, reject) => {
            if (!key || !value)
                reject('key && value are required');
            else
                redisClient.lpush(key, value, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(true);
                })
        })
    },
    leftPopList: (key) => {
        return new Promise(async (resolve, reject) => {
            if (!key)
                reject('key is required');
            else
                redisClient.lpop(key, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(result);
                })
        })
    },
    listLength: (key) => {
        return new Promise(async (resolve, reject) => {
            if (!key)
                reject('key is required');
            else
                redisClient.llen(key, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(result);
                })
        })
    },
    getSess: (sessionID) => {
        return self.get('sess:' + sessionID);
    },
    setSess: (sessionID, data) => {
        return self.set('sess:' + sessionID, data);
    },
    delSess: (sessionID) => {
        return self.del('sess:' + sessionID);
    },
    exists: (key) => {
        return new Promise((resolve, reject) => {
            redisClient.exists(key, (err, exists) => {
                if (err)
                    reject(err);
                else
                    resolve(exists);
            })
        })
    },
    scan: (cursor, pattern) => {
        return new Promise((resolve, reject) => {
            redisClient.scan(cursor, 'MATCH', pattern, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            })
        })
    },
}
