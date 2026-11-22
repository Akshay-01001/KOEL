import type { UpcomingMeeting } from "@/api/types/response.types";

const MINUTE_MS = 60_000;
// Show "Starts in N min" when a meeting is this close.
const SOON_WINDOW_MINUTES = 60;

const isSameDay = (a: Date, b: Date) => {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
};

const timeFormat = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
});

// "SUN" and "22" for the date block on the left of each row.
export function getDateBlock(date: Date) {
    return {
        dayOfWeek: new Intl.DateTimeFormat(undefined, { weekday: "short" })
            .format(date)
            .toUpperCase(),
        day: String(date.getDate()),
    };
}

// "Today, 8:30 – 9:15 PM", "Tomorrow, 11:00 AM", "Wed, 25 Nov, 4:00 – 4:30 PM",
// or "Started 8:31 PM" for a meeting that's live.
export function getWhenText(meeting: UpcomingMeeting, now: Date) {
    if (meeting.status === "running" && meeting.started_at) {
        return `Started ${timeFormat.format(new Date(meeting.started_at))}`;
    }

    const start = new Date(meeting.scheduled_start_at);
    const end = meeting.scheduled_end_at
        ? new Date(meeting.scheduled_end_at)
        : null;
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    let day: string;
    if (isSameDay(start, now)) {
        day = "Today";
    } else if (isSameDay(start, tomorrow)) {
        day = "Tomorrow";
    } else {
        day = new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
        }).format(start);
    }

    const time = end
        ? timeFormat.formatRange(start, end)
        : timeFormat.format(start);
    return `${day}, ${time}`;
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
