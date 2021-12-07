const { mergeSchemas } = require('@graphql-tools/schema');
const { graphqlHTTP } = require('express-graphql');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

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

server.use('/', graphqlHTTP({
    schema: mergeSchemas({
        schemas: [User]
    }),
    graphiql: debug
}))

server.listen(port);
console.log(`🚀 Bonk doge Server ready at http://localhost:${port}`);
