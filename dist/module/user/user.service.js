"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_responce_1 = require("../../common/exception/error.responce");
const HashWord_1 = require("../../common/middleware/security/HashWord");
const phoneCrypto_1 = require("../../common/middleware/security/phoneCrypto");
const userRepo_1 = require("./userRepo");
const multer_1 = require("../../common/utils/multer/multer");
const cloudinary_service_1 = require("../../common/service/cloudinary.service");
class UserService {
    userRepository;
    constructor() {
        this.userRepository = new userRepo_1.UserRepository();
    }
    async getData(user_id) {
        const userData = await this.userRepository.findById({
            id: user_id,
        });
        if (!userData) {
            throw new error_responce_1.NotFoundException("User not found");
        }
        const obj = userData.toObject();
        return {
            ...obj,
            profileImage: (0, multer_1.publicImageUrl)(obj.profileImage),
        };
    }
    async getUsers(userId) {
        const users = await this.userRepository.findAll({
            filter: { _id: { $ne: userId } },
            select: "_id username firstName lastName email unique_name profileImage",
            lean: true,
        });
        return users.map((user) => ({
            ...user,
            profileImage: (0, multer_1.publicImageUrl)(user.profileImage),
        }));
    }
    async updateData(user_id, data, uploadedProfileImage) {
        const { password, newPassword, phone, phoneNumber, name, username, uniqueName, unique_name, profileImage, } = data;
        const userData = await this.userRepository.findById({
            id: user_id,
        });
        if (!userData) {
            throw new error_responce_1.NotFoundException("User not found");
        }
        const updatedFields = {};
        if (name || username) {
            const newUsername = name || username;
            updatedFields.username = newUsername;
            const [first, ...rest] = (newUsername || "").trim().split(/\s+/);
            updatedFields.firstName = first || "";
            updatedFields.lastName = rest.join(" ");
        }
        const targetUniqueName = unique_name || uniqueName;
        if (targetUniqueName) {
            const uniqueNameExist = await this.userRepository.findOne({
                filter: {
                    unique_name: targetUniqueName,
                    _id: { $ne: user_id },
                },
            });
            if (uniqueNameExist) {
                throw new error_responce_1.ConflictException("Unique name already taken");
            }
            updatedFields.unique_name = targetUniqueName;
        }
        if (phone || phoneNumber) {
            const updatedPhone = phone || phoneNumber;
            if (updatedPhone) {
                updatedFields.phoneNumber = await (0, phoneCrypto_1.EncryptWord)(updatedPhone);
            }
        }
        if (password && newPassword) {
            if (!userData.password) {
                throw new error_responce_1.ConflictException("User does not have a password");
            }
            const isMatch = await (0, HashWord_1.compareWord)(password, userData.password);
            if (!isMatch) {
                throw new error_responce_1.ConflictException("Current password is incorrect");
            }
            updatedFields.password = await (0, HashWord_1.hashWord)(newPassword);
        }
        if (uploadedProfileImage) {
            updatedFields.profileImage = uploadedProfileImage;
        }
        else if (profileImage) {
            updatedFields.profileImage = profileImage;
        }
        const updatedUser = await this.userRepository.findByIdAndUpdate({
            id: user_id,
            data: updatedFields,
        });
        if (!updatedUser) {
            throw new error_responce_1.NotFoundException("User not found");
        }
        const nextProfileImage = uploadedProfileImage || profileImage;
        if (nextProfileImage && userData.profileImage !== nextProfileImage) {
            await (0, cloudinary_service_1.deleteImage)(userData.profileImage);
        }
        const obj = typeof updatedUser.toObject === "function" ? updatedUser.toObject() : updatedUser;
        return {
            ...obj,
            profileImage: (0, multer_1.publicImageUrl)(obj.profileImage),
        };
    }
    async deleteUser({ user_id }) {
        const userData = await this.userRepository.findById({
            id: user_id,
        });
        if (!userData) {
            throw new error_responce_1.NotFoundException("User not found");
        }
        const deletedUser = await this.userRepository.findByIdAndDelete(user_id);
        if (!deletedUser) {
            throw new error_responce_1.NotFoundException("User not found");
        }
        return deletedUser;
    }
}
exports.default = new UserService();
