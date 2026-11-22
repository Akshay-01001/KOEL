import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";
import { SNAKE_CASE_TIMESTAMPS } from "../utils/constants.js";

export enum ParticipantRole {
    HOST = "host",
    PARTICIPANT = "participant",
}

const sessionSchema = new Schema(
    {
        joined_at: {
            type: Date,
            required: true,
        },
        left_at: {
            type: Date,
            default: null,
        },
    },
    { _id: false },
);

const meetingParticipantSchema = new Schema(
    {
        meeting_id: {
            type: Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        guest_id: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            enum: Object.values(ParticipantRole),
            default: ParticipantRole.PARTICIPANT,
            required: true,
        },
        sessions: {
            type: [sessionSchema],
            default: [],
        },
    },
    { timestamps: SNAKE_CASE_TIMESTAMPS },
);

export type MeetingParticipant = InferSchemaType<
    typeof meetingParticipantSchema
>;
export type MeetingParticipantDocument = HydratedDocument<MeetingParticipant>;

export const MeetingParticipantModel = model(
    "Meeting_participant",
    meetingParticipantSchema,
);
