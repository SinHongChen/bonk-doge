const gql = require('graphql-tag');
const User = require('../models/user');
const { makeExecutableSchema } = require('@graphql-tools/schema');

module.exports = makeExecutableSchema({
    typeDefs: gql`
        type Query {
            userList: [User!]
            userGet(id: ID!): User
        }
        type Mutation {
            userCreate(name: String!, email: String!): User
            userUpdate(id: ID!, name: String, email: String): User
            userDelete(id: ID!): UserRemoveID
        }
        type User {
            id: ID!
            name: String!
            email: String!
            hello: String!
        }
        type UserRemoveID {
            id: ID!
        }
    `
    ,
    resolvers: {
        Query: {
            userList: () => User.list(),
            userGet: (_, { id }) => User.get(id)
        },
        Mutation: {
            userCreate: (_, args) => User.create(args),
            userUpdate: (_, args) => User.update(args),
            userDelete: (_, { id }) => User.delete(id),
        },
        User: {
            hello: ({ name }) => 'hello ' + name
        }
    }
})