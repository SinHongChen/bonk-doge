const auth = require('../../models/auth');
const redis = require('../../models/redis');
const { sleep } = require('../../models/util');
const event = "playerQueue";

const SUCCESS = { "state": 200, "msg": "SUCCESS", "data": {} };
const NO_AUTH = { "state": 401, "msg": "TOKEN_NOT_GOOD", "data": null };
const ERROR = { "state": 500, "msg": "INTERNAL_SERVER_ERROR", "data": null };

module.exports = function (client) {
    client.on(event, async (message) => {
        // Check token is valid
        try {
            await auth(client.handshake);
        } catch (err) {
            client.emit(event, JSON.stringify(NO_AUTH));
            return;
        }
        
        try {
            // get user data
            const clientID = client.id;
            const sessionID = client.handshake.headers['session-id'];
            const session = JSON.parse(await redis.getSess(sessionID));

            // push player to player queue (redis)
            redis.pushList(redis.listKey.playerQueue, JSON.stringify({ clientID, userID: session.userID }));

            // send player not found msg
            const keepalive = setInterval(() => {
                console.log("PLAYER_NOT_FOUND");
                client.emit(event, JSON.stringify({ ...SUCCESS, "msg": "PLAYER_NOT_FOUND" }));
            }, 5 * 1000);

            // wait distribution System response
            client.on("matchPlayer", (data) => {
                clearInterval(keepalive);
                console.log(data);
                // res
                client.emit(event, JSON.stringify({ ...SUCCESS, "msg": "PLAYER_FOUND", data }))
            });
        } catch (err) {
            console.error(err);
            client.emit(event, JSON.stringify(ERROR));
        }
    })

    client.on('disconnect', () => {
        client.disconnect();
    })
}