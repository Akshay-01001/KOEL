import { Router } from "express";
import {
    createMeeting,
    getCalendarMeetings,
    getUpcomingMeetings,
    joinMeeting,
    leaveMeeting,
    startMeeting,
} from "../controller/meeting.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";

const meetingRoute = Router();

// Guests (no account) can only join and leave; everything else needs a signed-in user.
meetingRoute.get("/upcoming", requireAuth, getUpcomingMeetings);
meetingRoute.get("/calendar", requireAuth, getCalendarMeetings);
meetingRoute.post("/", requireAuth, createMeeting);
meetingRoute.post("/join/:meetingCode", optionalAuth, joinMeeting);
meetingRoute.post("/:meetingId/start", requireAuth, startMeeting);
meetingRoute.post("/:meetingId/leave", optionalAuth, leaveMeeting);

export default meetingRoute;
