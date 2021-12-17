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
            if (err.response)
                console.log(err.response.data); //err.response.data
            else
                console.log(err);
            client.disconnect();
        }
    })

    client.on('disconnect', (res) => {
        console.log(res);
        client.disconnect();
    })
}