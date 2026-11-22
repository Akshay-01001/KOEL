import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";
import { SNAKE_CASE_TIMESTAMPS } from "../utils/constants.js";

export enum MeetingStatus {
    SCHEDULED = "scheduled",
    RUNNING = "running",
    ENDED = "ended",
    CANCELLED = "cancelled",
}

export enum WhoCanRecord {
    HOST_ONLY = "host_only",
    ANYONE = "anyone",
}

const meetingSettingsSchema = new Schema(
    {
        chat_enabled: {
            type: Boolean,
            default: true,
        },
        screen_share_enabled: {
            type: Boolean,
            default: true,
        },
        who_can_record: {
            type: String,
            enum: Object.values(WhoCanRecord),
            default: WhoCanRecord.HOST_ONLY,
        },
        guest_access: {
            type: Boolean,
            default: false,
        },
        join_approval_required: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false },
);

const meetingSchema = new Schema(
    {
        meeting_code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: null,
        },
        host_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(MeetingStatus),
            default: MeetingStatus.SCHEDULED,
            required: true,
        },
        scheduled_start_at: {
            type: Date,
            required: true,
        },
        scheduled_end_at: {
            type: Date,
            default: null,
        },
        started_at: {
            type: Date,
            default: null,
        },
        ended_at: {
            type: Date,
            default: null,
        },
        room_name: {
            type: String,
            required: true,
        },
        settings: {
            type: meetingSettingsSchema,
            default: () => ({}),
        },
    },
    { timestamps: SNAKE_CASE_TIMESTAMPS },
);

export type Meeting = InferSchemaType<typeof meetingSchema>;
export type MeetingDocument = HydratedDocument<Meeting>;

export const MeetingModel = model("Meeting", meetingSchema);
