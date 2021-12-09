const gql = require('graphql-tag');
const Card = require('../models/card');
const { makeExecutableSchema } = require('@graphql-tools/schema');

module.exports = makeExecutableSchema({
    typeDefs: gql`
        type Query {
            CardList(Keyword: String, Category: String, Nature_ID: Int): [Card!]
        }
        type Mutation {
            CardCreate(Name: String!, Email: String!): Card
            CardUpdate(ID: ID!, Name: String, Email: String): Card
            CardDelete(ID: ID!): String
            GenCardUUID(Name: String!): String!
        }
        type Card {
            UUID: String!
            Name: String!
            Img: String!
            Img_Url: String!
            Category: String!
            Effect_Assert: String
            Effect_Description: String
            
            Nature_ID: Int
            Nature: Nature

            Attribute_ID: Int
            Attribute: Attribute
            Star: Int
            Race_ID: Int
            Race: Race
            Attack: Int
            Defense: Int
        }
        type Nature {
            ID: ID!
            Name: String!
        }
        type Attribute {
            ID: ID!
            Name: String!
        }
        type Race {
            ID: ID!
            Name: String!
        }
    `
    ,
    resolvers: {
        Query: {
            CardList: (_, args) => Card.list(args),
        },
        Mutation: {
            CardCreate: (_, args) => Card.create(args),
            CardUpdate: (_, args) => Card.update(args),
            CardDelete: (_, { UUID }) => Card.delete(UUID),
            GenCardUUID: (_, { Name }) => Card.genCardUUID(Name),
        },
        Card: {
            Img_Url: ({ Img }) => Img,
            Nature: ({ Nature_ID }) => Nature_ID ? Card.nature(Nature_ID) : null,
            Attribute: ({ Attribute_ID }) => Attribute_ID ? Card.attribute(Attribute_ID) : null,
            Race: ({ Race_ID }) => Race_ID ? Card.race(Race_ID) : null,
            Category: ({ Nature_ID }) => Nature_ID ? 'Effect' : 'Role'
        }
    }
})