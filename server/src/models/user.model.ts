import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";
import { SNAKE_CASE_TIMESTAMPS } from "../utils/constants.js";

export enum AuthProvider {
    CREDENTIAL = "credential",
    GOOGLE = "google",
}

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            select: false,
        },
        avatar_url: {
            type: String,
            default: null,
        },
        provider: {
            type: String,
            enum: Object.values(AuthProvider),
            default: AuthProvider.CREDENTIAL,
            required: true,
        },
        provider_id: {
            type: String,
            default: null,
        },
        is_verified: {
            type: Boolean,
            default: false,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: SNAKE_CASE_TIMESTAMPS },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

export const UserModel = model("User", userSchema);
