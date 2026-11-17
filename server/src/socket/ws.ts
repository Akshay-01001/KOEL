import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { RoomService } from "./roomService.js";
import { sendMessage } from "./send.js";
import { clientMessageSchema } from "../types/types.js";

const HEARTBEAT_INTERVAL_MS = 30_000;

export type AliveSocket = WebSocket & { isAlive?: boolean };

export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: "/ws" });
    const roomService = new RoomService();

    wss.on("connection", (socket: AliveSocket, req) => {
        socket.isAlive = true;
        console.log(`WS connected: ${req.socket.remoteAddress}`);

        socket.on("pong", () => {
            socket.isAlive = true;
        });

        socket.on("message", (data, isBinary) => {
            if (isBinary) return;

            let raw: unknown;
            try {
                raw = JSON.parse(data.toString());
            } catch {
                sendMessage(socket, {
                    type: "error",
                    payload: { message: "Invalid JSON" },
                });
                return;
            }

            const parsed = clientMessageSchema.safeParse(raw);
            if (!parsed.success) {
                sendMessage(socket, {
                    type: "error",
                    payload: { message: "Invalid message" },
                });
                return;
            }

            roomService.handleMessage(parsed.data, socket);
        });

        socket.on("close", () => {
            console.log("WS disconnected");
        });

        socket.on("error", (err) => {
            console.error("WS error:", err);
        });
    });

    // Terminate connections that stop answering pings (e.g. dropped networks)
    const heartbeat = setInterval(() => {
        for (const client of wss.clients as Set<AliveSocket>) {
            if (!client.isAlive) {
                client.terminate();
                continue;
            }
            client.isAlive = false;
            client.ping();
        }
    }, HEARTBEAT_INTERVAL_MS);

    wss.on("close", () => clearInterval(heartbeat));

    return wss;
}

export function broadcast(wss: WebSocketServer, payload: unknown) {
    const msg = JSON.stringify(payload);
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
}
