"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPostArgs = exports.PostListargs = void 0;
const graphql_1 = require("graphql");
exports.PostListargs = {};
exports.addPostArgs = {
    title: { type: graphql_1.GraphQLString },
    content: { type: graphql_1.GraphQLString },
    userId: { type: graphql_1.GraphQLID },
    comments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
    likes: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
    tags: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
};
