"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
exports.getCloudinaryPublicId = getCloudinaryPublicId;
const cloudinary_1 = require("cloudinary");
const error_responce_1 = require("../exception/error.responce");
const env_service_1 = require("../../config/env.service");
function ensureConfigured() {
    const configuredValues = [
        env_service_1.env.cloudinaryCloudName,
        env_service_1.env.cloudinaryApiKey,
        env_service_1.env.cloudinaryApiSecret,
    ];
    const hasPlaceholder = configuredValues.some((value) => value?.toLowerCase().includes("your_"));
    if (configuredValues.some((value) => !value) ||
        hasPlaceholder) {
        throw new error_responce_1.InternalServerErrorException("Image storage is not configured. Set valid CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET values.");
    }
}
if (env_service_1.env.cloudinaryCloudName && env_service_1.env.cloudinaryApiKey && env_service_1.env.cloudinaryApiSecret) {
    cloudinary_1.v2.config({
        cloud_name: env_service_1.env.cloudinaryCloudName,
        api_key: env_service_1.env.cloudinaryApiKey,
        api_secret: env_service_1.env.cloudinaryApiSecret,
        secure: true,
    });
}
async function uploadImage(buffer, folder) {
    ensureConfigured();
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
            if (error || !result) {
                console.error("Cloudinary image upload failed", error);
                reject(new error_responce_1.InternalServerErrorException("Image upload failed"));
                return;
            }
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
        });
        stream.end(buffer);
    });
}
async function deleteImage(image) {
    const publicId = getCloudinaryPublicId(image);
    if (!publicId)
        return;
    ensureConfigured();
    await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: "image" });
}
function getCloudinaryPublicId(image) {
    if (!image || !image.includes("res.cloudinary.com/"))
        return undefined;
    const match = image.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
    return match?.[1];
}
