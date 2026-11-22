import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
    const DB_URL = process.env.DB_URL;

    if (!DB_URL) {
        console.error("DB_URL is not defined in environment variables");
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(DB_URL);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
