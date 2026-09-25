"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageValidation = void 0;
const zod_1 = require("zod");
exports.sendMessageValidation = zod_1.z.object({
    recipientId: zod_1.z.string().trim().min(1, { message: "recipientId is required" }),
    content: zod_1.z
        .string()
        .trim()
        .min(1, { message: "content is required" })
        .max(5000, { message: "content must not exceed 5000 characters" }),
});
