const { v5: uuidv5 } = require('uuid');
const redis = require('../models/redis');
const { setIntervalAsync } = require('../models/util');

const token = process.env.TOKEN;

module.exports = () => {
    setIntervalAsync(playerQueueSystem, 5);
    setIntervalAsync(keepSessionLatestSystem, 5 * 60);
}

const playerQueueSystem = async () => {
    const redisKey = redis.listKey.playerQueue;
    if (await redis.listLength(redisKey) >= 2) {
        const gameUUID = uuidv5(new Date().toISOString(), token);
        const playerA_JSON = await redis.leftPopList(redisKey);
        const playerB_JSON = await redis.leftPopList(redisKey);

        const playerA = JSON.parse(playerA_JSON);
        const playerB = JSON.parse(playerB_JSON);

        await redis.setPlayer(playerA.clientID, JSON.stringify({ gameUUID, enemyUserID: playerB.userID, enemyClientID: playerB.clientID }));
        await redis.setPlayer(playerB.clientID, JSON.stringify({ gameUUID, enemyUserID: playerA.userID, enemyClientID: playerA.clientID }));
    }
}

const keepSessionLatestSystem = async () => {
    let userSession = {};
    const sessions = await redis.getAllSess();
    Object.keys(sessions).map(item => {
        const session = sessions[item];
        const userID = session.userID;
        if (userSession[userID] === undefined)
            userSession[userID] = { ...session, sessionID: item };
        else if (userSession[userID].tokens.expiry_date < session.tokens.expiry_date)
            userSession[userID] = { ...session, sessionID: item };
    })
    const keepSession = Object.values(userSession).map(item => item.sessionID);
    const deleteSession = Object.keys(sessions).filter(item => keepSession.indexOf(item) === -1);
    await Promise.all(deleteSession.map(session => redis.del(session)))
}