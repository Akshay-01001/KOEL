import type { NextFunction, Request, Response } from "express";
import { TokenModel } from "../models/token.model.js";
import { sendResponse } from "../utils/response.js";
import { hashToken, verifyToken } from "../utils/token.js";

type AuthCheck =
    | { status: "missing" }
    | { status: "invalid" }
    | { status: "ok"; userId: string; name: string };

// Reads the `token` cookie: a valid JWT whose hash is still stored in the DB.
const checkAuthCookie = async (req: Request): Promise<AuthCheck> => {
    const token: unknown = req.cookies?.token;
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
            return sendResponse(res, 401, "Invalid or expired token");
        }

        req.userId = auth.userId;
        req.name = auth.name;
        return next();
    } catch (error) {
        console.error("Failed to authenticate request:", error);
        return sendResponse(res, 500, "Failed to authenticate");
    }
};

// Lets everyone through. Signed-in users get req.userId and req.name; anyone
// else (no cookie, or an expired one) continues as a guest with req.userId unset.
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const auth = await checkAuthCookie(req);
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
