const auth = require('../../models/auth');
const event = "mainGame";

module.exports = function (client) {
    client.on(event, async (message) => {
        try {
            const {
                cmd,
                data
            } = JSON.parse(message);

            // Check token is vaild
            await auth(client.handshake);

            const res = {

            }
            client.emit(event, JSON.stringify({ "msg": 'hi' }));
        } catch (err) {
            console.log(err.message);
            client.disconnect();
        }
    })

    client.on('disconnect', (res) => {
        console.log(res);
        client.disconnect();
    })
}