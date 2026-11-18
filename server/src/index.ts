import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { createRoom, getJoinToken } from "./controller/room.controller.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "";

app.use(cors({ origin: [CLIENT_URL], credentials: true }));
app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ message: "Bahut maja aa raha hain" });
});

app.post("/api/rooms", createRoom);
app.post("/api/rooms/token", getJoinToken);

const server = createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
