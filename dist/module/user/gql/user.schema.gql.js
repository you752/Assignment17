"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_type_gql_1 = require("./user.type.gql");
const user_args_gql_1 = require("./user.args.gql");
const user_resolver_sql_1 = __importDefault(require("./user.resolver.sql"));
class user {
    constructor() { }
    sigup() {
        return {
            name: 'RootQueryType',
            fields: {
                hello: {
                    type: user_type_gql_1.hellotype,
                    resolve: user_resolver_sql_1.default.hellowres,
                    args: user_args_gql_1.helloargs
                }
            }
        };
    }
}
