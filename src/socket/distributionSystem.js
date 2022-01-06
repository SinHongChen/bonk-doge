const { v5: uuidv5 } = require('uuid');
const redis = require('../models/redis');

const delay = 5; // second
const token = process.env.TOKEN;

const interval = () => {
    playerQueueSystem()
        .then(() => new Promise((resolve) => setTimeout(resolve, delay * 1000))) // delay
        .then(() => {
            interval();
        })
}

module.exports = () => {
    interval();
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