import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AuthProvider, UserModel } from "../models/user.model.js";
import { TokenModel } from "../models/token.model.js";
import { loginSchema, registerSchema } from "../validations/authValidations.js";
import { isProduction } from "../utils/constants.js";
import { sendResponse, sendValidationError } from "../utils/response.js";
import { generateToken, hashToken, TOKEN_TTL_SECONDS } from "../utils/token.js";

// Issues a JWT, stores its hash in the DB, and sends the raw token as a cookie.
const issueAuthToken = async (res: Response, userId: string, name: string) => {
    const token = generateToken(userId, name);

    await TokenModel.create({
        user_id: userId,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000),
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction(),
        sameSite: isProduction() ? "none" : "lax",
        maxAge: TOKEN_TTL_SECONDS * 1000,
    });
};

const toPublicUser = (user: {
    _id: unknown;
    name: string;
    email: string;
    provider: string;
    is_verified: boolean;
    avatar_url?: string | null;
}) => {
    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        provider: user.provider,
        isVerified: user.is_verified,
        avatar_url: user.avatar_url ?? null,
    };
};

export const register = async (req: Request, res: Response) => {
    const { value, error } = registerSchema.validate(req.body ?? {});
    if (error) {
        return sendValidationError(res, "Invalid request body", error.details);
    }

    const { name, email, password } = value;

    try {
        const existing = await UserModel.exists({ email });
        if (existing) {
            return sendResponse(
                res,
                409,
                "An account with this email already exists",
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await UserModel.create({
            name,
            email,
            password: hashedPassword,
            provider: AuthProvider.CREDENTIAL,
        });

        await issueAuthToken(res, String(user._id), user.name);

        return sendResponse(
            res,
            201,
            "Account created successfully",
            toPublicUser(user),
        );
    } catch (error) {
        console.error("Failed to register user:", error);
        return sendResponse(res, 500, "Failed to register user");
    }
};

export const login = async (req: Request, res: Response) => {
    const { value, error } = loginSchema.validate(req.body ?? {});
    if (error) {
        return sendValidationError(res, "Invalid request body", error.details);
    }

    const { email, password } = value;

    try {
        const user = await UserModel.findOne({
            email,
            is_deleted: false,
        }).select("+password");

        // Same response for unknown email, Google-only account, or wrong password.
        const isValid =
            user?.provider === AuthProvider.CREDENTIAL &&
            !!user.password &&
            (await bcrypt.compare(password, user.password));

        if (!user || !isValid) {
            return sendResponse(res, 401, "Invalid email or password");
        }

        await issueAuthToken(res, String(user._id), user.name);

        return sendResponse(
            res,
            200,
            "Logged in successfully",
            toPublicUser(user),
        );
    } catch (error) {
        console.error("Failed to log in user:", error);
        return sendResponse(res, 500, "Failed to log in");
    }
};

// Returns the logged-in user. requireAuth runs first and sets req.userId.
export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await UserModel.findOne({
            _id: req.userId,
            is_deleted: false,
        });

        if (!user) {
            return sendResponse(res, 404, "User not found");
        }

        return sendResponse(res, 200, "Current user", toPublicUser(user));
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return sendResponse(res, 500, "Failed to fetch user");
    }
};
