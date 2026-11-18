import { LiveKitAPI } from "livekit-server-sdk";

export const LIVEKIT_URL = process.env.LIVEKIT_URL!;
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

export const api = new LiveKitAPI({
    host: LIVEKIT_URL,
    apiKey: LIVEKIT_API_KEY,
    secret: LIVEKIT_API_SECRET,
});
