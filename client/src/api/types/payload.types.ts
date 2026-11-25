// Request bodies sent to the server.

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
};

export type WhoCanRecord = "host_only" | "anyone";

export type MeetingSettings = {
    chat_enabled: boolean;
    screen_share_enabled: boolean;
    who_can_record: WhoCanRecord;
    guest_access: boolean;
    join_approval_required: boolean;
};

// POST /api/meetings with no scheduled_start_at starts the meeting right away.
export type CreateMeetingPayload = {
    title: string;
};

// POST /api/meetings with a scheduled_start_at saves it for later.
// Dates are ISO strings; scheduled_end_at is optional.
export type ScheduleMeetingPayload = {
    title: string;
    description?: string;
    scheduled_start_at: string;
    scheduled_end_at?: string;
    settings: MeetingSettings;
};

// PATCH /api/meetings/:meetingId (host, scheduled meetings only). Every field is
// optional; scheduled_end_at: null removes the end time.
export type UpdateMeetingPayload = {
    title?: string;
    description?: string | null;
    scheduled_start_at?: string;
    scheduled_end_at?: string | null;
    settings?: MeetingSettings;
};
