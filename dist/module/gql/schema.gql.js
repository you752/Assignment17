"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
const post_schema_gql_1 = require("../post/gql/post.schema.gql");
const query = new graphql_1.GraphQLObjectType({
    name: "RootDirQuery",
    fields: {
        ...post_schema_gql_1.postSchemaGQL.registerQuery(),
    },
});
const mutation = new graphql_1.GraphQLObjectType({
    name: "RootDirMutation",
    fields: {
        ...post_schema_gql_1.postSchemaGQL.registerMutation,
    },
});
exports.schema = new graphql_1.GraphQLSchema({ query, mutation });
