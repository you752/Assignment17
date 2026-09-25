"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const error_responce_1 = require("../../common/exception/error.responce");
const user_model_1 = require("../../database/model/user.model");
const chatRepo_1 = require("./chatRepo");
class ChatService {
    chatRepository = new chatRepo_1.ChatRepository();
    async sendMessage(data, senderId) {
        if (senderId === data.recipientId) {
            throw new error_responce_1.BadRequestException("You cannot send a message to yourself");
        }
        if (!mongoose_1.Types.ObjectId.isValid(data.recipientId)) {
            throw new error_responce_1.BadRequestException("Invalid recipientId");
        }
        const recipient = await user_model_1.userModel.findById(data.recipientId).select("_id");
        if (!recipient) {
            throw new error_responce_1.NotFoundException("Recipient not found");
        }
        return this.chatRepository.create({
            senderId,
            recipientId: data.recipientId,
            content: data.content,
        });
    }
    async getConversation(userId, otherUserId) {
        if (!mongoose_1.Types.ObjectId.isValid(otherUserId)) {
            throw new error_responce_1.BadRequestException("Invalid userId");
        }
        return this.chatRepository.findAll({
            filter: {
                $or: [
                    { senderId: userId, recipientId: otherUserId },
                    { senderId: otherUserId, recipientId: userId },
                ],
            },
            lean: true,
        }).then((messages) => messages.sort((first, second) => (first.createdAt?.getTime() ?? 0) -
            (second.createdAt?.getTime() ?? 0)));
    }
    async markConversationRead(userId, otherUserId) {
        return this.chatRepository.updateOne({
            filter: {
                senderId: otherUserId,
                recipientId: userId,
                readAt: { $exists: false },
            },
            data: { readAt: new Date() },
        });
    }
}
exports.ChatService = ChatService;
