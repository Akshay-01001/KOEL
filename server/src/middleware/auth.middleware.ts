import type { NextFunction, Request, Response } from "express";
import { TokenModel } from "../models/token.model.js";
import { sendResponse } from "../utils/response.js";
import {
    AUTH_COOKIE_NAME,
    clearAuthCookie,
    hashToken,
    verifyToken,
} from "../utils/token.js";

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Sign in again.";

type AuthCheck =
    | { status: "missing" }
    | { status: "invalid" }
    | { status: "ok"; userId: string; name: string };

// Reads the `token` cookie: a valid JWT whose hash is still stored in the DB.
const checkAuthCookie = async (req: Request): Promise<AuthCheck> => {
    const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
    if (typeof token !== "string" || !token) return { status: "missing" };

    const payload = verifyToken(token);
    if (!payload) return { status: "invalid" };

    const stored = await TokenModel.exists({
        token_hash: hashToken(token),
        user_id: payload.userId,
        expires_at: { $gt: new Date() },
    });
    if (!stored) return { status: "invalid" };

    return { status: "ok", userId: payload.userId, name: payload.name };
};

// Allows the request through only for a signed-in user.
// Sets req.userId and req.name for the handler.
export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const auth = await checkAuthCookie(req);
        if (auth.status === "missing") {
            return sendResponse(res, 401, "Not authenticated");
        }
        if (auth.status === "invalid") {
            // Expired, signed out elsewhere, or tampered with: drop the cookie too.
            clearAuthCookie(res);
            return sendResponse(res, 401, SESSION_EXPIRED_MESSAGE);
        }

        req.userId = auth.userId;
        req.name = auth.name;
        return next();
    } catch (error) {
        console.error("Failed to authenticate request:", error);
        return sendResponse(res, 500, "Failed to authenticate");
    }
};

// Lets people without a cookie through as guests (req.userId unset); signed-in
// users get req.userId and req.name. A cookie that is no longer valid gets a 401
// (and is cleared), so a user whose session expired isn't silently turned into a guest.
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const auth = await checkAuthCookie(req);
        if (auth.status === "invalid") {
            clearAuthCookie(res);
            return sendResponse(res, 401, SESSION_EXPIRED_MESSAGE);
        }
        if (auth.status === "ok") {
            req.userId = auth.userId;
            req.name = auth.name;
        }
        return next();
    } catch (error) {
        console.error("Failed to authenticate request:", error);
        return sendResponse(res, 500, "Failed to authenticate");
    }
};
