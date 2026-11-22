import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type TokenPayload = { userId: string; name: string };

// Signs a JWT for the user. jwtid makes every token unique, even two issued in the same second.
export const generateToken = (userId: string, name: string): string => {
    return jwt.sign({ userId, name } satisfies TokenPayload, JWT_SECRET, {
        expiresIn: TOKEN_TTL_SECONDS,
        jwtid: randomUUID(),
    });
};

// Returns the payload if the signature is valid and the token hasn't expired, otherwise null.
export const verifyToken = (token: string): TokenPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (
            typeof decoded === "string" ||
            typeof decoded.userId !== "string" ||
            typeof decoded.name !== "string"
        ) {
            return null;
        }
        return { userId: decoded.userId, name: decoded.name };
    } catch {
        return null;
    }
};

// SHA-256 of the token, which is what gets stored in the DB.
export const hashToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex");
};
