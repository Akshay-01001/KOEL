import "dotenv/config";
import { createServer } from "node:http";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import meetingRoute from "./routes/meeting.route.js";
import { connectDB } from "./utils/db.js";
import { sendResponse } from "./utils/response.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "";

app.use(cors({ origin: [CLIENT_URL], credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
    sendResponse(res, 200, "Bahut maja aa raha hain");
});

app.use("/api/auth", authRoute);
app.use("/api/meetings", meetingRoute);

// Anything no route matched.
app.use((_req, res) => {
    sendResponse(res, 404, "Route not found");
});

// Errors thrown outside the handlers' own try/catch, e.g. a malformed JSON body.
app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && "body" in error) {
        return sendResponse(res, 400, "Request body is not valid JSON");
    }
    console.error("Unhandled error:", error);
    return sendResponse(res, 500, "Something went wrong");
});

const server = createServer(app);

await connectDB();

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
