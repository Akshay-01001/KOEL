import api from "@/api/api";
import type {
    CreateMeetingPayload,
    LoginPayload,
    RegisterPayload,
    ScheduleMeetingPayload,
} from "@/api/types/payload.types";
import type {
    ApiResponse,
    CalendarMeeting,
    JoinMeetingData,
    Meeting,
    UpcomingMeetingsPage,
    User,
} from "@/api/types/response.types";

// Successful responses always carry data; this narrows away the null.
function getData<T>(body: ApiResponse<T>) {
    if (body.data === null) {
        throw new Error(body.message || "The server sent an empty response");
    }
    return body.data;
}

export async function login(payload: LoginPayload) {
    const { data } = await api.post<ApiResponse<User>>(
        "/api/auth/login",
        payload,
    );
    return getData(data);
}

export async function register(payload: RegisterPayload) {
    const { data } = await api.post<ApiResponse<User>>(
        "/api/auth/register",
        payload,
    );
    return getData(data);
}

// Ends this browser's session on the server and clears the cookie.
export async function logout() {
    const { data } = await api.post<ApiResponse<null>>("/api/auth/logout");
    return data.message;
}

export async function getMe(signal?: AbortSignal) {
    const { data } = await api.get<ApiResponse<User>>("/api/auth/me", {
        signal,
    });
    return getData(data);
}

// Creates a meeting and starts its room straight away.
export async function createInstantMeeting(payload: CreateMeetingPayload) {
    const { data } = await api.post<ApiResponse<Meeting>>(
        "/api/meetings",
        payload,
    );
    return getData(data);
}

export async function scheduleMeeting(payload: ScheduleMeetingPayload) {
    const { data } = await api.post<ApiResponse<Meeting>>(
        "/api/meetings",
        payload,
    );
    return getData(data);
}

// One page of the meetings the user hosts that are running or still ahead. The server sends 5 per page unless `limit` says otherwise (max 20).
export async function getUpcomingMeetings(page: number, signal?: AbortSignal) {
    const { data } = await api.get<ApiResponse<UpcomingMeetingsPage>>(
        "/api/meetings/upcoming",
        { params: { page }, signal },
    );
    return getData(data);
}

// Meetings the user hosts or has joined that overlap [from, to), soonest first.
// The server allows a range of up to 100 days.
export async function getCalendarMeetings(
    from: Date,
    to: Date,
    signal?: AbortSignal,
) {
    const { data } = await api.get<ApiResponse<CalendarMeeting[]>>(
        "/api/meetings/calendar",
        { params: { from: from.toISOString(), to: to.toISOString() }, signal },
    );
    return getData(data);
}

// Host only: opens the room for a scheduled meeting so people can join.
export async function startMeeting(meetingId: string) {
    const { data } = await api.post<ApiResponse<Meeting>>(
        `/api/meetings/${encodeURIComponent(meetingId)}/start`,
    );
    return getData(data);
}

// Signed-in users join under their account. Guests pass the name others will
// see (the server picks "Anonymous 1234" if it's empty).
export async function joinMeeting(
    meetingCode: string,
    guestName?: string,
    signal?: AbortSignal,
    // Background retries while waiting for the host skip the global loader.
    isBackground = false,
) {
    const { data } = await api.post<ApiResponse<JoinMeetingData>>(
        `/api/meetings/join/${encodeURIComponent(meetingCode)}`,
        guestName === undefined ? undefined : { guest_name: guestName },
        { signal, skipGlobalLoader: isBackground },
    );
    return getData(data);
}

// For the host this ends the meeting for everyone. Guests pass the guest_id
// they got from joinMeeting. Returns the server's message.
export async function leaveMeeting(meetingId: string, guestId?: string | null) {
    const { data } = await api.post<ApiResponse<null>>(
        `/api/meetings/${encodeURIComponent(meetingId)}/leave`,
        guestId ? { guest_id: guestId } : undefined,
    );
    return data.message;
}
