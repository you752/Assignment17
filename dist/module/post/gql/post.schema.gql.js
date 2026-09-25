"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postSchemaGQL = void 0;
const post_args_gql_1 = require("./post.args.gql");
const post_resolver_sql_1 = __importDefault(require("./post.resolver.sql"));
const post_type_gql_1 = require("./post.type.gql");
class postSchema {
    constructor() { }
    registerQuery() {
        return {
            postlist: {
                name: "PostListQuery",
                type: post_type_gql_1.onePostTypes,
                resolve: post_resolver_sql_1.default.PostList,
                args: post_args_gql_1.PostListargs,
            },
        };
    }
    registerMutation() {
        return {
            addpost: {
                name: "CreatePostMutation",
                type: post_type_gql_1.CreatePostTypes,
                resolve: post_resolver_sql_1.default.createPost,
                args: post_args_gql_1.addPostArgs,
            },
        };
    }
}
exports.postSchemaGQL = new postSchema;
