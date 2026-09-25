"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z
    .object({
    username: zod_1.z
        .string()
        .trim()
        .min(2, "Username must be at least 2 characters")
        .max(100, "Username must be at most 100 characters")
        .optional(),
    firstName: zod_1.z
        .string()
        .trim()
        .min(2, "First name must be at least 2 characters")
        .max(100, "First name must be at most 100 characters")
        .optional(),
    unique_name: zod_1.z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .optional(),
    email: zod_1.z.string().trim().email("Invalid email format"),
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/, "Password must contain at least one uppercase letter, one number, and one special character (@$!%*?&)"),
    age: zod_1.z.coerce
        .number()
        .min(18, "You must be at least 18 years old")
        .optional(),
    phoneNumber: zod_1.z
        .string()
        .trim()
        .min(10, "Phone number must be at least 10 characters")
        .optional(),
    gender: zod_1.z
        .enum(["male", "female"])
        .optional(),
})
    .superRefine((data, ctx) => {
    const username = data.username?.trim() ?? data.firstName?.trim();
    const uniqueName = data.unique_name?.trim();
    if (!username) {
        ctx.addIssue({
            path: ["username"],
            code: "custom",
            message: "Username is required",
        });
    }
    if (!uniqueName) {
        ctx.addIssue({
            path: ["unique_name"],
            code: "custom",
            message: "Unique username is required",
        });
    }
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Invalid email format"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
