import axios from "axios";
import type { ErrorResponse } from "@/api/types/response.types";

const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true,
});

// Turns a failed request into one readable line to show in the UI.
export function getApiErrorMessage(error: unknown) {
    if (axios.isAxiosError<ErrorResponse>(error)) {
        const data = error.response?.data;
        const errors = data?.data?.errors;
        if (errors?.length) return errors.join(". ");
        if (data?.message) return data.message;
        if (!error.response) return "Can't reach the server. Try again.";
    }
    return "Something went wrong. Try again.";
}

export default api;
