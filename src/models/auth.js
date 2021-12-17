const oauth = require('./oauth');
const redis = require('./redis');

const auth = async (req) => {
    const sessionID = req.headers['session-id'];
    const origin = req.headers['origin'];
    const auth = oauth(origin);
    let access_token = '';
    let refresh_token = '';
    let session = {};

    session = await redis.getSess(sessionID);
    if (session) {
        const sessionInfo = JSON.parse(session);
        access_token = sessionInfo.access_token;
        refresh_token = sessionInfo.refresh_token;
    }

    auth.setCredentials({ access_token, refresh_token });
    const res = await auth.getAccessToken();
    if (res.token !== access_token) {
        let sessionInfo = JSON.parse(session);
        sessionInfo.access_token = res.token;
        await redis.setSess(sessionID, JSON.stringify(sessionInfo));
        access_token = res.token;
    }
    return await auth.getTokenInfo(access_token);
}

module.exports = auth;