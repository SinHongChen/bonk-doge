const { v5: uuidv5 } = require('uuid');
const redis = require('../models/redis');

const delay = 5; // second
const token = process.env.TOKEN;

const interval = (socket) => {
    playerQueueSystem(socket)
        .then(() => new Promise((resolve) => setTimeout(resolve, delay * 1000))) // delay
        .then(() => {
            interval(socket);
        })
}

module.exports = (socket) => {
    interval(socket);
}

const playerQueueSystem = async () => {
    if (await redis.listLength(redis.listKey.playerQueue) >= 2) {
        const gameUUID = uuidv5(new Date().toISOString(), token);
        const playerA_JSON = await redis.leftPopList(key);
        const playerB_JSON = await redis.leftPopList(key);

        const playerA = JSON.parse(playerA_JSON);
        const playerB = JSON.parse(playerB_JSON);

        socket.to(playerA.clientID).emit("matchPlayer", { gameUUID, userID: playerB.userID });
        socket.to(playerB.clientID).emit("matchPlayer", { gameUUID, userID: playerA.userID });
    }
}