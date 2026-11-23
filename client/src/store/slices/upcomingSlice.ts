import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
    UpcomingMeeting,
    UpcomingMeetingsPage,
} from "@/api/types/response.types";
import { clearUser } from "@/store/slices/userSlice";
import type { RootState } from "@/store/store";

// Home page "Upcoming" list, loaded a page at a time. The API calls live in
// UpcomingSection; this only holds the result.

export type UpcomingState = {
    status: "idle" | "loading" | "ready" | "error";
    meetings: UpcomingMeeting[];
    total: number;
    page: number;
    hasMore: boolean;
    error: string | null;
    isLoadingMore: boolean;
    loadMoreError: string | null;
    // Bumped to make UpcomingSection load the list again.
    refreshKey: number;
};

const initialState: UpcomingState = {
    status: "idle",
    meetings: [],
    total: 0,
    page: 0,
    hasMore: false,
    error: null,
    isLoadingMore: false,
    loadMoreError: null,
    refreshKey: 0,
};

// Offset pages can overlap if a meeting was added or removed in between.
const appendPage = (existing: UpcomingMeeting[], next: UpcomingMeeting[]) => {
    const seen = new Set(
        existing.map((meeting) => {
            return meeting._id;
        }),
    );
    return [
        ...existing,
        ...next.filter((meeting) => {
            return !seen.has(meeting._id);
        }),
    ];
};

const upcomingSlice = createSlice({
    name: "upcoming",
    initialState,
    reducers: {
        // A list already on screen stays there while it reloads.
        upcomingLoadStarted(state) {
            if (state.status === "ready") return;
            state.status = "loading";
            state.error = null;
        },
        upcomingLoaded(state, action: PayloadAction<UpcomingMeetingsPage>) {
            const data = action.payload;
            state.status = "ready";
            state.meetings = data.meetings;
            state.total = data.total;
            state.page = data.page;
            state.hasMore = data.has_more;
            state.error = null;
            state.isLoadingMore = false;
            state.loadMoreError = null;
        },
        upcomingLoadFailed(state, action: PayloadAction<string>) {
            state.status = "error";
            state.error = action.payload;
        },
        upcomingMoreStarted(state) {
            state.isLoadingMore = true;
            state.loadMoreError = null;
        },
        upcomingMoreLoaded(state, action: PayloadAction<UpcomingMeetingsPage>) {
            const data = action.payload;
            state.meetings = appendPage(state.meetings, data.meetings);
            state.total = data.total;
            state.page = data.page;
            state.hasMore = data.has_more;
            state.isLoadingMore = false;
        },
        upcomingMoreFailed(state, action: PayloadAction<string>) {
            state.isLoadingMore = false;
            state.loadMoreError = action.payload;
        },
        // E.g. after a meeting is scheduled.
        upcomingInvalidated(state) {
            state.refreshKey += 1;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(clearUser, () => {
            return initialState;
        });
    },
});

export const {
    upcomingLoadStarted,
    upcomingLoaded,
    upcomingLoadFailed,
    upcomingMoreStarted,
    upcomingMoreLoaded,
    upcomingMoreFailed,
    upcomingInvalidated,
} = upcomingSlice.actions;

export const selectUpcoming = (state: RootState) => {
    return state.upcoming;
};

export default upcomingSlice.reducer;
