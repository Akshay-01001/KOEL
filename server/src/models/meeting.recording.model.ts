import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";
import { SNAKE_CASE_TIMESTAMPS } from "../utils/constants.js";

export enum RecordingStatus {
    RECORDING = "recording",
    PROCESSING = "processing",
    READY = "ready",
    FAILED = "failed",
}

const meetingRecordingSchema = new Schema(
    {
        meeting_id: {
            type: Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
        },
        started_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        egress_id: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(RecordingStatus),
            default: RecordingStatus.RECORDING,
            required: true,
        },
        file_url: {
            type: String,
            default: null,
        },
        duration: {
            type: Number,
            default: null,
        },
        started_at: {
            type: Date,
            required: true,
        },
        ended_at: {
            type: Date,
            default: null,
        },
        allowed_user_ids: {
            type: [{ type: Schema.Types.ObjectId, ref: "User" }],
            default: [],
        },
    },
    { timestamps: SNAKE_CASE_TIMESTAMPS },
);

export type MeetingRecording = InferSchemaType<typeof meetingRecordingSchema>;
export type MeetingRecordingDocument = HydratedDocument<MeetingRecording>;

export const MeetingRecordingModel = model(
    "Meeting_recording",
    meetingRecordingSchema,
);
