"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onePostTypes = exports.CreatePostTypes = exports.PostListTypes = void 0;
const graphql_1 = require("graphql");
const user_type_gql_1 = require("../../user/gql/user.type.gql");
exports.PostListTypes = new graphql_1.GraphQLObjectType({
    name: "PostListTypes",
    fields: {
        message: { type: graphql_1.GraphQLString }
    },
});
exports.CreatePostTypes = new graphql_1.GraphQLObjectType({
    name: "PostListTypes",
    fields: {
        message: { type: graphql_1.GraphQLString },
    },
});
exports.onePostTypes = new graphql_1.GraphQLObjectType({
    name: "onePostTypes",
    fields: {
        userId: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        content: { type: graphql_1.GraphQLString },
        image: { type: graphql_1.GraphQLString },
        comments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        likes: { type: new graphql_1.GraphQLList(user_type_gql_1.OneUserType) },
        tags: { type: new graphql_1.GraphQLList(user_type_gql_1.OneUserType) },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
        deletedAt: { type: graphql_1.GraphQLString },
        restoredAt: { type: graphql_1.GraphQLString },
    },
});
