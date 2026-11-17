import { WebSocket } from "ws";
import type { ServerMessage } from "../types/types.js";

export function sendMessage(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}
