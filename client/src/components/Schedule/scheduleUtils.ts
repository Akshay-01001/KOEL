import type { MeetingSettings } from "@/api/types/payload.types";

// Same defaults the server uses when a setting isn't sent.
export const DEFAULT_MEETING_SETTINGS: MeetingSettings = {
    chat_enabled: true,
    screen_share_enabled: true,
    who_can_record: "host_only",
    guest_access: false,
    join_approval_required: true,
};

const SLOT_MINUTES = 30;
// Leave at least this long before the first suggested start time.
const MIN_LEAD_MINUTES = 15;
const DEFAULT_LENGTH_MINUTES = 30;

const pad = (value: number) => {
    return String(value).padStart(2, "0");
};

// "YYYY-MM-DD" in local time, the format <input type="date"> uses.
export function toDateInputValue(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "HH:MM" in local time, the format <input type="time"> uses.
export function toTimeInputValue(date: Date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Turns the date and time inputs back into a local Date. Returns null if either is empty.
export function combineDateAndTime(date: string, time: string) {
    if (!date || !time) return null;
    const combined = new Date(`${date}T${time}`);
    return Number.isNaN(combined.getTime()) ? null : combined;
}

// The next half-hour slot at least 15 minutes from now, plus a 30-minute end.
export function getDefaultSlot(now: Date) {
    const start = new Date(now.getTime() + MIN_LEAD_MINUTES * 60_000);
    const minutes = start.getMinutes();
    const roundedUp = Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES;
    start.setMinutes(roundedUp, 0, 0);
    const end = new Date(start.getTime() + DEFAULT_LENGTH_MINUTES * 60_000);
    return { start, end };
}

// e.g. "India Standard Time (GMT+5:30)".
export function getTimeZoneLabel(date: Date) {
    const findPart = (timeZoneName: "long" | "shortOffset") => {
        return new Intl.DateTimeFormat(undefined, { timeZoneName })
            .formatToParts(date)
            .find((part) => {
                return part.type === "timeZoneName";
            })?.value;
    };
    const name = findPart("long");
    const offset = findPart("shortOffset");
    if (name && offset && name !== offset) return `${name} (${offset})`;
    return name ?? offset ?? "";
}

// e.g. "Mon, 23 Nov · 11:00 – 11:45 AM", or without the end time.
export function formatMeetingTime(start: Date, end: Date | null) {
    const day = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(start);
    const time = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });
    const range = end ? time.formatRange(start, end) : time.format(start);
    return `${day} · ${range}`;
}
