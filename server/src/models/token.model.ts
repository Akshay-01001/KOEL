import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose";
import { SNAKE_CASE_TIMESTAMPS } from "../utils/constants.js";

const tokenSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token_hash: {
            type: String,
            required: true,
        },
        expires_at: {
            type: Date,
            required: true,
        },
    },
    { timestamps: SNAKE_CASE_TIMESTAMPS },
);

export type Token = InferSchemaType<typeof tokenSchema>;
export type TokenDocument = HydratedDocument<Token>;

export const TokenModel = model("Token", tokenSchema);
