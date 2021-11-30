const { mergeSchemas } = require('@graphql-tools/schema');
const express = require('express');
const { graphqlHTTP } = require('express-graphql');

const server = express();
const debug = process.env.DEBUG === 'true';
const port = process.env.API_PORT | '4000';

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
