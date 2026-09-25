"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeGateway = void 0;
const socket_io_1 = require("socket.io");
const mongoose_1 = require("mongoose");
const user_enum_1 = require("../../../common/enum/user.enum");
const auth_1 = require("../../../common/middleware/auth/auth");
const redis_service_1 = require("../../../common/redis/redis.service");
const chat_service_1 = require("../chat.service");
const userRoom = (userId) => `user:${userId}`;
const postRoom = (postId) => `post:${postId}`;
class RealtimeGateway {
    namespace;
    initialize(httpServer) {
        const io = new socket_io_1.Server(httpServer, {
            cors: { origin: "*" },
        });
        this.namespace = io.of("/user");
        this.namespace.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (typeof token !== "string" || !token) {
                    return next(new Error("Unauthorized"));
                }
                if (await auth_1.TokenService.isRevoked(token)) {
                    return next(new Error("Token has been revoked"));
                }
                const decoded = await auth_1.TokenService.verifyAccessToken(token, user_enum_1.UserRoleEnum.USER);
                if (!decoded.id || !mongoose_1.Types.ObjectId.isValid(decoded.id)) {
                    return next(new Error("Unauthorized"));
                }
                socket.data.userId = decoded.id;
                next();
            }
            catch {
                next(new Error("Unauthorized"));
            }
        });
        this.namespace.on("connection", async (socket) => {
            const realtimeSocket = socket;
            const userId = realtimeSocket.data.userId;
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            await redis_service_1.redisService.addSocket(userObjectId, socket.id);
            await socket.join(userRoom(userId));
            this.namespace?.emit("user:online", { userId });
            socket.on("post:join", async (postId) => {
                if (typeof postId === "string" && postId.length > 0) {
                    await socket.join(postRoom(postId));
                }
            });
            socket.on("post:leave", async (postId) => {
                if (typeof postId === "string" && postId.length > 0) {
                    await socket.leave(postRoom(postId));
                }
            });
            socket.on("chat:send", async (payload, acknowledge) => {
                try {
                    if (!payload ||
                        typeof payload !== "object" ||
                        !("recipientId" in payload) ||
                        !("content" in payload) ||
                        typeof payload.recipientId !== "string" ||
                        typeof payload.content !== "string") {
                        throw new Error("recipientId and content are required");
                    }
                    const message = await new chat_service_1.ChatService().sendMessage({
                        recipientId: payload.recipientId,
                        content: payload.content,
                    }, userId);
                    this.deliverMessage(message);
                    acknowledge?.({ success: true, message });
                }
                catch (error) {
                    acknowledge?.({
                        success: false,
                        error: error instanceof Error ? error.message : "Message failed",
                    });
                }
            });
            socket.on("disconnect", async () => {
                await redis_service_1.redisService.removeSocket(userObjectId, socket.id);
                if (!(await redis_service_1.redisService.hasSockets(userObjectId))) {
                    this.namespace?.emit("user:offline", { userId });
                }
            });
        });
        return io;
    }
    emitToUser(userId, event, payload) {
        this.namespace?.to(userRoom(userId)).emit(event, payload);
    }
    emitToPost(postId, event, payload) {
        this.namespace?.to(postRoom(postId)).emit(event, payload);
    }
    deliverMessage(message) {
        this.emitToUser(message.recipientId, "chat:message", message);
        this.emitToUser(message.senderId, "chat:message", message);
    }
}
exports.realtimeGateway = new RealtimeGateway();
