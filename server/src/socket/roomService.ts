import { randomUUID } from "node:crypto";
import { WebSocket } from "ws";
import type { AliveSocket } from "./ws.js";
import type { ClientMessage, ServerMessage } from "../types/types.js";
import { sendMessage } from "./send.js";

interface RoomType {
    userId: string;
    name: string;
    socket: WebSocket;
}

export class RoomService {
    // roomId -> user
    private rooms: Map<string, RoomType[]>;
    // userId -> roomId
    private userRooms: Map<string, string>;

    constructor() {
        this.rooms = new Map();
        this.userRooms = new Map();
    }

    public handleMessage(message: ClientMessage, socket: AliveSocket) {
        switch (message.type) {
            case "create_room": {
                const { userId, username } = message.payload;
                this.createRoom(userId, username, socket);
                break;
            }
            case "join_room": {
                const { roomId, userId, username } = message.payload;
                this.joinRoom(roomId, userId, username, socket);
                break;
            }
            case "leave_room": {
                this.leaveRoom(message.payload.userId);
                break;
            }
        }
    }

    public createRoom(
        userId: string,
        name: string,
        socket: WebSocket,
    ): string | undefined {
        if (this.userRooms.has(userId)) {
            sendMessage(socket, {
                type: "already_joined",
                payload: { message: "User already in a room" },
            });
            return undefined;
        }

        const roomId = randomUUID();
        this.rooms.set(roomId, []);

        this.joinRoom(roomId, userId, name, socket);

        return roomId;
    }

    public leaveRoom(userId: string) {
        const roomId = this.userRooms.get(userId);
        if (!roomId) return;

        this.userRooms.delete(userId);

        const room = this.rooms.get(roomId);
        if (!room) return;

        const index = room.findIndex((u) => u.userId === userId);
        if (index !== -1) room.splice(index, 1);

        if (room.length === 0) {
            this.rooms.delete(roomId);
            return;
        }

        this.broadCastToRoom(roomId, {
            type: "peer_left",
            payload: { userId },
        });
    }

    public joinRoom(
        roomId: string,
        userId: string,
        name: string,
        socket: WebSocket,
    ) {
        const room = this.rooms.get(roomId);

        if (!room) {
            sendMessage(socket, {
                type: "room_not_found",
                payload: { message: "room with given id does not exist" },
            });
            return;
        }

        if (this.userRooms.has(userId)) {
            sendMessage(socket, {
                type: "already_joined",
                payload: { message: "User already in a room" },
            });
            return;
        }

        const peers = room.map((u) => ({ userId: u.userId, name: u.name }));

        room.push({ userId, name, socket });
        this.userRooms.set(userId, roomId);

        sendMessage(socket, {
            type: "joined",
            payload: { roomId, userId, peers },
        });

        this.broadCastToRoom(
            roomId,
            { type: "peer_joined", payload: { userId, name } },
            userId,
        );
    }

    public broadCastToRoom(
        roomId: string,
        message: ServerMessage,
        excludeUserId?: string,
    ) {
        const users = this.rooms.get(roomId);

        if (!users) {
            return;
        }

        const msg = JSON.stringify(message);

        for (const u of users) {
            if (u.userId === excludeUserId) continue;
            if (u.socket.readyState === WebSocket.OPEN) {
                u.socket.send(msg);
            }
        }
    }
}
