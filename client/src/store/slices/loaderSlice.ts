import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

// Counts API requests in flight for the global loader. Updated by the axios
// interceptors in api.ts.

type LoaderState = {
    pendingRequests: number;
};

const initialState: LoaderState = {
    pendingRequests: 0,
};

const loaderSlice = createSlice({
    name: "loader",
    initialState,
    reducers: {
        requestStarted(state) {
            state.pendingRequests += 1;
        },
        requestFinished(state) {
            state.pendingRequests = Math.max(0, state.pendingRequests - 1);
        },
    },
});

export const { requestStarted, requestFinished } = loaderSlice.actions;

export const selectIsLoading = (state: RootState) => {
    return state.loader.pendingRequests > 0;
};

export default loaderSlice.reducer;
