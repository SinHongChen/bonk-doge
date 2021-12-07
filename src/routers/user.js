const gql = require('graphql-tag');
const User = require('../models/user');
const { makeExecutableSchema } = require('@graphql-tools/schema');

module.exports = makeExecutableSchema({
    typeDefs: gql`
        type Query {
            UserList: [User!]
            UserGet(ID: ID!): User
        }
        type Mutation {
            UserLogin(Name: String!, Email: String!): User
            UserUpdate(ID: ID!, Name: String, Email: String): User
            UserDelete(ID: ID!): String
        }
        type User {
            ID: ID!
            Name: String!
            Email: String!
        }
    `
    ,
    resolvers: {
        Query: {
            UserList: () => User.list(),
            UserGet: (_, { ID }) => User.get(ID)
        },
        Mutation: {
            UserLogin: (_, Args) => User.login(Args),
            UserUpdate: (_, Args) => User.update(Args),
            UserDelete: (_, { ID }) => User.delete(ID),
        }
    }
})