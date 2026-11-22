import type { Response } from "express";

// Shape of every API response. `success` follows the status code (true for 2xx/3xx),
// and `data` is null when there's nothing to send back.
export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T | null;
};

export const sendResponse = <T>(
    res: Response,
    statusCode: number,
    message: string,
    data: T | null = null,
) => {
    const body: ApiResponse<T> = {
        success: statusCode < 400,
        message,
        data,
    };
    return res.status(statusCode).json(body);
};

// For Joi failures: the individual messages go in data.errors.
export const sendValidationError = (
    res: Response,
    message: string,
    details: { message: string }[],
) => {
    return sendResponse(res, 400, message, {
        errors: details.map((detail) => {
            return detail.message;
        }),
    });
};
