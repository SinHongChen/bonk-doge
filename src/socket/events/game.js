const oauth = require('../../models/oauth');
const event = "mainGame";

module.exports = function (client) {
    client.on(event, async (message) => {
        try {
            const {
                token,
                cmd,
                data
            } = JSON.parse(message);

            // Check token is vaild
            const auth = oauth(client.handshake.headers.origin);
            await auth.getTokenInfo(token);
            // console.log(await auth.getTokenInfo(token));

            const res = {

            }
            client.emit(event, JSON.stringify({ "msg": 'hi' }));
        } catch (err) {
            console.log(err);
            client.disconnect();
        }
    })

    client.on('disconnect', (res) => {
        console.log(res);
        client.disconnect();
    })
}