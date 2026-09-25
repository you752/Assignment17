"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_service_1 = require("../../../config/env.service");
const user_model_1 = require("../../../database/model/user.model");
const connenctionRedius_1 = require("../../../database/connenctionRedius");
const index_1 = require("../../index");
class TokenService {
    static ACCESS_EXPIRES_IN = "1h";
    static REFRESH_EXPIRES_IN = "1y";
    static BLACKLIST_PREFIX = "BL:";
    static SIGNATURES = {
        [index_1.UserRoleEnum.USER]: env_service_1.env.userSignature,
        [index_1.UserRoleEnum.ADMIN]: env_service_1.env.adminSignature,
    };
    static REFRESH_SIGNATURES = {
        [index_1.UserRoleEnum.USER]: env_service_1.env.userRefreshSignature,
        [index_1.UserRoleEnum.ADMIN]: env_service_1.env.adminRefreshSignature,
    };
    // ---------- helpers ----------
    static getAccessSignature(role) {
        const signature = this.SIGNATURES[role];
        if (!signature)
            throw new Error("Invalid role or missing signature");
        return signature;
    }
    static getRefreshSignature(role) {
        const signature = this.REFRESH_SIGNATURES[role];
        if (!signature)
            throw new Error("Invalid role or missing signature");
        return signature;
    }
    // ---------- token creation ----------
    static async generateToken(payload, role = index_1.UserRoleEnum.USER) {
        const accessSignature = this.getAccessSignature(role);
        const refreshSignature = this.getRefreshSignature(role);
        const accessToken = jsonwebtoken_1.default.sign(payload, accessSignature, {
            expiresIn: this.ACCESS_EXPIRES_IN,
            audience: String(role),
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, refreshSignature, {
            expiresIn: this.REFRESH_EXPIRES_IN,
            audience: String(role),
        });
        return { accessToken, refreshToken };
    }
    static async generateAccessToken(refreshToken) {
        const decoded = jsonwebtoken_1.default.decode(refreshToken);
        if (!decoded || typeof decoded === "string" || decoded.aud === undefined) {
            throw new Error("Invalid refresh token");
        }
        const role = Number(decoded.aud);
        if (role !== index_1.UserRoleEnum.USER && role !== index_1.UserRoleEnum.ADMIN) {
            throw new Error("Invalid role");
        }
        const verified = await this.verifyRefreshToken(refreshToken, role);
        const signature = this.getAccessSignature(role);
        const accessToken = jsonwebtoken_1.default.sign({ id: verified.id, email: verified.email }, signature, {
            expiresIn: this.ACCESS_EXPIRES_IN,
            audience: String(role),
        });
        return { accessToken };
    }
    // ---------- token verification ----------
    static async verifyAccessToken(token, role = index_1.UserRoleEnum.USER) {
        const signature = this.getAccessSignature(role);
        return jsonwebtoken_1.default.verify(token, signature);
    }
    static async verifyRefreshToken(token, role = index_1.UserRoleEnum.USER) {
        const signature = this.getRefreshSignature(role);
        return jsonwebtoken_1.default.verify(token, signature);
    }
    // ---------- revocation ----------
    static async revokeToken(token) {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || typeof decoded === "string" || !decoded.exp) {
            throw new Error("Invalid token");
        }
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
            await connenctionRedius_1.clientRedius.set(`${this.BLACKLIST_PREFIX}${token}`, "revoked", {
                EX: ttl,
            });
        }
        return true;
    }
    static async isRevoked(token) {
        const result = await connenctionRedius_1.clientRedius.get(`${this.BLACKLIST_PREFIX}${token}`);
        return Boolean(result);
    }
    // ---------- middleware ----------
    static auth(role = index_1.UserRoleEnum.USER) {
        return async (req, res, next) => {
            try {
                const { authorization } = req.headers;
                if (!authorization) {
                    throw new Error("Authorization header is required");
                }
                const [bearer, token] = authorization.split(" ");
                if (bearer !== "Bearer" || !token) {
                    throw new Error("Invalid authorization format");
                }
                if (await TokenService.isRevoked(token)) {
                    throw new Error("Token has been revoked");
                }
                const decoded = await TokenService.verifyAccessToken(token, role);
                const user = await user_model_1.userModel.findById(decoded.id);
                if (!user) {
                    throw new Error("User not found");
                }
                req.user = user;
                req.token = token;
                next();
            }
            catch (error) {
                return res.status(401).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Unauthorized",
                });
            }
        };
    }
}
exports.TokenService = TokenService;
exports.auth = TokenService.auth.bind(TokenService);
