import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { setupWebSocket } from "./socket/ws.js";
import { isProduction } from "./utils/constants.js";
import { createHmac } from "node:crypto";
import type { iceServers } from "./types/types.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "";

app.use(cors({ origin: [CLIENT_URL], credentials: true }));
app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ message: "Bahut maja aa raha hain" });
});

app.get("/ice-servers", (req, res) => {
    res.set("Access-Control-Allow-Origin", CLIENT_URL);

    const iceServers: iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];

    if (isProduction()) {
        const host = process.env.TURN_HOST; // e.g. turn.yourdomain.com
        const username = `${Math.floor(Date.now() / 1000) + 3600}:webrtc`;
        const credential = createHmac("sha1", process.env.TURN_SECRET || "")
            .update(username)
            .digest("base64");

        iceServers.push({
            urls: [
                `turn:${host}:3478?transport=udp`,
                `turn:${host}:3478?transport=tcp`,
                `turns:${host}:5349`,
            ],
            username,
            credential,
        });
    }

    res.json({ iceServers });
});

const server = createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
