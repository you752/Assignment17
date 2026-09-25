"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const database_resposatery_1 = require("../../common/reposatery/database.resposatery");
const chatMessage_model_1 = require("../../database/model/chatMessage.model");
class ChatRepository extends database_resposatery_1.DatabaseRepository {
    constructor() {
        super(chatMessage_model_1.chatMessageModel);
    }
}
exports.ChatRepository = ChatRepository;
