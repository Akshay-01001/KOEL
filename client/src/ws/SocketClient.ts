import type {
    ClientEventType,
    ClientToServerEvents,
    ServerMessage,
} from "../types/types";

export class SocketClient {
    private ws: WebSocket | null = null;
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    connect() {
        if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => console.log("WS connected");
        this.ws.onclose = () => console.log("WS closed");
        this.ws.onerror = (e) => console.error("WS error", e);

        this.ws.onmessage = (e: MessageEvent<string>) => {
            let message: ServerMessage;
            try {
                message = JSON.parse(e.data);
            } catch {
                console.error("WS: invalid JSON", e.data);
                return;
            }
            this.handleMessage(message);
        };
    }

    send<K extends ClientEventType>(type: K, payload: ClientToServerEvents[K]) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.warn(`WS not open, dropped "${type}"`);
            return;
        }
        this.ws.send(JSON.stringify({ type, payload }));
    }

    disconnect() {
        this.ws?.close();
        this.ws = null;
    }

    private handleMessage(message: ServerMessage) {
        switch (message.type) {
            case "joined": {
                const { roomId, userId, peers } = message.payload;
                console.log("joined", roomId, userId, peers);
                break;
            }
            case "peer_joined": {
                const { userId, name } = message.payload;
                console.log("peer_joined", userId, name);
                break;
            }
            case "peer_left": {
                console.log("peer_left", message.payload.userId);
                break;
            }
            case "room_not_found":
            case "already_joined":
            case "error": {
                console.error(message.type, message.payload.message);
                break;
            }
        }
    }
}
