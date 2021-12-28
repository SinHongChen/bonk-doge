const auth = require('../../models/auth');
const event = "mainGame";

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
            const {
                cmd,
                data
            } = JSON.parse(message);
            const sessionID = client.handshake.headers['session-id'];

            // res
            console.log(JSON.stringify({ ...SUCCESS }));
            client.emit(event, JSON.stringify({ ...SUCCESS }));
        } catch (err) {
            console.error(err);
            client.emit(event, JSON.stringify({ ...ERROR }));
        }
    })

    client.on('disconnect', (res) => {
        console.log(res);
        client.disconnect();
    })
}