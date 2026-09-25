"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRS = exports.connectRedis = exports.clientRedius = exports.clientRedis = void 0;
const redis_1 = require("redis");
const env_service_1 = require("../config/env.service");
exports.clientRedis = (0, redis_1.createClient)({
    url: env_service_1.env.redisConnection,
});
exports.clientRedius = exports.clientRedis;
const connectRedis = async () => {
    try {
        await exports.clientRedis.connect();
        console.log("Connected to Redis");
    }
    catch (error) {
        console.error("Error connecting to Redis:", error);
    }
};
exports.connectRedis = connectRedis;
exports.connectRS = exports.connectRedis;
