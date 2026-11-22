export const isProduction = () => {
    return process.env.NODE_ENV === "production";
};

// Mongoose timestamp fields in snake_case. `as const` keeps the literal names so
// InferSchemaType types them correctly.
export const SNAKE_CASE_TIMESTAMPS = {
    createdAt: "created_at",
    updatedAt: "updated_at",
} as const;
