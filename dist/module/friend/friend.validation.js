"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendValidation = void 0;
const zod_1 = require("zod");
const friend_enum_1 = require("../../common/enum/friend.enum");
exports.friendValidation = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    friendId: zod_1.z.string().optional(),
    requestId: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(friend_enum_1.FriendStatus, {
        error: "status must be a valid FriendStatus",
    }).optional(),
});
