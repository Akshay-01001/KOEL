import { Router } from "express";
import {
    cancelMeeting,
    createMeeting,
    endMeeting,
    getCalendarMeetings,
    getUpcomingMeetings,
    joinMeeting,
    leaveMeeting,
    startMeeting,
    updateMeeting,
} from "../controller/meeting.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";

const meetingRoute = Router();

// Guests (no account) can only join and leave; everything else needs a signed-in user.
meetingRoute.get("/upcoming", requireAuth, getUpcomingMeetings);
meetingRoute.get("/calendar", requireAuth, getCalendarMeetings);
meetingRoute.post("/", requireAuth, createMeeting);
meetingRoute.post("/join/:meetingCode", optionalAuth, joinMeeting);
meetingRoute.patch("/:meetingId", requireAuth, updateMeeting);
meetingRoute.post("/:meetingId/cancel", requireAuth, cancelMeeting);
meetingRoute.post("/:meetingId/start", requireAuth, startMeeting);
meetingRoute.post("/:meetingId/leave", optionalAuth, leaveMeeting);
meetingRoute.post("/:meetingId/end", requireAuth, endMeeting);

export default meetingRoute;
