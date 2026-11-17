import { SocketClient } from "./SocketClient";

const WS_URL =
    String(import.meta.env.VITE_SERVER_URL).replace(/^http/, "ws") + "/ws";

export const socket = new SocketClient(WS_URL);
