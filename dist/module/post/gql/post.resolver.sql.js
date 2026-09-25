"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_service_1 = require("../post.service");
const auth_1 = require("../../../common/middleware/auth/auth");
const user_model_1 = require("../../../database/model/user.model");
class PostResolver {
    postservice;
    constructor() {
        this.postservice = new post_service_1.PostService();
    }
    async authenticate(context) {
        const authorization = context.req.headers.authorization;
        if (!authorization)
            throw new Error("Authorization header is required");
        const [bearer, token] = authorization.split(" ");
        if (bearer !== "Bearer" || !token) {
            throw new Error("Invalid authorization format");
        }
        if (await auth_1.TokenService.isRevoked(token)) {
            throw new Error("Token has been revoked");
        }
        const decoded = await auth_1.TokenService.verifyAccessToken(token);
        const user = await user_model_1.userModel.findById(decoded.id);
        if (!user)
            throw new Error("User not found");
        return user;
    }
    PostList = async (parent, args, context) => {
        await this.authenticate(context);
        return this.postservice.getPostsGQL();
    };
    createPost = async (parent, args, context) => {
        const user = await this.authenticate(context);
        return this.postservice.creatPostGql({ ...args, userId: user._id });
    };
}
const postResolver = new PostResolver();
exports.default = postResolver;
