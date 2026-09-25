"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneUserType = exports.RoleEnumGQL = exports.ProviderEnumGQL = exports.GenderEnumGQL = exports.hellotype = void 0;
const graphql_1 = require("graphql");
const user_enum_1 = require("../../../common/enum/user.enum");
exports.hellotype = new graphql_1.GraphQLObjectType({
    name: "HelloType",
    fields: {
        name: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        password: { type: graphql_1.GraphQLString },
    },
});
exports.GenderEnumGQL = new graphql_1.GraphQLEnumType({
    name: "GenderEnumsGQL",
    values: {
        Male: { value: user_enum_1.GenderEnum.MALE },
        Female: { value: user_enum_1.GenderEnum.FEMALE },
    },
});
exports.ProviderEnumGQL = new graphql_1.GraphQLEnumType({
    name: "ProviderEnumsGQL",
    values: {
        System: { value: user_enum_1.providerEnum.SYSTEM },
        Google: { value: user_enum_1.providerEnum.GOOGLE },
    },
});
exports.RoleEnumGQL = new graphql_1.GraphQLEnumType({
    name: "RoleEnumsGQL",
    values: {
        User: { value: user_enum_1.UserRoleEnum.USER },
        Admin: { value: user_enum_1.UserRoleEnum.ADMIN },
    },
});
exports.OneUserType = new graphql_1.GraphQLObjectType({
    name: "OneUserType",
    fields: {
        userName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        firstName: { type: graphql_1.GraphQLString },
        lastName: { type: graphql_1.GraphQLString },
        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        phone: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        profilePic: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        password: { type: graphql_1.GraphQLString },
        confirmEmail: { type: graphql_1.GraphQLBoolean },
        gender: { type: exports.GenderEnumGQL },
        provider: { type: exports.ProviderEnumGQL },
        role: { type: exports.RoleEnumGQL },
    },
});
