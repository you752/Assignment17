"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const error_responce_1 = require("../../common/exception/error.responce");
const commentRepo_1 = require("./commentRepo");
const userRepo_1 = require("../user/userRepo");
const multer_1 = require("../../common/utils/multer/multer");
class CommentService {
    commentRepository;
    userRepository;
    constructor() {
        this.commentRepository = new commentRepo_1.CommentRepository();
        this.userRepository = new userRepo_1.UserRepository();
    }
    async withAuthors(comments) {
        const userIds = [...new Set(comments.map((comment) => comment.userId).filter(Boolean))];
        const users = await this.userRepository.findAll({
            filter: { _id: { $in: userIds } },
            select: "_id username firstName lastName profileImage",
            lean: true,
        });
        const usersById = new Map(users.map((user) => [String(user._id), user]));
        return comments.map((comment) => {
            const authorObj = usersById.get(String(comment.userId));
            return {
                ...comment,
                author: authorObj
                    ? {
                        ...authorObj,
                        profileImage: (0, multer_1.publicImageUrl)(authorObj.profileImage),
                    }
                    : { _id: comment.userId },
            };
        });
    }
    async createComment(data, userId) {
        const created = await this.commentRepository.create({
            ...data,
            userId,
        });
        const plain = typeof created.toObject === "function" ? created.toObject() : created;
        return (await this.withAuthors([plain]))[0];
    }
    async getComments(postId) {
        const rawComments = await this.commentRepository.findAll({
            filter: { postId },
            lean: true,
        });
        const sorted = rawComments.sort((first, second) => {
            const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : 0;
            const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : 0;
            return firstDate - secondDate;
        });
        return this.withAuthors(sorted);
    }
    async updateComment(commentId, data, userId) {
        const comment = await this.commentRepository.findOneAndUpdate({
            filter: { _id: commentId, userId },
            data,
            lean: true,
        });
        if (!comment) {
            throw new error_responce_1.NotFoundException("Comment not found");
        }
        return (await this.withAuthors([comment]))[0];
    }
    async deleteComment(commentId, userId) {
        const result = await this.commentRepository.deleteOne({
            _id: commentId,
            userId,
        });
        if (result.deletedCount === 0) {
            throw new error_responce_1.NotFoundException("Comment not found");
        }
        return { deleted: true };
    }
}
exports.CommentService = CommentService;
