import axios, { type AxiosRequestConfig } from "axios";
import type { ErrorResponse } from "@/api/types/response.types";
import { store } from "@/store/store";
import { requestFinished, requestStarted } from "@/store/slices/loaderSlice";

declare module "axios" {
    interface AxiosRequestConfig {
        // Hide this request from the global loader (e.g. background polling).
        skipGlobalLoader?: boolean;
        // Set once the request is counted, so only counted ones are uncounted.
        countedByLoader?: boolean;
    }
}

const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true,
});

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

// Registers what to do when a request fails because the session ended (see
// SessionExpiryHandler). Pass null to remove it.
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
    onUnauthorized = handler;
}

// Global loader: count every request until it settles.
const finishRequest = (config: AxiosRequestConfig | undefined) => {
    if (config?.countedByLoader) store.dispatch(requestFinished());
};

api.interceptors.request.use((config) => {
    if (!config.skipGlobalLoader) {
        config.countedByLoader = true;
        store.dispatch(requestStarted());
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        finishRequest(response.config);
        return response;
    },
    (error) => {
        finishRequest(
            (error as { config?: AxiosRequestConfig } | null)?.config,
        );
        return Promise.reject(error);
    },
);

// A 401 from anything but the auth endpoints means the session expired or was
// revoked. (On /api/auth/* a 401 is expected: wrong password, or not signed in yet.)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            const url = error.config?.url ?? "";
            if (!url.startsWith("/api/auth/")) onUnauthorized?.();
        }
        return Promise.reject(error);
    },
);

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
