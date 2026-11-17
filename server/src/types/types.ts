import { z } from "zod";

export type iceServers = {
    urls: string[];
    username?: string;
    credential?: string;
}[];

// Every socket message has the shape { type, payload }

type Message<Events> = {
    [K in keyof Events]: { type: K; payload: Events[K] };
}[keyof Events];

// ---- Client -> Server ----

const id = z.string().trim().min(1).max(64);
const username = z.string().trim().min(1).max(32);

export const clientMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("create_room"),
        payload: z.object({ userId: id, username }),
    }),
    z.object({
        type: z.literal("join_room"),
        payload: z.object({ roomId: id, userId: id, username }),
    }),
    z.object({
        type: z.literal("leave_room"),
        payload: z.object({ userId: id }),
    }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ClientEventType = ClientMessage["type"];

// ---- Server -> Client ----

export type Peer = { userId: string; name: string };

export type ServerToClientEvents = {
    joined: { roomId: string; userId: string; peers: Peer[] };
    peer_joined: Peer;
    peer_left: { userId: string };
    room_not_found: { message: string };
    already_joined: { message: string };
    error: { message: string };
};

export type ServerMessage = Message<ServerToClientEvents>;
export type ServerEventType = ServerMessage["type"];
