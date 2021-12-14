const { mergeSchemas } = require('@graphql-tools/schema');
const { graphqlHTTP } = require('express-graphql');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const oauth = require('./models/oauth');

const server = express();
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
server.use(morgan(function (tokens, req, res) {
    return [
        tokens.date(req, res, 'iso'),
        tokens.status(req, res),
        tokens.method(req, res),
        tokens.url(req, res),
        tokens['remote-addr'](req, res),
        '-',
        tokens['response-time'](req, res), 'ms',
        '-',
        'length', tokens.res(req, res, 'content-length'),
        '-',
        tokens.body(req, res)
    ].join(' ')
}));

// routers
const User = require('./routers/user');
const Card = require('./routers/card');

const schema = mergeSchemas({
    schemas: [User, Card]
});

const authMiddleware = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const origin = req.get('origin');
    const auth = oauth(origin);
    const graphql = req.body.query;
    const regex = /(?:mutation|query)(?: |\r|\n)*{(?: |\r|\n)*([A-Za-z_]+)/gi.exec(graphql)
    
    if (!regex)
        res.status(500).send({ errors: [{ message: 'PARSE_QUERY_ERROR' }] });
    else if (regex[1].toLocaleLowerCase() !== 'userlogin') {
        try {
            await auth.getTokenInfo(authorization)
            next();
        } catch (err) {
            console.log('authMiddleware error: ' + err);
            res.status(401).send({ errors: [{ message: 'TOKEN_NOT_GOOD' }] });
        }
    } else
        next();
}

server.use(authMiddleware);

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

    require('./socket');
});