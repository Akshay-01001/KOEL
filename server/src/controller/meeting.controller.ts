import type { Request, Response } from "express";
import { isValidObjectId, type Types } from "mongoose";
import { LIVEKIT_URL } from "../livekit/config.js";
import {
    MeetingModel,
    MeetingStatus,
    type MeetingDocument,
} from "../models/meeting.model.js";
import {
    MeetingParticipantModel,
    ParticipantRole,
} from "../models/meeting.participant.model.js";
import {
    closeMeetingRoom,
    closeOpenSessions,
    createGuestId,
    createGuestName,
    createJoinToken,
    generateMeetingCode,
    isDuplicateKeyError,
    openMeetingRoom,
    recordJoin,
} from "../utils/functions.js";
import {
    CALENDAR_MAX_RANGE_DAYS,
    calendarMeetingsQuerySchema,
    createMeetingSchema,
    joinMeetingSchema,
    leaveMeetingSchema,
    upcomingMeetingsQuerySchema,
} from "../validations/meetingValidations.js";
import { sendResponse, sendValidationError } from "../utils/response.js";

const MAX_CODE_ATTEMPTS = 5;
// A scheduled meeting with no end time stays listed this long after its start time.
const NO_END_TIME_GRACE_MS = 60 * 60 * 1000;
// A meeting still "running" after this long was most likely abandoned (the host
// closed the tab instead of pressing Leave), so it's left off the list.
const STALE_RUNNING_MS = 12 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
// Safety cap on one calendar response.
const CALENDAR_MAX_MEETINGS = 500;

const findMeetingFromParams = async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    if (typeof meetingId !== "string" || !isValidObjectId(meetingId)) {
        sendResponse(res, 400, "Invalid meeting id");
        return null;
    }

    const meeting = await MeetingModel.findById(meetingId);
    if (!meeting) {
        sendResponse(res, 404, "Meeting not found");
        return null;
    }
    return meeting;
};

export const createMeeting = async (req: Request, res: Response) => {
    const { value, error } = createMeetingSchema.validate(req.body ?? {});
    if (error) {
        return sendValidationError(res, "Invalid request body", error.details);
    }

    const {
        title,
        description,
        scheduled_start_at,
        scheduled_end_at,
        settings,
    } = value;
    const isInstant = !scheduled_start_at;

    try {
        let meeting: MeetingDocument | null = null;
        for (
            let attempt = 0;
            attempt < MAX_CODE_ATTEMPTS && !meeting;
            attempt++
        ) {
            const code = generateMeetingCode();
            try {
                meeting = await MeetingModel.create({
                    meeting_code: code,
                    room_name: code,
                    title,
                    description: description || null,
                    host_id: req.userId,
                    scheduled_start_at: scheduled_start_at ?? new Date(),
                    scheduled_end_at: scheduled_end_at ?? null,
                    // Instant meetings let guests in unless the request says otherwise;
                    // scheduled ones follow the "Allow guests" setting (off by default).
                    settings: isInstant
                        ? { guest_access: true, ...settings }
                        : settings,
                });
            } catch (createError) {
                if (!isDuplicateKeyError(createError)) throw createError;
            }
        }

        if (!meeting) {
            return sendResponse(res, 500, "Could not generate a meeting code");
        }

        if (!isInstant) {
            return sendResponse(res, 201, "Meeting scheduled", meeting);
        }

        try {
            const started = await openMeetingRoom(meeting);
            return sendResponse(res, 201, "Meeting started", started);
        } catch (roomError) {
            console.error("Failed to create LiveKit room:", roomError);
            return sendResponse(
                res,
                502,
                "Meeting created, but the room could not be started. Try starting it again.",
                meeting,
            );
        }
    } catch (error) {
        console.error("Failed to create meeting:", error);
        return sendResponse(res, 500, "Failed to create meeting");
    }
};

export const startMeeting = async (req: Request, res: Response) => {
    try {
        const meeting = await findMeetingFromParams(req, res);
        if (!meeting) return;

        if (!meeting.host_id.equals(req.userId)) {
            return sendResponse(
                res,
                403,
                "Only the host can start this meeting",
            );
        }

        if (meeting.status === MeetingStatus.RUNNING) {
            return sendResponse(
                res,
                200,
                "Meeting is already running",
                meeting,
            );
        }
        if (meeting.status !== MeetingStatus.SCHEDULED) {
            return sendResponse(res, 409, `This meeting has ${meeting.status}`);
        }

        const started = await openMeetingRoom(meeting);
        if (!started) {
            return sendResponse(
                res,
                409,
                "This meeting is no longer scheduled",
            );
        }

        return sendResponse(res, 200, "Meeting started", started);
    } catch (error) {
        console.error("Failed to start meeting:", error);
        return sendResponse(res, 500, "Failed to start meeting");
    }
};

