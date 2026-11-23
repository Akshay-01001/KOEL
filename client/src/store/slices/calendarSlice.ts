import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CalendarMeeting } from "@/api/types/response.types";
import { clearUser } from "@/store/slices/userSlice";
import type { RootState } from "@/store/store";

// Calendar page: current view/date, the range on screen and its meetings.
// The API calls live in CalendarPage; this only holds the result.

export type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

// ISO strings, so the state stays serializable.
export type CalendarRange = {
    from: string;
    to: string;
};

type CalendarState = {
    // Where to reopen the calendar; null before the first visit.
    view: CalendarView | null;
    date: string | null;
    range: CalendarRange | null;
    // The previous range's meetings stay while the next one loads.
    status: "idle" | "loading" | "ready" | "error";
    meetings: CalendarMeeting[];
    error: string | null;
    // Bumped to make CalendarPage load the same range again.
    refreshKey: number;
};

const initialState: CalendarState = {
    view: null,
    date: null,
    range: null,
    status: "idle",
    meetings: [],
    error: null,
    refreshKey: 0,
};

const calendarSlice = createSlice({
    name: "calendar",
    initialState,
    reducers: {
        calendarPositionChanged(
            state,
            action: PayloadAction<{ view: CalendarView; date: string }>,
        ) {
            state.view = action.payload.view;
            state.date = action.payload.date;
        },
        // Same range again is ignored, so it doesn't trigger another load.
        calendarRangeChanged(state, action: PayloadAction<CalendarRange>) {
            const { from, to } = action.payload;
            if (state.range?.from === from && state.range.to === to) return;
            state.range = { from, to };
        },
        calendarLoadStarted(state) {
            state.status = "loading";
            state.error = null;
        },
        calendarLoaded(state, action: PayloadAction<CalendarMeeting[]>) {
            state.status = "ready";
            state.meetings = action.payload;
        },
        calendarLoadFailed(state, action: PayloadAction<string>) {
            state.status = "error";
            state.error = action.payload;
        },
        // E.g. after a meeting is scheduled, or to retry.
        calendarInvalidated(state) {
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
    calendarPositionChanged,
    calendarRangeChanged,
    calendarLoadStarted,
    calendarLoaded,
    calendarLoadFailed,
    calendarInvalidated,
} = calendarSlice.actions;

export const selectCalendar = (state: RootState) => {
    return state.calendar;
};

export default calendarSlice.reducer;
