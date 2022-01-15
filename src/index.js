const { mergeSchemas } = require('@graphql-tools/schema');
const { graphqlHTTP } = require('express-graphql');
const { graphqlUploadExpress } = require('graphql-upload');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const expressSession = require('express-session');
const redis = require('./models/redis');
const auth = require('./models/auth');
const oauth = require('./models/oauth');

const server = express();
const RedisStore = require('connect-redis')(expressSession);
const debug = process.env.DEBUG === 'true';
const port = process.env.API_PORT | '4000';

server.use(express.json())
server.use(cors());
morgan.token('body', (req, res) =>
    JSON.stringify(req.body)
        .replace(/\t/g, '')
        .replace(/\\n/g, '')
        .replace(/\\/g, '')
        .replace(/[ ]+/g, ' ')
        .replace(/[ ]?:[ ]?/g, ': ')
);
morgan.token('session-id', (req, res) => `[${req.headers['session-id']}]`);
server.use(morgan(function (tokens, req, res) {
    return [
        tokens.date(req, res, 'iso'),
        tokens.status(req, res),
        tokens.method(req, res),
        tokens.url(req, res),
        tokens['session-id'](req, res),
        '-',
        tokens['response-time'](req, res), 'ms',
        '-',
        'length', tokens.res(req, res, 'content-length'),
        '-',
        tokens.body(req, res)
    ].join(' ')
}));

// Session
server.use(expressSession({
    store: new RedisStore({ client: redis.redisClient }),
    secret: process.env.TOKEN,
    saveUninitialized: false,
    resave: false,
}))

// routers
const User = require('./routers/user');
const Card = require('./routers/card');

const schema = mergeSchemas({
    schemas: [User, Card]
});

const authMiddleware = async (req, res, next) => {
    const graphql = req.body.query;
    const regex = /(?:mutation|query)(?:\(.*\))?(?: |\r|\n)*{(?: |\r|\n)*([A-Za-z_]+)/gi.exec(graphql);
    const filter = ['userlogin', '__schema'];

    if (!regex)
        res.status(500).send({ errors: [{ message: 'PARSE_QUERY_ERROR' }], data: {} });
    else if (filter.some(mutation => regex[1].toLocaleLowerCase() === mutation))
        next();
    else {
        try {
            await auth(req);
            next();
        } catch (err) {
            await redis.delSess(req.headers['session-id']);
            console.log('authMiddleware error: ' + err);
            res.status(401).send({ errors: [{ message: 'TOKEN_NOT_GOOD' }], data: { [`${regex[1]}`]: null } });
        }
    }
}

const setAuth = async (req, res, next) => {
    const sessionID = req.headers['session-id'];
    const origin = req.get('origin');
    const auth = oauth(origin);
    const session = await redis.getSess(sessionID);
    if (session) {
        const { tokens } = JSON.parse(session);
        auth.setCredentials(tokens);
    }
    req.auth = auth;
    next();
}

server.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
server.post('*', setAuth);
server.post('*', authMiddleware);

server.use('/', graphqlHTTP({
    schema,
    graphiql: debug,
    customFormatErrorFn: (err) => {
        return {
            message: err.message,
            path: err.path
        }
    }
}))

require('./migration').then(() => {
    server.listen(port);
    console.log(`🚀 Bonk doge Server ready at http://localhost:${port}`);

    // run central control system
    require("./socket/centralControlSystem")();

    require('./socket');
});