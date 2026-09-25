"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connenctionRedius_1 = require("../../database/connenctionRedius");
class RedisService {
    client;
    constructor() {
        this.client = connenctionRedius_1.clientRedius;
    }
    async getData(key) {
        const get = await this.client.get(key);
        return get ? JSON.parse(get) : get;
    }
    async setData(key, value, ttl) {
        if (ttl) {
            await this.client.set(key, JSON.stringify(value), { EX: ttl });
        }
        else {
            await this.client.set(key, JSON.stringify(value));
        }
    }
    async existKey(key) {
        return await this.client.exists(key);
    }
    async flushAll() {
        await this.client.flushAll();
    }
    async deleteData(key) {
        return await this.client.del(key);
    }
    async MGet(keys) {
        return await this.client.mGet(keys);
    }
    async revokeToken(token) {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || typeof decoded === "string" || !decoded.exp) {
            throw new Error("Invalid token");
        }
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
            await this.client.set(`BL:${token}`, "revoked", {
                EX: ttl,
            });
        }
    }
    key(userId) {
        return `user:sockets:${userId}`;
    }
    async addSocket(userId, socketId) {
        return await this.client.sAdd(this.key(userId), socketId);
    }
    async removeSocket(userId, socketId) {
        return await this.client.sRem(this.key(userId), socketId);
    }
    async getSockets(userId) {
        return await this.client.sMembers(this.key(userId));
    }
    async hasSockets(userId) {
        const count = await this.client.sCard(this.key(userId));
        return count > 0;
    }
    async removeUser(userId) {
        return await this.client.del(this.key(userId));
    }
    async isTokenRevoked(token) {
        const result = await this.client.exists(`BL:${token}`);
        return result === 1;
    }
}
exports.redisService = new RedisService();
