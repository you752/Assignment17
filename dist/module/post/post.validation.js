"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostValidation = exports.createPostValidation = void 0;
const zod_1 = require("zod");
exports.createPostValidation = zod_1.z.object({
    content: zod_1.z
        .string()
        .trim()
        .min(1, { message: "content is required" })
        .max(5000, { message: "content must not exceed 5000 characters" }),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updatePostValidation = exports.createPostValidation;
