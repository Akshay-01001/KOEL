import type { MeetingSettings } from "@/api/types/payload.types";

// Response bodies returned by the server.

// Every response has this shape: success follows the status code, and data holds
// the payload (null when there's nothing to send).
export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T | null;
};

export type User = {
    id: string;
    name: string;
    email: string;
    provider: string;
    isVerified: boolean;
    avatar_url: string | null;
};

// `data` of a 4xx/5xx response, when there is one: `errors` on validation failures,
// and meeting_id/is_host when joining a meeting that hasn't started (409).
export type ErrorData = {
    errors?: string[];
    meeting_id?: string;
    is_host?: boolean;
};

export type ErrorResponse = ApiResponse<ErrorData>;

export type MeetingStatus = "scheduled" | "running" | "ended" | "cancelled";

export type ParticipantRole = "host" | "participant";

export type Meeting = {
    _id: string;
    meeting_code: string;
    title: string;
    description: string | null;
    host_id: string;
    status: MeetingStatus;
    scheduled_start_at: string;
    scheduled_end_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    settings: MeetingSettings;
};

// `data` of POST /api/meetings/join/:meetingCode — everything needed to connect to LiveKit.
export type JoinMeetingData = {
    token: string;
    url: string;
    role: ParticipantRole;
    meeting: Meeting;
    // Set only for guests: sent back to the server when leaving.
    guest_id: string | null;
};

// One row of GET /api/meetings/upcoming.
export type UpcomingMeeting = {
    _id: string;
    meeting_code: string;
    title: string;
    description: string | null;
    status: "scheduled" | "running";
    scheduled_start_at: string;
    scheduled_end_at: string | null;
    started_at: string | null;
    is_host: boolean;
    host_name: string;
};

// `data` of GET /api/meetings/upcoming?page=1&limit=5
export type UpcomingMeetingsPage = {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
    meetings: UpcomingMeeting[];
};
