"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const error_responce_1 = require("../../common/exception/error.responce");
const postRepo_1 = require("./postRepo");
const userRepo_1 = require("../user/userRepo");
const multer_1 = require("../../common/utils/multer/multer");
const cloudinary_service_1 = require("../../common/service/cloudinary.service");
class PostService {
    postRepository;
    userRepository;
    constructor() {
        this.postRepository = new postRepo_1.PostRepository();
        this.userRepository = new userRepo_1.UserRepository();
    }
    async createPost(data, userId, image) {
        const post = {
            ...data,
            userId,
            title: "",
            comments: [],
            likes: [],
            tags: [],
            image: image ?? "",
        };
        const createdPost = await this.postRepository.create(post);
        return (await this.withAuthors([createdPost.toObject()]))[0];
    }
    async getPosts() {
        const posts = await this.postRepository.findAll({ lean: true });
        return this.withAuthors(posts);
    }
    async getPostsGQL() {
        let posts = this.postRepository.findAll({ lean: true });
        return posts;
    }
    async creatPostGql(data) {
        return this.postRepository.create(data);
    }
    async getUserPosts(userId) {
        const posts = await this.postRepository.findAll({
            filter: { userId },
            lean: true,
        });
        return this.withAuthors(posts);
    }
    async withAuthors(posts) {
        const userIds = [...new Set(posts.map((post) => post.userId).filter(Boolean))];
        const users = await this.userRepository.findAll({
            filter: { _id: { $in: userIds } },
            select: "_id username firstName lastName profileImage",
            lean: true,
        });
        const usersById = new Map(users.map((user) => [String(user._id), user]));
        return posts.map((post) => {
            const authorObj = usersById.get(String(post.userId));
            return {
                ...post,
                image: (0, multer_1.publicImageUrl)(post.image),
                author: authorObj
                    ? {
                        ...authorObj,
                        profileImage: (0, multer_1.publicImageUrl)(authorObj.profileImage),
                    }
                    : { _id: post.userId },
            };
        });
    }
    async updatePost(postId, data, userId, image) {
        const existingPost = await this.postRepository.findOne({
            filter: { _id: postId, userId },
            lean: true,
        });
        if (!existingPost) {
            throw new error_responce_1.NotFoundException("Post not found");
        }
        const updateData = {
            ...data,
            ...(image ? { image } : {}),
        };
        const post = await this.postRepository.findOneAndUpdate({
            filter: { _id: postId, userId },
            data: updateData,
            lean: true,
        });
        if (!post) {
            throw new error_responce_1.NotFoundException("Post not found");
        }
        if (image && existingPost.image !== image) {
            await (0, cloudinary_service_1.deleteImage)(existingPost.image);
        }
        return (await this.withAuthors([post]))[0];
    }
    async deletePost(postId, userId) {
        const post = await this.postRepository.findOne({
            filter: { _id: postId, userId },
            lean: true,
        });
        if (!post) {
            throw new error_responce_1.NotFoundException("Post not found");
        }
        const result = await this.postRepository.deleteOne({
            _id: postId,
            userId,
        });
        if (result.deletedCount === 0) {
            throw new error_responce_1.NotFoundException("Post not found");
        }
        await (0, cloudinary_service_1.deleteImage)(post.image);
        return { deleted: true };
    }
}
exports.PostService = PostService;
