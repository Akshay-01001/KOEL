import { randomInt, randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { AccessToken, ServerError, TrackSource } from "livekit-server-sdk";
import { api, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } from "../livekit/config.js";
import {
    MeetingModel,
    MeetingStatus,
    type MeetingDocument,
} from "../models/meeting.model.js";
import {
    MeetingParticipantModel,
    type ParticipantRole,
} from "../models/meeting.participant.model.js";

const ROOM_EMPTY_TIMEOUT_SECONDS = 10 * 60;
const JOIN_TOKEN_TTL = "2h";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const randomLetters = (length: number) => {
    return Array.from({ length }, () => {
        return LETTERS[randomInt(LETTERS.length)];
    }).join("");
};

export const generateMeetingCode = () => {
    return `${randomLetters(3)}-${randomLetters(4)}-${randomLetters(3)}`;
};

// Guests have no account, so each guest join gets its own id. It's the LiveKit
// identity and what the guest sends back to leave.
export const GUEST_ID_PATTERN = /^guest_[0-9a-f-]{36}$/;

export const createGuestId = () => {
    return `guest_${randomUUID()}`;
};

// Name shown for a guest who didn't type one, e.g. "Anonymous 4821".
export const createGuestName = () => {
    return `Anonymous ${randomInt(1000, 10000)}`;
};

export const isDuplicateKeyError = (error: unknown) => {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
    );
};

export const createLiveKitRoom = (roomName: string) => {
    return api.room.createRoom({
        name: roomName,
        emptyTimeout: ROOM_EMPTY_TIMEOUT_SECONDS,
    });
};

export const deleteLiveKitRoom = async (roomName: string) => {
    try {
        await api.room.deleteRoom(roomName);
    } catch (error) {
        const notFound =
            error instanceof ServerError &&
            (error.status === 404 || error.code === "not_found");
        if (!notFound) throw error;
    }
};

type JoinTokenOptions = {
    identity: string;
    name: string;
    roomName: string;
    isHost: boolean;
    chatEnabled: boolean;
    screenShareEnabled: boolean;
};

export const createJoinToken = async ({
    identity,
    name,
    roomName,
    isHost,
    chatEnabled,
    screenShareEnabled,
}: JoinTokenOptions) => {
    const sources = [TrackSource.CAMERA, TrackSource.MICROPHONE];
    if (isHost || screenShareEnabled) {
        sources.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity,
        name,
        ttl: JOIN_TOKEN_TTL,
    });
    token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishSources: sources,
        canPublishData: isHost || chatEnabled,
    });

    return token.toJwt();
};

// A participant is either a signed-in user or a guest.
export type ParticipantRef = { user_id: string } | { guest_id: string };

// Ends open sessions: one participant's if the filter names one, otherwise everyone's.
export const closeOpenSessions = (
    filter: { meeting_id: Types.ObjectId } & Partial<
        Record<"user_id" | "guest_id", string>
    >,
    at: Date,
) => {
    return MeetingParticipantModel.updateMany(
        { ...filter, sessions: { $elemMatch: { left_at: null } } },
        { $set: { "sessions.$[open].left_at": at } },
        { arrayFilters: [{ "open.left_at": null }] },
    );
};

export const recordJoin = async (
    meetingId: Types.ObjectId,
    participant: ParticipantRef,
    role: ParticipantRole,
) => {
    const now = new Date();
    await closeOpenSessions({ meeting_id: meetingId, ...participant }, now);
    await MeetingParticipantModel.updateOne(
        { meeting_id: meetingId, ...participant },
        {
            $setOnInsert: { role },
            $push: { sessions: { joined_at: now, left_at: null } },
        },
        { upsert: true },
    );
};

export const openMeetingRoom = async (meeting: MeetingDocument) => {
    await createLiveKitRoom(meeting.room_name);
    return MeetingModel.findOneAndUpdate(
        { _id: meeting._id, status: MeetingStatus.SCHEDULED },
        { $set: { status: MeetingStatus.RUNNING, started_at: new Date() } },
        { returnDocument: "after" },
    );
};

export const closeMeetingRoom = async (meeting: MeetingDocument) => {
    const now = new Date();
    const ended = await MeetingModel.findOneAndUpdate(
        { _id: meeting._id, status: MeetingStatus.RUNNING },
        { $set: { status: MeetingStatus.ENDED, ended_at: now } },
        { returnDocument: "after" },
    );
    await closeOpenSessions({ meeting_id: meeting._id }, now);
    await deleteLiveKitRoom(meeting.room_name);
    return ended;
};