// Signed-in users join under their account. Guests (no cookie) may join only
// meetings with guest access on; they get a guest_id to send back when leaving.
export const joinMeeting = async (req: Request, res: Response) => {
    const meetingCode = String(req.params.meetingCode ?? "")
        .trim()
        .toLowerCase();
    if (!meetingCode) {
        return sendResponse(res, 400, "Meeting code is required");
    }

    const { value: body, error } = joinMeetingSchema.validate(req.body ?? {});
    if (error) {
        return sendValidationError(res, "Invalid request body", error.details);
    }

    try {
        const meeting = await MeetingModel.findOne({
            meeting_code: meetingCode,
        });
        if (!meeting) {
            return sendResponse(res, 404, "Meeting not found");
        }

        const userId = req.userId;
        const isHost = !!userId && meeting.host_id.equals(userId);
        const settings = meeting.settings;

        if (!userId && !settings?.guest_access) {
            return sendResponse(
                res,
                403,
                "This meeting doesn't allow guests. Sign in to join.",
            );
        }

        if (meeting.status === MeetingStatus.SCHEDULED) {
            return sendResponse(
                res,
                409,
                isHost
                    ? "Start the meeting before joining"
                    : "The host hasn't started this meeting yet",
                { meeting_id: meeting._id, is_host: isHost },
            );
        }

        if (meeting.status !== MeetingStatus.RUNNING) {
            return sendResponse(res, 410, `This meeting has ${meeting.status}`);
        }

        const guestId = userId ? null : createGuestId();
        const participant = userId
            ? { user_id: userId }
            : { guest_id: guestId! };
        const role = isHost
            ? ParticipantRole.HOST
            : ParticipantRole.PARTICIPANT;
        await recordJoin(meeting._id, participant, role);

        const token = await createJoinToken({
            identity: userId ?? guestId!,
            name: userId
                ? (req.name ?? "Participant")
                : body.guest_name || createGuestName(),
            roomName: meeting.room_name,
            isHost,
            chatEnabled: settings?.chat_enabled ?? true,
            screenShareEnabled: settings?.screen_share_enabled ?? true,
        });

        return sendResponse(res, 200, "Joined the meeting", {
            token,
            url: LIVEKIT_URL,
            role,
            meeting,
            guest_id: guestId,
        });
    } catch (error) {
        console.error("Failed to join meeting:", error);
        return sendResponse(res, 500, "Failed to join meeting");
    }
};

// Signed-in users leave by cookie; guests send the guest_id they got from join.
// When the host leaves a running meeting, it ends for everyone.
export const leaveMeeting = async (req: Request, res: Response) => {
    const { value: body, error } = leaveMeetingSchema.validate(req.body ?? {});
    if (error) {
        return sendValidationError(res, "Invalid request body", error.details);
    }

    try {
        const meeting = await findMeetingFromParams(req, res);
        if (!meeting) return;

        const userId = req.userId;

        if (!userId) {
            if (!body.guest_id) {
                return sendResponse(
                    res,
                    400,
                    "Guests must send their guest_id",
                );
            }
            await closeOpenSessions(
                { meeting_id: meeting._id, guest_id: body.guest_id },
                new Date(),
            );
            return sendResponse(res, 200, "Left the meeting");
        }

        if (
            meeting.host_id.equals(userId) &&
            meeting.status === MeetingStatus.RUNNING
        ) {
            await closeMeetingRoom(meeting);
            return sendResponse(res, 200, "Meeting ended for everyone");
        }

        await closeOpenSessions(
            { meeting_id: meeting._id, user_id: userId },
            new Date(),
        );
        return sendResponse(res, 200, "Left the meeting");
    } catch (error) {
        console.error("Failed to leave meeting:", error);
        return sendResponse(res, 500, "Failed to leave meeting");
    }
};

