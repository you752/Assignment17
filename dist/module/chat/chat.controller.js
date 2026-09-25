"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../common/middleware/auth/auth");
const success_responce_1 = require("../../common/exception/success.responce");
const vaildation_1 = require("../../common/vaildation/vaildation");
const realtime_module_1 = require("../realtime/realtime.module");
const chat_service_1 = require("./chat.service");
const chat_validation_1 = require("./chat.validation");
const router = (0, express_1.Router)();
router.get("/:userId", (0, auth_1.auth)(), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { userId } = req.params;
    if (typeof userId !== "string") {
        return res.status(400).json({ message: "userId is required" });
    }
    const messages = await new chat_service_1.ChatService().getConversation(req.user.id, userId);
    return (0, success_responce_1.SuccessResponse)({
        res,
        message: "Conversation retrieved successfully",
        data: messages,
    });
});
router.post("/message", (0, auth_1.auth)(), (0, vaildation_1.validate)(chat_validation_1.sendMessageValidation), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const message = await new chat_service_1.ChatService().sendMessage(req.body, req.user.id);
    realtime_module_1.realtimeModule.deliverMessage(message);
    return (0, success_responce_1.SuccessResponse)({
        res,
        status: 201,
        message: "Message sent successfully",
        data: message,
    });
});
router.patch("/:userId/read", (0, auth_1.auth)(), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { userId } = req.params;
    if (typeof userId !== "string") {
        return res.status(400).json({ message: "userId is required" });
    }
    const result = await new chat_service_1.ChatService().markConversationRead(req.user.id, userId);
    realtime_module_1.realtimeModule.emitToUser(userId, "chat:read", {
        userId: req.user.id,
    });
    return (0, success_responce_1.SuccessResponse)({
        res,
        message: "Conversation marked as read",
        data: result,
    });
});
exports.default = router;
