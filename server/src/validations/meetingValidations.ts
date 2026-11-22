import Joi from "joi";
import { RecordingAccess, WhoCanRecord } from "../models/meeting.model.js";
import { GUEST_ID_PATTERN } from "../utils/functions.js";

export type MeetingSettingsBody = {
    chat_enabled?: boolean;
    screen_share_enabled?: boolean;
    who_can_record?: WhoCanRecord;
    recording_access?: RecordingAccess;
    guest_access?: boolean;
    join_approval_required?: boolean;
};

export type CreateMeetingBody = {
    title: string;
    description?: string | null;
    scheduled_start_at?: Date;
    scheduled_end_at?: Date;
    settings?: MeetingSettingsBody;
};

const meetingSettingsSchema = Joi.object<MeetingSettingsBody>({
    chat_enabled: Joi.boolean(),
    screen_share_enabled: Joi.boolean(),
    who_can_record: Joi.string().valid(...Object.values(WhoCanRecord)),
    recording_access: Joi.string().valid(...Object.values(RecordingAccess)),
    guest_access: Joi.boolean(),
    join_approval_required: Joi.boolean(),
});

export const createMeetingSchema = Joi.object<CreateMeetingBody>({
    title: Joi.string().trim().min(1).max(120).required(),
    description: Joi.string().trim().max(1000).allow("", null),
    scheduled_start_at: Joi.date()
        .iso()
        .greater("now")
        .messages({ "date.greater": "The start time must be in the future" }),
    scheduled_end_at: Joi.when("scheduled_start_at", {
        is: Joi.exist(),
        then: Joi.date().iso().greater(Joi.ref("scheduled_start_at")).messages({
            "date.greater": "The end time must be after the start time",
        }),
        otherwise: Joi.date()
            .iso()
            .greater("now")
            .messages({ "date.greater": "The end time must be in the future" }),
    }),
    settings: meetingSettingsSchema,
}).options({ abortEarly: false, stripUnknown: true });

export type UpcomingMeetingsQuery = {
    page: number;
    limit: number;
};

export const UPCOMING_PAGE_SIZE = 5;
const UPCOMING_MAX_PAGE_SIZE = 20;

// GET /api/meetings/upcoming?page=1&limit=5 — both optional, numbers arrive as strings.
export const upcomingMeetingsQuerySchema = Joi.object<UpcomingMeetingsQuery>({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(UPCOMING_MAX_PAGE_SIZE)
        .default(UPCOMING_PAGE_SIZE),
}).options({ abortEarly: false, stripUnknown: true });

export type JoinMeetingBody = {
    // Only used for guests; signed-in users join under their account name.
    guest_name?: string;
};

export const joinMeetingSchema = Joi.object<JoinMeetingBody>({
    guest_name: Joi.string().trim().max(60).allow(""),
}).options({ abortEarly: false, stripUnknown: true });

export type LeaveMeetingBody = {
    // Guests send the guest_id they got from join; signed-in users send nothing.
    guest_id?: string;
};

export const leaveMeetingSchema = Joi.object<LeaveMeetingBody>({
    guest_id: Joi.string()
        .pattern(GUEST_ID_PATTERN)
        .messages({ "string.pattern.base": "Invalid guest id" }),
}).options({ abortEarly: false, stripUnknown: true });
