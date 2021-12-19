const oauth = require('./oauth');
const redis = require('./redis');

const auth = async (req) => {
    const sessionID = req.headers['session-id'];
    const origin = req.headers['origin'];
    const auth = oauth(origin);
    let tokens = {};
    let session = "";

    session = await redis.getSess(sessionID);
    if (session) {
        const sessionInfo = JSON.parse(session);
        tokens = sessionInfo.tokens;
    }

    auth.setCredentials(tokens);
    const res = await auth.getAccessToken();
    if (res.token !== tokens.access_token) {
        console.log('refresh token success');
        tokens.access_token = res.token;
        // update session
        const sessionInfo = JSON.parse(session);
        sessionInfo.tokens = auth.credentials;
        await redis.setSess(sessionID, JSON.stringify(sessionInfo));
    }
    return await auth.getTokenInfo(tokens.access_token);
}

module.exports = auth;