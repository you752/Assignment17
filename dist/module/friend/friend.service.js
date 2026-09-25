"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendservice = void 0;
const friendRepo_1 = require("./friendRepo");
const friend_enum_1 = require("../../common/enum/friend.enum");
const mongoose_1 = require("mongoose");
const userRepo_1 = require("../user/userRepo");
const multer_1 = require("../../common/utils/multer/multer");
class friendservice {
    FriendRepository;
    userRepository;
    constructor() {
        this.FriendRepository = new friendRepo_1.FriendRepository();
        this.userRepository = new userRepo_1.UserRepository();
    }
    async sendFriendRequest(data) {
        if (data.userId === data.friendId) {
            throw new Error("Cannot send friend request to yourself");
        }
        const existing = await this.FriendRepository.findOne({
            filter: {
                $or: [
                    { userId: data.userId, friendId: data.friendId },
                    { userId: data.friendId, friendId: data.userId },
                ],
            },
        });
        if (existing) {
            if (existing.status === friend_enum_1.FriendStatus.ACCEPTED) {
                throw new Error("You are already friends with this user");
            }
            if (existing.status === friend_enum_1.FriendStatus.PENDING) {
                throw new Error("A pending friend request already exists");
            }
            return this.FriendRepository.updateOne({
                filter: { _id: existing._id },
                data: { userId: data.userId, friendId: data.friendId, status: friend_enum_1.FriendStatus.PENDING },
            });
        }
        return this.FriendRepository.create({
            userId: data.userId,
            friendId: data.friendId,
            status: friend_enum_1.FriendStatus.PENDING,
        });
    }
    async acceptFriendRequest(data) {
        let existing;
        if (data.requestId && mongoose_1.Types.ObjectId.isValid(data.requestId)) {
            existing = await this.FriendRepository.findOne({
                filter: { _id: data.requestId, status: friend_enum_1.FriendStatus.PENDING },
            });
        }
        if (!existing && data.friendId) {
            existing = await this.FriendRepository.findOne({
                filter: {
                    $or: [
                        { userId: data.friendId, friendId: data.userId, status: friend_enum_1.FriendStatus.PENDING },
                        { userId: data.userId, friendId: data.friendId, status: friend_enum_1.FriendStatus.PENDING },
                    ],
                },
            });
        }
        if (!existing) {
            throw new Error("No pending friend request found");
        }
        return this.FriendRepository.updateOne({
            filter: { _id: existing._id },
            data: { status: friend_enum_1.FriendStatus.ACCEPTED },
        });
    }
    async rejectFriendRequest(data) {
        let existing;
        if (data.requestId && mongoose_1.Types.ObjectId.isValid(data.requestId)) {
            existing = await this.FriendRepository.findOne({
                filter: { _id: data.requestId, status: friend_enum_1.FriendStatus.PENDING },
            });
        }
        if (!existing && data.friendId) {
            existing = await this.FriendRepository.findOne({
                filter: {
                    $or: [
                        { userId: data.friendId, friendId: data.userId, status: friend_enum_1.FriendStatus.PENDING },
                        { userId: data.userId, friendId: data.friendId, status: friend_enum_1.FriendStatus.PENDING },
                    ],
                },
            });
        }
        if (!existing) {
            throw new Error("No pending friend request found");
        }
        return this.FriendRepository.updateOne({
            filter: { _id: existing._id },
            data: { status: friend_enum_1.FriendStatus.REJECTED },
        });
    }
    async getFriends(userId) {
        const friendDocs = await this.FriendRepository.findAll({
            filter: {
                $or: [
                    { userId, status: friend_enum_1.FriendStatus.ACCEPTED },
                    { friendId: userId, status: friend_enum_1.FriendStatus.ACCEPTED },
                ],
            },
            lean: true,
        });
        const otherUserIds = friendDocs.map((doc) => doc.userId === userId ? doc.friendId : doc.userId).filter(Boolean);
        if (otherUserIds.length === 0)
            return [];
        const users = await this.userRepository.findAll({
            filter: { _id: { $in: otherUserIds } },
            select: "_id username firstName lastName email unique_name profileImage",
            lean: true,
        });
        return users.map((user) => ({
            ...user,
            profileImage: (0, multer_1.publicImageUrl)(user.profileImage),
        }));
    }
    async friendList(userId) {
        const friends = await this.FriendRepository.findAll({
            filter: {
                $or: [
                    { userId, status: friend_enum_1.FriendStatus.ACCEPTED },
                    { friendId: userId, status: friend_enum_1.FriendStatus.ACCEPTED },
                ],
            },
            lean: true,
        });
        return friends;
    }
    async getFriendRequests(userId) {
        const requests = await this.FriendRepository.findAll({
            filter: {
                friendId: userId,
                status: friend_enum_1.FriendStatus.PENDING,
            },
            lean: true,
        });
        if (requests.length === 0)
            return [];
        const senderIds = requests.map((req) => req.userId).filter(Boolean);
        const senders = await this.userRepository.findAll({
            filter: { _id: { $in: senderIds } },
            select: "_id username firstName lastName email unique_name profileImage",
            lean: true,
        });
        const sendersById = new Map(senders.map((s) => [String(s._id), s]));
        return requests.map((req) => {
            const senderObj = sendersById.get(String(req.userId));
            return {
                ...req,
                sender: senderObj
                    ? {
                        ...senderObj,
                        profileImage: (0, multer_1.publicImageUrl)(senderObj.profileImage),
                    }
                    : { _id: req.userId },
            };
        });
    }
    async blockUser(data) {
        const existing = await this.FriendRepository.findOne({
            filter: {
                $or: [
                    { userId: data.userId, friendId: data.friendId },
                    { userId: data.friendId, friendId: data.userId },
                ],
            },
        });
        if (existing) {
            await this.FriendRepository.updateOne({
                filter: { _id: existing._id },
                data: { status: friend_enum_1.FriendStatus.BLOCKED },
            });
        }
        else {
            await this.FriendRepository.create({
                userId: data.userId,
                friendId: data.friendId,
                status: friend_enum_1.FriendStatus.BLOCKED,
            });
        }
        return { blocked: true };
    }
    async cancelFriendRequest(data) {
        const existing = await this.FriendRepository.findOne({
            filter: {
                userId: data.userId,
                friendId: data.friendId,
                status: friend_enum_1.FriendStatus.PENDING,
            },
        });
        if (!existing) {
            throw new Error("No pending friend request found");
        }
        return this.FriendRepository.deleteOne({
            filter: { _id: existing._id },
        });
    }
}
exports.friendservice = friendservice;
