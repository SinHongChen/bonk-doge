const auth = require('../../models/auth');
const redis = require('../../models/redis');
const { sleep } = require('../../models/util');
const event = "playerQueue";

const SUCCESS = { "state": 200, "msg": "SUCCESS", "data": {} };
const NO_AUTH = { "state": 401, "msg": "TOKEN_NOT_GOOD", "data": null };
const ERROR = { "state": 500, "msg": "INTERNAL_SERVER_ERROR", "data": null };

const getClientData = async (client) => {
    const clientID = client.id;
    const sessionID = client.handshake.headers['session-id'];
    const session = JSON.parse(await redis.getSess(sessionID));
    return { clientID, userID: session.userID };
}

module.exports = function (client) {
    client.on(event, async (message) => {
        console.log(client.id, event);
        // Check token is valid
        try {
            await auth(client.handshake);
        } catch (err) {
            client.emit(event, JSON.stringify(NO_AUTH));
            return;
        }

        try {
            // get user data
            const clientData = await getClientData(client);

            // if player already in playerQueue send error
            const queue = await redis.listValue(redis.listKey.playerQueue);
            const playerQueue = queue.map(item => JSON.parse(item));
            const find = playerQueue.find(item => item.userID === clientData.userID);
            if (find) {
                client.emit(event, JSON.stringify({ ...SUCCESS, "msg": "PLAYER_ALREADY_IN_QUEUE" }));
                return;
            }

            // push player to player queue (redis)
            redis.pushList(redis.listKey.playerQueue, JSON.stringify(clientData));

            // send player not found msg
            while (await redis.getPlayer(clientData.clientID) === undefined) {
                client.emit(event, JSON.stringify({ ...SUCCESS, "msg": "PLAYER_NOT_FOUND" }));
                await sleep(5);
            }

            // get player game data from redis
            const data = await redis.getPlayer(clientData.clientID);
            client.emit(event, JSON.stringify({ ...SUCCESS, "msg": "PLAYER_FOUND", data }))
        } catch (err) {
            console.error(err);
            client.emit(event, JSON.stringify(ERROR));
        }
    })

    const disconnect = async (client) => {
        const clientData = await getClientData(client);
        try {
            await redis.deleteListValue(redis.listKey.playerQueue, JSON.stringify(clientData));
        } catch (err) {
            console.log('remove player in player queue error');
            console.log(err);
        }
        client.disconnect();
    }

    client.on('playerQueue:cancel', async () => await disconnect(client))

    client.on('disconnect', async () => await disconnect(client))
}