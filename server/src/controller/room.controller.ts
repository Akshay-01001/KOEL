import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { AccessToken } from "livekit-server-sdk";
import {
    api,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
    LIVEKIT_URL,
} from "../livekit/config.js";

const createRoomSchema = z.object({
    name: z.string().trim().min(1).max(128),
    emptyTimeout: z.number().int().positive().optional(),
    maxParticipants: z.number().int().positive().max(500).optional(),
});

export const createRoom = async (req: Request, res: Response) => {
    const parsed = createRoomSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid request body",
            errors: z.flattenError(parsed.error).fieldErrors,
        });
    }

    const { name, emptyTimeout = 600, maxParticipants = 50 } = parsed.data;

    try {
        const room = await api.room.createRoom({
            name,
            emptyTimeout,
            maxParticipants,
        });

        return res.status(201).json({
            message: "Room created successfully",
            room: room.toJson(),
        });
    } catch (error) {
        console.error("Failed to create room:", error);
        return res.status(500).json({ message: "Failed to create room" });
    }
};

const joinTokenSchema = z.object({
    roomName: z.string().trim().min(1).max(128),
    name: z.string().trim().min(1).max(64),
});

// Issues a LiveKit access token so a client can join a room.
// LiveKit auto-creates the room on first join if it doesn't exist yet.
// TODO: once auth exists, use the logged-in user's id as the identity.
export const getJoinToken = async (req: Request, res: Response) => {
    const parsed = joinTokenSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid request body",
            errors: z.flattenError(parsed.error).fieldErrors,
        });
    }

    const { roomName, name } = parsed.data;
    // Identity must be unique per participant; LiveKit kicks a duplicate identity.
    const identity = `${name}-${randomUUID().slice(0, 8)}`;

    try {
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity,
            name,
            ttl: "1h",
        });
        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        return res.json({ token: await at.toJwt(), url: LIVEKIT_URL });
    } catch (error) {
        console.error("Failed to create join token:", error);
        return res.status(500).json({ message: "Failed to create join token" });
    }
};
