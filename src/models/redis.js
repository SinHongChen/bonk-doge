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
    scan: (pattern) => {
        return new Promise((resolve, reject) => {
            redisClient.scan(0, 'MATCH', pattern, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result[1]);
            })
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
    deleteListValue: (key, value) => {
        return new Promise(async (resolve, reject) => {
            if (!key || !value)
                reject('key && value are required');
            else
                redisClient.lrem(key, 1, value, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(result);
                })
        })
    },
    listValue: (key) => {
        return new Promise(async (resolve, reject) => {
            if (!key)
                reject('key is required');
            else
                redisClient.lrange(key, 0, -1, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(result);
                })
        })
    },
    getSessKeys: () => {
        return self.scan('sess:*');
    },
    getAllSess: async () => {
        const keys = await self.getSessKeys();
        const values = await Promise.all(keys.map(item => self.get(item)));
        return Object.fromEntries(keys.map((_, i) => [keys[i], JSON.parse(values[i])]))
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
    getPlayer: (player) => {
        return self.get('player:' + player);
    },
    setPlayer: (player, data) => {
        return self.set('player:' + player, data);
    },
    delPlayer: (player) => {
        return self.del('player:' + player);
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
}
