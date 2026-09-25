"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendMail_1 = require("../../common/email/sendMail");
const error_responce_1 = require("../../common/exception/error.responce");
const HashWord_1 = require("../../common/middleware/security/HashWord");
const otp_1 = require("../../common/otp/otp");
const google_auth_library_1 = require("google-auth-library");
const env_service_1 = require("../../config/env.service");
const common_1 = require("../../common");
const authRepo_1 = require("./authRepo");
const redis_service_1 = require("../../common/redis/redis.service");
const auth_1 = require("../../common/middleware/auth/auth");
const OTP_TTL_SECONDS = 600;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
class AuthService {
    userRepository;
    constructor() {
        this.userRepository = new authRepo_1.authRepository();
    }
    // ---------- helpers ----------
    /** Removes sensitive fields before sending a user back to the client. */
    sanitizeUser(user) {
        const plain = typeof user?.toObject === "function" ? user.toObject() : { ...user };
        delete plain.password;
        return plain;
    }
    async issueOtp(email, name) {
        const otp = (0, otp_1.otpGenerator)();
        const hashedOtp = await (0, HashWord_1.hashWord)(String(otp));
        await redis_service_1.redisService.setData(`otp:${email}`, hashedOtp, OTP_TTL_SECONDS);
        await redis_service_1.redisService.deleteData(`otp_attempts:${email}`);
        await redis_service_1.redisService.setData(`otp_cooldown:${email}`, "1", OTP_RESEND_COOLDOWN_SECONDS);
        await (0, sendMail_1.sendEmail)({
            to: email,
            subject: "Verify your account",
            text: `${name ? `Hello ${name},\n\n` : ""}Your OTP is: ${otp}

This OTP will expire in 10 minutes.`,
            html: `Your OTP is <h2>${otp}</h2>`,
        });
    }
    // ---------- public API ----------
    async signUp(data, profileImage) {
        const { username, firstName, unique_name, email, password, phoneNumber, age, gender, } = data;
        const normalizedUsername = username?.trim() || firstName?.trim();
        const normalizedUniqueName = unique_name?.trim() || normalizedUsername?.replace(/\s+/g, "_");
        if (!normalizedUsername || !normalizedUniqueName || !email || !password) {
            throw new error_responce_1.BadRequestException("Missing required fields");
        }
        const isUserExist = await this.userRepository.findOne({
            filter: {
                $or: [{ email }, { unique_name: normalizedUniqueName }],
            },
        });
        if (isUserExist) {
            throw new error_responce_1.ConflictException("User already exists");
        }
        const [first, ...rest] = normalizedUsername.split(/\s+/);
        const hashedPassword = await (0, HashWord_1.hashWord)(password);
        const user = await this.userRepository.create({
            username: normalizedUsername,
            firstName: first || "",
            lastName: rest.join(" "),
            email,
            password: hashedPassword,
            phoneNumber,
            age,
            unique_name: normalizedUniqueName,
            gender,
            profileImage,
            confirmEmail: false,
        });
        await this.issueOtp(email, normalizedUsername);
        return {
            success: true,
            message: "Account created successfully. Please verify your email.",
            user: this.sanitizeUser(user),
        };
    }
    async login(data) {
        const { email, password } = data;
        if (!email || !password) {
            throw new error_responce_1.BadRequestException("Please enter all data");
        }
        const user = await this.userRepository.findOne({
            filter: { email },
        });
        if (!user || !user.password) {
            throw new error_responce_1.BadRequestException("Invalid email");
        }
        const isPasswordMatch = await (0, HashWord_1.compareWord)(password, user.password);
        if (!isPasswordMatch) {
            throw new error_responce_1.BadRequestException("Invalid password");
        }
        if (!user.confirmEmail) {
            throw new error_responce_1.BadRequestException("User not verified");
        }
        const tokens = await auth_1.TokenService.generateToken({
            id: user._id.toString(),
            email: user.email,
        }, user.role);
        return {
            success: true,
            message: "Login success",
            ...tokens,
            user: this.sanitizeUser(user),
        };
    }
    async verifyUser(data) {
        const { email, otp } = data;
        if (!email || !otp) {
            throw new error_responce_1.BadRequestException("Please enter all data");
        }
        const user = await this.userRepository.findOne({
            filter: { email },
        });
        if (!user) {
            throw new error_responce_1.NotFoundException("User not found");
        }
        const storedOtp = await redis_service_1.redisService.getData(`otp:${email}`);
        if (!storedOtp) {
            throw new error_responce_1.BadRequestException("OTP has expired or is invalid");
        }
        const attemptsKey = `otp_attempts:${email}`;
        const attempts = Number((await redis_service_1.redisService.getData(attemptsKey)) || 0);
        if (attempts >= OTP_MAX_ATTEMPTS) {
            await redis_service_1.redisService.deleteData(`otp:${email}`);
            await redis_service_1.redisService.deleteData(attemptsKey);
            throw new error_responce_1.BadRequestException("Too many failed attempts. Please request a new OTP");
        }
        const isOtpMatch = await (0, HashWord_1.compareWord)(String(otp), storedOtp);
        if (!isOtpMatch) {
            await redis_service_1.redisService.setData(attemptsKey, String(attempts + 1), OTP_TTL_SECONDS);
            throw new error_responce_1.BadRequestException("Invalid OTP");
        }
        await this.userRepository.findOneAndUpdate({
            filter: { email },
            data: { confirmEmail: true },
        });
        await redis_service_1.redisService.deleteData(`otp:${email}`);
        await redis_service_1.redisService.deleteData(attemptsKey);
        return {
            success: true,
            message: "Account verified successfully",
        };
    }
    async resendOtp(data) {
        const { email } = data;
        if (!email) {
            throw new error_responce_1.BadRequestException("Email is required");
        }
        const user = await this.userRepository.findOne({
            filter: { email },
        });
        if (!user) {
            throw new error_responce_1.NotFoundException("Account does not exist");
        }
        if (user.confirmEmail) {
            throw new error_responce_1.BadRequestException("Account already verified");
        }
        const onCooldown = await redis_service_1.redisService.getData(`otp_cooldown:${email}`);
        if (onCooldown) {
            throw new error_responce_1.BadRequestException("Please wait a minute before requesting another OTP");
        }
        await this.issueOtp(email);
        return {
            success: true,
            message: "OTP resent successfully",
        };
    }
    async signupMail(body) {
        if (!env_service_1.env.googleClientId) {
            throw new error_responce_1.BadRequestException("GOOGLE_CLIENT_ID is not defined");
        }
        if (!body.idToken) {
            throw new error_responce_1.BadRequestException("Google ID token is required");
        }
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken: body.idToken,
            audience: env_service_1.env.googleClientId,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new error_responce_1.BadRequestException("Invalid Google token");
        }
        if (!payload.email_verified) {
            throw new error_responce_1.BadRequestException("Email not verified");
        }
        const { email, name } = payload;
        if (!email) {
            throw new error_responce_1.BadRequestException("Google account email not found");
        }
        const existUser = await this.userRepository.findOne({
            filter: { email },
        });
        if (existUser) {
            throw new error_responce_1.ConflictException("User already exists");
        }
        const username = name?.trim() || email.split("@")[0] || "Google User";
        const [first, ...rest] = username.split(/\s+/);
        const unique_name = `${email.split("@")[0] || "google-user"}_${Math.floor(Math.random() * 10000)}`;
        const addUser = await this.userRepository.create({
            username,
            firstName: first || "Google",
            lastName: rest.join(" "),
            unique_name,
            email,
            password: "",
            provider: common_1.providerEnum.GOOGLE,
            confirmEmail: true,
        });
        // Google users have no password, so give them tokens right away
        const tokens = await auth_1.TokenService.generateToken({
            id: addUser._id.toString(),
            email: addUser.email,
        }, addUser.role);
        return {
            success: true,
            message: "Google signup successful",
            ...tokens,
            user: this.sanitizeUser(addUser),
        };
    }
    async logout(req) {
        await auth_1.TokenService.revokeToken(req.token);
        return {
            success: true,
            message: "Logout successfully",
        };
    }
}
exports.default = new AuthService();
