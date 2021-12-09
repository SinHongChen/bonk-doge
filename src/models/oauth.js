const { google } = require('googleapis');

const oauth2Client = (redirect) => {
    return new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        redirect
    );
}

module.exports = oauth2Client;