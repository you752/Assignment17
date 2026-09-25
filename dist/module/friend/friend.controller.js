"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const friend_service_1 = require("./friend.service");
const success_responce_1 = require("../../common/exception/success.responce");
const auth_1 = require("../../common/middleware/auth/auth");
const vaildation_1 = require("../../common/vaildation/vaildation");
const friend_validation_1 = require("./friend.validation");
const realtime_module_1 = require("../realtime/realtime.module");
const catchAsync_1 = require("../../common/utils/catchAsync");
const router = (0, express_1.Router)();
router.post("/sendFriendRequest", (0, auth_1.auth)(), (0, vaildation_1.validate)(friend_validation_1.friendValidation), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friend_service_1.friendservice();
    const payload = {
        userId: req.user.id,
        friendId: req.body.friendId,
    };
    const request = await friendService.sendFriendRequest(payload);
    if (req.body.friendId) {
        realtime_module_1.realtimeModule.emitToUser(req.body.friendId, "friend:request", request);
    }
    (0, success_responce_1.SuccessResponse)({
        res,
        message: "Friend request sent successfully",
        data: request,
    });
}));
router.post("/acceptFriendRequest", (0, auth_1.auth)(), (0, vaildation_1.validate)(friend_validation_1.friendValidation), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friend_service_1.friendservice();
    const payload = {
        userId: req.user.id,
        friendId: req.body.friendId,
        requestId: req.body.requestId,
    };
    const friendship = await friendService.acceptFriendRequest(payload);
    if (req.body.friendId) {
        realtime_module_1.realtimeModule.emitToUser(req.body.friendId, "friend:accepted", friendship);
    }
    (0, success_responce_1.SuccessResponse)({
        res,
        message: "Friend request accepted successfully",
        data: friendship,
    });
}));
router.post("/rejectFriendRequest", (0, auth_1.auth)(), (0, vaildation_1.validate)(friend_validation_1.friendValidation), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friend_service_1.friendservice();
    const payload = {
        userId: req.user.id,
        friendId: req.body.friendId,
        requestId: req.body.requestId,
    };
    const friendship = await friendService.rejectFriendRequest(payload);
    if (req.body.friendId) {
        realtime_module_1.realtimeModule.emitToUser(req.body.friendId, "friend:rejected", friendship);
    }
    (0, success_responce_1.SuccessResponse)({
        res,
        message: "Friend request rejected successfully",
        data: friendship,
    });
}));
router.get("/getFriends", (0, auth_1.auth)(), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friend_service_1.friendservice();
    const friends = await friendService.getFriends(req.user.id);
    (0, success_responce_1.SuccessResponse)({
        res,
        message: "Friends retrieved successfully",
        data: friends,
    });
}));
router.get("/getFriendRequests", (0, auth_1.auth)(), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friend_service_1.friendservice();
    const requests = await friendService.getFriendRequests(req.user.id);
    (0, success_responce_1.SuccessResponse)({
        res,
        message: "Friend requests retrieved successfully",
        data: requests,
    });
}));
router.post("/blockUser", (0, auth_1.auth)(), (0, vaildation_1.validate)(friend_validation_1.friendValidation), (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friend_service_1.friendservice();
    const payload = {
        userId: req.user.id,
        friendId: req.body.friendId || req.body.userId,
    };
    const result = await friendService.blockUser(payload);
    (0, success_responce_1.SuccessResponse)({
        res,
        message: "User blocked successfully",
        data: result,
    });
}));
exports.default = router;
