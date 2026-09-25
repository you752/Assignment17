import { sendEmail } from "../../common/email/sendMail";

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exception/error.responce";

import {
  compareWord,
  hashWord,
} from "../../common/middleware/security/HashWord";

import { otpGenerator } from "../../common/otp/otp";

import { OAuth2Client } from "google-auth-library";

import { env } from "../../config/env.service";

import { IUser, providerEnum } from "../../common";

import { authRepository } from "./authRepo";
import { redisService } from "../../common/redis/redis.service";

import { TokenService } from "../../common/middleware/auth/auth";

const OTP_TTL_SECONDS = 600;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

class AuthService {
  private userRepository: authRepository;

  constructor() {
    this.userRepository = new authRepository();
  }

  // ---------- helpers ----------

  /** Removes sensitive fields before sending a user back to the client. */
  private sanitizeUser(user: any) {
    const plain =
      typeof user?.toObject === "function" ? user.toObject() : { ...user };
    delete plain.password;
    return plain;
  }

  private async issueOtp(email: string, name?: string) {
    const otp = otpGenerator();
    const hashedOtp = await hashWord(String(otp));

    await redisService.setData(`otp:${email}`, hashedOtp, OTP_TTL_SECONDS);
    await redisService.deleteData(`otp_attempts:${email}`);
    await redisService.setData(
      `otp_cooldown:${email}`,
      "1",
      OTP_RESEND_COOLDOWN_SECONDS,
    );

    await sendEmail({
      to: email,
      subject: "Verify your account",
      text: `${name ? `Hello ${name},\n\n` : ""}Your OTP is: ${otp}

This OTP will expire in 10 minutes.`,
      html: `Your OTP is <h2>${otp}</h2>`,
    });
  }

  // ---------- public API ----------

  async signUp(data: IUser, profileImage?: string) {
    const {
      username,
      firstName,
      unique_name,
      email,
      password,
      phoneNumber,
      age,
      gender,
    } = data;

    const normalizedUsername = username?.trim() || firstName?.trim();
    const normalizedUniqueName =
      unique_name?.trim() || normalizedUsername?.replace(/\s+/g, "_");

    if (!normalizedUsername || !normalizedUniqueName || !email || !password) {
      throw new BadRequestException("Missing required fields");
    }

    const isUserExist = await this.userRepository.findOne({
      filter: {
        $or: [{ email }, { unique_name: normalizedUniqueName }],
      },
    });

    if (isUserExist) {
      throw new ConflictException("User already exists");
    }

    const [first, ...rest] = normalizedUsername.split(/\s+/);
    const hashedPassword = await hashWord(password);

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
    } as IUser);

    await this.issueOtp(email, normalizedUsername);

    return {
      success: true,
      message: "Account created successfully. Please verify your email.",
      user: this.sanitizeUser(user),
    };
  }

  async login(data: any): Promise<any> {
    const { email, password } = data;

    if (!email || !password) {
      throw new BadRequestException("Please enter all data");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (!user || !user.password) {
      throw new BadRequestException("Invalid email");
    }

    const isPasswordMatch = await compareWord(password, user.password);

    if (!isPasswordMatch) {
      throw new BadRequestException("Invalid password");
    }

    if (!user.confirmEmail) {
      throw new BadRequestException("User not verified");
    }

    const tokens = await TokenService.generateToken(
      {
        id: user._id.toString(),
        email: user.email,
      },
      user.role,
    );

    return {
      success: true,
      message: "Login success",
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async verifyUser(data: any) {
    const { email, otp } = data;

    if (!email || !otp) {
      throw new BadRequestException("Please enter all data");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const storedOtp = await redisService.getData(`otp:${email}`);

    if (!storedOtp) {
      throw new BadRequestException("OTP has expired or is invalid");
    }

    const attemptsKey = `otp_attempts:${email}`;
    const attempts = Number((await redisService.getData(attemptsKey)) || 0);

    if (attempts >= OTP_MAX_ATTEMPTS) {
      await redisService.deleteData(`otp:${email}`);
      await redisService.deleteData(attemptsKey);
      throw new BadRequestException(
        "Too many failed attempts. Please request a new OTP",
      );
    }

    const isOtpMatch = await compareWord(String(otp), storedOtp);

    if (!isOtpMatch) {
      await redisService.setData(
        attemptsKey,
        String(attempts + 1),
        OTP_TTL_SECONDS,
      );
      throw new BadRequestException("Invalid OTP");
    }

    await this.userRepository.findOneAndUpdate({
      filter: { email },
      data: { confirmEmail: true },
    });

    await redisService.deleteData(`otp:${email}`);
    await redisService.deleteData(attemptsKey);

    return {
      success: true,
      message: "Account verified successfully",
    };
  }

  async resendOtp(data: any) {
    const { email } = data;

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundException("Account does not exist");
    }

    if (user.confirmEmail) {
      throw new BadRequestException("Account already verified");
    }

    const onCooldown = await redisService.getData(`otp_cooldown:${email}`);

    if (onCooldown) {
      throw new BadRequestException(
        "Please wait a minute before requesting another OTP",
      );
    }

    await this.issueOtp(email);

    return {
      success: true,
      message: "OTP resent successfully",
    };
  }

  async signupMail(body: any) {
    if (!env.googleClientId) {
      throw new BadRequestException("GOOGLE_CLIENT_ID is not defined");
    }

    if (!body.idToken) {
      throw new BadRequestException("Google ID token is required");
    }

    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken: body.idToken,
      audience: env.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new BadRequestException("Invalid Google token");
    }

    if (!payload.email_verified) {
      throw new BadRequestException("Email not verified");
    }

    const { email, name } = payload;

    if (!email) {
      throw new BadRequestException("Google account email not found");
    }

    const existUser = await this.userRepository.findOne({
      filter: { email },
    });

    if (existUser) {
      throw new ConflictException("User already exists");
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
      provider: providerEnum.GOOGLE,
      confirmEmail: true,
    } as IUser);

    // Google users have no password, so give them tokens right away
    const tokens = await TokenService.generateToken(
      {
        id: (addUser as IUser & { _id: string })._id.toString(),
        email: addUser.email,
      },
      addUser.role,
    );

    return {
      success: true,
      message: "Google signup successful",
      ...tokens,
      user: this.sanitizeUser(addUser),
    };
  }

  async logout(req: any): Promise<any> {
    await TokenService.revokeToken(req.token);

    return {
      success: true,
      message: "Logout successfully",
    };
  }
}

export default new AuthService();
