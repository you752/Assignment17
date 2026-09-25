"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicImageUrl = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const upload = () => {
    return (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
};
exports.upload = upload;
const publicImageUrl = (image) => {
    if (!image)
        return undefined;
    if (/^https?:\/\//i.test(image))
        return image;
    const normalized = image.replace(/\\/g, "/");
    const uploadsIndex = normalized.lastIndexOf("/uploads/");
    const filename = uploadsIndex >= 0 ? normalized.slice(uploadsIndex + "/uploads/".length) : normalized.split("/").pop();
    if (!filename)
        return undefined;
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 8000}`;
    return `${serverUrl}/uploads/${encodeURIComponent(filename)}`;
};
exports.publicImageUrl = publicImageUrl;