// Meetings the user hosts that are running or still ahead, soonest first,
// one page at a time (?page=1&limit=5).
export const getUpcomingMeetings = async (req: Request, res: Response) => {
    const { value: query, error: queryError } =
        upcomingMeetingsQuerySchema.validate(req.query);
    if (queryError) {
        return sendValidationError(res, "Invalid query", queryError.details);
    }
    const { page, limit } = query;

    try {
        const now = Date.now();
        const filter = {
            host_id: req.userId,
            $or: [
                {
                    status: MeetingStatus.RUNNING,
                    started_at: {
                        $gt: new Date(now - STALE_RUNNING_MS),
                    },
                },
                {
                    status: MeetingStatus.SCHEDULED,
                    scheduled_end_at: { $gt: new Date(now) },
                },
                {
                    status: MeetingStatus.SCHEDULED,
                    scheduled_end_at: null,
                    scheduled_start_at: {
                        $gt: new Date(now - NO_END_TIME_GRACE_MS),
                    },
                },
            ],
        };

        const [meetings, total] = await Promise.all([
            MeetingModel.find(filter)
                // _id breaks ties so pages don't overlap when start times match.
                .sort({ scheduled_start_at: 1, _id: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate<{
                    host_id: { _id: Types.ObjectId; name: string } | null;
                }>("host_id", "name"),
            MeetingModel.countDocuments(filter),
        ]);

        return sendResponse(res, 200, "Upcoming meetings", {
            page,
            limit,
            total,
            has_more: page * limit < total,
            meetings: meetings.map((meeting) => {
                const host = meeting.host_id;
                return {
                    _id: meeting._id,
                    meeting_code: meeting.meeting_code,
                    title: meeting.title,
                    description: meeting.description,
                    status: meeting.status,
                    scheduled_start_at: meeting.scheduled_start_at,
                    scheduled_end_at: meeting.scheduled_end_at,
                    started_at: meeting.started_at,
                    is_host: host ? host._id.equals(req.userId) : false,
                    host_name: host?.name ?? "Unknown host",
                };
            }),
        });
    } catch (error) {
        console.error("Failed to list upcoming meetings:", error);
        return sendResponse(res, 500, "Failed to load upcoming meetings");
    }
};

// Meetings shown on the calendar between ?from and ?to (ISO dates): the ones the
// user hosts plus the ones they've joined, in any status, soonest first.
// A meeting is included if any part of it falls inside the range; one without
// an end time counts as a moment at its start.
export const getCalendarMeetings = async (req: Request, res: Response) => {
    const { value: query, error: queryError } =
        calendarMeetingsQuerySchema.validate(req.query);
    if (queryError) {
        return sendValidationError(res, "Invalid query", queryError.details);
    }
    const { from, to } = query;
    if (to.getTime() - from.getTime() > CALENDAR_MAX_RANGE_DAYS * DAY_MS) {
        return sendResponse(
            res,
            400,
            `The range can be at most ${CALENDAR_MAX_RANGE_DAYS} days`,
        );
    }

    try {
        const joinedMeetingIds = await MeetingParticipantModel.distinct(
            "meeting_id",
            { user_id: req.userId },
        );

        const meetings = await MeetingModel.find({
            $and: [
                {
                    $or: [
                        { host_id: req.userId },
                        { _id: { $in: joinedMeetingIds } },
                    ],
                },
                { scheduled_start_at: { $lt: to } },
                {
                    $or: [
                        { scheduled_end_at: { $gt: from } },
                        {
                            scheduled_end_at: null,
                            scheduled_start_at: { $gte: from },
                        },
                    ],
                },
            ],
        })
            .sort({ scheduled_start_at: 1, _id: 1 })
            .limit(CALENDAR_MAX_MEETINGS)
            .populate<{
                host_id: { _id: Types.ObjectId; name: string } | null;
            }>("host_id", "name");

        return sendResponse(
            res,
            200,
            "Calendar meetings",
            meetings.map((meeting) => {
                const host = meeting.host_id;
                return {
                    _id: meeting._id,
                    meeting_code: meeting.meeting_code,
                    title: meeting.title,
                    description: meeting.description,
                    status: meeting.status,
                    scheduled_start_at: meeting.scheduled_start_at,
                    scheduled_end_at: meeting.scheduled_end_at,
                    started_at: meeting.started_at,
                    ended_at: meeting.ended_at,
                    is_host: host ? host._id.equals(req.userId) : false,
                    host_name: host?.name ?? "Unknown host",
                };
            }),
        );
    } catch (error) {
        console.error("Failed to list calendar meetings:", error);
        return sendResponse(res, 500, "Failed to load calendar meetings");
    }
};
