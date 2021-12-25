const gql = require('graphql-tag');
const Card = require('../models/card');
const Deck = require('../models/deck');
const Minio = require('../models/minio');
const { GraphQLUpload } = require('graphql-upload');
const { makeExecutableSchema } = require('@graphql-tools/schema');

module.exports = makeExecutableSchema({
    typeDefs: gql`
        scalar Upload
        type Query {
            CardList(Keyword: String, Category: String, Nature_ID: Int): [Card!]
            CardGet(UUID: String): Card
            DeckList(User_ID: Int!): [Deck!]
            DeckGet(ID: ID!): Deck!
            NatureList: [Nature!]
            AttributeList: [Attribute!]
            RaceList: [Race!]
        }
        type Mutation {
            CardDelete(UUID: String!): String!
            RoleCardCreate(Name: String!, Img: Upload!, Attribute_ID: String!, Star: String!, Race_ID: String!, Effect_Assert: String, Effect_Description: String, Attack: String!, Defense: String!): String!
            RoleCardUpdate(UUID: String!, Name: String, Img: Upload, Attribute_ID: String, Star: String, Race_ID: String, Effect_Assert: String, Effect_Description: String, Attack: String, Defense: String): String!
            EffectCardCreate(Name: String!, Img: Upload!, Nature_ID: String!, Effect_Assert: String, Effect_Description: String): String!
            EffectCardUpdate(UUID: String!, Name: String, Img: Upload, Nature_ID: String, Effect_Assert: String, Effect_Description: String): String!
            DeckCreate(User_ID: Int!, Name: String!, UUID_Array: [String!]!): Deck!
            DeckUpdate(ID: ID!, Name: String!, UUID_Array: [String!]!): Deck!
            DeckDelete(ID: ID!): String!
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
        type Deck {
            ID: ID!
            Name: String!
            Img_Url: String
            Cards: [String!]
            CardsInfo: [Card!]
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
        Upload: GraphQLUpload,
        Query: {
            CardList: (_, args) => Card.list(args),
            CardGet: (_, { UUID }) => Card.get(UUID),
            DeckList: (_, args) => Deck.list(args),
            DeckGet: (_, args) => Deck.get(args),
            NatureList: () => Card.natureList(),
            AttributeList: () => Card.attributeList(),
            RaceList: () => Card.raceList(),
        },
        Mutation: {
            RoleCardCreate: (_, args) => Card.create('Role', args),
            RoleCardUpdate: (_, args) => Card.update('Role', args),
            EffectCardCreate: (_, args) => Card.create('Effect', args),
            EffectCardUpdate: (_, args) => Card.update('Effect', args),
            CardDelete: (_, { UUID }) => Card.delete(UUID),
            DeckCreate: (_, args) => Deck.create(args),
            DeckUpdate: (_, args) => Deck.update(args),
            DeckDelete: (_, { ID }) => Deck.delete(ID),
        },
        Card: {
            Img_Url: ({ Img }) => Minio.getPresignedUrl(Minio.buckets.card, Img),
            Nature: ({ Nature_ID }) => Nature_ID ? Card.nature(Nature_ID) : null,
            Attribute: ({ Attribute_ID }) => Attribute_ID ? Card.attribute(Attribute_ID) : null,
            Race: ({ Race_ID }) => Race_ID ? Card.race(Race_ID) : null,
            Category: ({ Nature_ID }) => Nature_ID ? 'Effect' : 'Role'
        },
        Deck: {
            Img_Url: ({ Cards }) => Cards.length > 0 ? Card.get(Cards[0]).then(card => Minio.getPresignedUrl(Minio.buckets.card, card.Img)) : null,
            CardsInfo: ({ Cards }) => Card.getCards(Cards),
        }
    }
})