const { mergeSchemas } = require('@graphql-tools/schema');
const { graphqlHTTP } = require('express-graphql');
const { applyMiddleware } = require('graphql-middleware');
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

// migration
require('./migration');

// routers
const User = require('./routers/user');
const Card = require('./routers/card');

const schema = mergeSchemas({
    schemas: [User, Card]
});

const authMiddleware = async (resolve, root, args, req, info) => {
    const authorization = req.headers.authorization;
    const origin = req.get('origin');
    const auth = oauth(origin);
    console.log(info.fieldName);
    if (info.fieldName !== 'UserLogin') {
        try {
            await auth.getTokenInfo(authorization)
        } catch (err) {
            return Promise.reject(new Error('TOKEN_NOT_GOOD'));
        }
    }
    return await resolve(root, args, req, info);
};

const schemaWithMiddleware = applyMiddleware(schema, authMiddleware);

server.use('/', graphqlHTTP({
    schema: schemaWithMiddleware,
    graphiql: debug,
    customFormatErrorFn: (err) => {
        return {
            message: err.message,
            path: err.path
        }
    }
}))

server.listen(port);
console.log(`🚀 Bonk doge Server ready at http://localhost:${port}`);
