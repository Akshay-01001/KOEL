import type { MeetingSettings } from "@/api/types/payload.types";
import { formatDate, formatTime, parseDate, parseTime } from "@/lib/dateFormat";

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

// "DD/MM/YYYY" in local time, the format the date field uses.
export function toDateInputValue(date: Date) {
    return formatDate(date);
}

// "HH:MM" (24-hour) in local time, the format the time fields use.
export function toTimeInputValue(date: Date) {
    return formatTime(date);
}

// Turns the date ("DD/MM/YYYY") and time ("HH:MM") fields back into a local
// Date. Returns null if either is empty or not a real date/time.
export function combineDateAndTime(date: string, time: string) {
    const day = parseDate(date);
    const clock = parseTime(time);
    if (!day || !clock) return null;
    return new Date(
        day.year,
        day.month - 1,
        day.day,
        clock.hours,
        clock.minutes,
    );
}

// The next half-hour slot at least 15 minutes from now.
export function getDefaultStart(now: Date) {
    const start = new Date(now.getTime() + MIN_LEAD_MINUTES * 60_000);
    const minutes = start.getMinutes();
    const roundedUp = Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES;
    start.setMinutes(roundedUp, 0, 0);
    return start;
}

// Where a meeting starts when a whole day is picked (month view).
const PICKED_DAY_START_HOUR = 9;

// The start time for a selection on the calendar.
// - Week/day views: the selected time, e.g. 10:00.
// - Month view: 09:00 on the selected day.
// If that has passed (or is under 15 minutes away), the next free slot instead.
export function getStartForCalendarSelection(
    selectedStart: Date,
    isAllDay: boolean,
    now: Date,
) {
    const start = new Date(selectedStart);
    if (isAllDay) start.setHours(PICKED_DAY_START_HOUR, 0, 0, 0);

    if (start.getTime() >= now.getTime() + MIN_LEAD_MINUTES * 60_000) {
        return start;
    }
    return getDefaultStart(now);
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

// e.g. "23/11/2026 · 11:00".
export function formatMeetingTime(start: Date) {
    return `${formatDate(start)} · ${formatTime(start)}`;
}
