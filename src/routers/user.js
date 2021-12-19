const gql = require('graphql-tag');
const User = require('../models/user');
const { makeExecutableSchema } = require('@graphql-tools/schema');

module.exports = makeExecutableSchema({
    typeDefs: gql`
        type Query {
            UserList: [User!]
            UserInfo: User
        }
        type Mutation {
            UserLogin(Code: String!): User
            UserLogout: String
            UserUpdate(ID: ID!, Name: String, Email: String): User
            UserDelete(ID: ID!): String
        }
        type User {
            ID: ID!
            Name: String!
            Email: String!
            Picture_Url: String
            Victory: Int!
            Defeat: Int!
            Session_ID: String!
        }
        type RefreshResult {
            Access_Token: String!
        }
    `
    ,
    resolvers: {
        Query: {
            UserList: () => User.list(),
            UserInfo: (_, __, req) => User.get(req),
        },
        Mutation: {
            UserLogin: (_, Args, req) => User.login(Args, req),
            UserLogout: (_, __, req) => User.logout(req),
            UserUpdate: (_, Args) => User.update(Args),
            UserDelete: (_, { ID }) => User.delete(ID),
        }
    }
})