import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, CircleAlert, LoaderCircle } from "lucide-react";
import { startMeeting } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import type { UpcomingMeeting } from "@/api/types/response.types";
import EmptyState from "@/components/Home/EmptyState";
import UpcomingMeetingRow from "@/components/Home/UpcomingMeetingRow";
import type { UpcomingState } from "@/store/slices/upcomingSlice";
import { Button } from "@/components/ui/button";
import { getMeetingPath } from "@/lib/meetingCode";

type UpcomingListProps = {
    state: UpcomingState;
    onRetry: () => void;
    onLoadMore: () => void;
    onSchedule: () => void;
};

// Re-render this often so "Starts in N min" stays current.
const CLOCK_TICK_MS = 30_000;

const OUTLINE_BUTTON_CLASS = "h-11 border-input bg-card px-[18px] text-[15px]";

// The user's upcoming meetings, each with its code, a copy-link button, and Start/Join,
// plus "Show more" while there are more pages.
export default function UpcomingList({
    state,
    onRetry,
    onLoadMore,
    onSchedule,
}: UpcomingListProps) {
    const navigate = useNavigate();
    const [now, setNow] = useState(() => {
        return new Date();
    });
    const [startingId, setStartingId] = useState<string | null>(null);
    const [startError, setStartError] = useState<{
        meetingId: string;
        message: string;
    } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, CLOCK_TICK_MS);
        return () => {
            clearInterval(timer);
        };
    }, []);

    // Host: open the room if it isn't running yet, then go to the meeting page.
    const handleStart = async (meeting: UpcomingMeeting) => {
        setStartError(null);
        if (meeting.status === "scheduled") {
            setStartingId(meeting._id);
            try {
                await startMeeting(meeting._id);
            } catch (error) {
                setStartError({
                    meetingId: meeting._id,
                    message: getApiErrorMessage(error),
                });
                setStartingId(null);
                return;
            }
        }
        navigate(getMeetingPath(meeting.meeting_code));
    };

    if (state.status === "idle" || state.status === "loading") {
        return (
            <div
                role="status"
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card px-6 py-16 text-[15px] text-muted-foreground"
            >
                <LoaderCircle className="size-5 motion-safe:animate-spin" />
                Loading your meetings…
            </div>
        );
    }

    if (state.status === "error") {
        return (
            <EmptyState
                icon={<CircleAlert className="size-8" strokeWidth={1.75} />}
                title="Couldn’t load your meetings"
                description={state.error ?? "Something went wrong."}
                action={
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onRetry}
                        className={OUTLINE_BUTTON_CLASS}
                    >
                        Try again
                    </Button>
                }
            />
        );
    }

    if (state.meetings.length === 0) {
        return (
            <EmptyState
                icon={<Calendar className="size-8" strokeWidth={1.75} />}
                title="Nothing scheduled"
                description="Plan a meeting for later, or start one now and share the link."
                action={
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onSchedule}
                        className={OUTLINE_BUTTON_CLASS}
                    >
                        Schedule a meeting
                    </Button>
                }
            />
        );
    }

    const remaining = state.total - state.meetings.length;

    return (
        <div className="flex flex-col items-center gap-3">
            <ul className="w-full divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {state.meetings.map((meeting) => {
                    return (
                        <UpcomingMeetingRow
                            key={meeting._id}
                            meeting={meeting}
                            now={now}
                            isStarting={startingId === meeting._id}
                            startError={
                                startError?.meetingId === meeting._id
                                    ? startError.message
                                    : undefined
                            }
                            onStart={() => {
                                void handleStart(meeting);
                            }}
                        />
                    );
                })}
            </ul>

            {state.loadMoreError && (
                <p role="alert" className="text-[13px] text-destructive">
                    {state.loadMoreError}
                </p>
            )}
            {state.hasMore && (
                <Button
                    type="button"
                    variant="outline"
                    disabled={state.isLoadingMore}
                    onClick={onLoadMore}
                    className={OUTLINE_BUTTON_CLASS}
                >
                    {state.isLoadingMore && (
                        <LoaderCircle className="motion-safe:animate-spin" />
                    )}
                    {state.isLoadingMore
                        ? "Loading…"
                        : state.loadMoreError
                          ? "Try again"
                          : `Show more${remaining > 0 ? ` (${remaining})` : ""}`}
                </Button>
            )}
        </div>
    );
}
