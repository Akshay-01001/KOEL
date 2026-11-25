import type { UpcomingMeeting } from "@/api/types/response.types";
import { formatDate, formatTime, isSameDay } from "@/lib/dateFormat";

const MINUTE_MS = 60_000;
// Show "Starts in N min" when a meeting is this close.
const SOON_WINDOW_MINUTES = 60;

// "SUN" and "22" for the date block on the left of each row.
export function getDateBlock(date: Date) {
    return {
        dayOfWeek: new Intl.DateTimeFormat(undefined, { weekday: "short" })
            .format(date)
            .toUpperCase(),
        day: String(date.getDate()),
    };
}

// "Today, 20:30", "Tomorrow, 11:00", "25/11/2026, 16:00", or "Started 20:31"
// for a meeting that's live.
export function getWhenText(meeting: UpcomingMeeting, now: Date) {
    if (meeting.status === "running" && meeting.started_at) {
        return `Started ${formatTime(new Date(meeting.started_at))}`;
    }

    const start = new Date(meeting.scheduled_start_at);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    let day: string;
    if (isSameDay(start, now)) {
        day = "Today";
    } else if (isSameDay(start, tomorrow)) {
        day = "Tomorrow";
    } else {
        day = formatDate(start);
    }

    return `${day}, ${formatTime(start)}`;
}

// The small badge next to the title, if any.
export function getStatusBadge(meeting: UpcomingMeeting, now: Date) {
    if (meeting.status === "running") {
        return { text: "Live now", isLive: true };
    }

    const minutesUntilStart = Math.ceil(
        (new Date(meeting.scheduled_start_at).getTime() - now.getTime()) /
            MINUTE_MS,
    );
    if (minutesUntilStart <= 0) {
        return {
            text: meeting.is_host ? "Ready to start" : "Waiting for host",
            isLive: false,
        };
    }
    if (minutesUntilStart <= SOON_WINDOW_MINUTES) {
        return { text: `Starts in ${minutesUntilStart} min`, isLive: false };
    }
    return null;
}
