import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CalendarCheck, Check, Copy } from "lucide-react";
import type { Meeting } from "@/api/types/response.types";
import { formatMeetingTime } from "@/components/Schedule/scheduleUtils";
import { Button } from "@/components/ui/button";
import { getMeetingLink } from "@/lib/meetingCode";

type ScheduledConfirmationProps = {
    meeting: Meeting;
    onScheduleAnother: () => void;
};

const COPIED_RESET_MS = 2000;

// Shown after a meeting is scheduled: when it is, its code, and a link to share.
export default function ScheduledConfirmation({
    meeting,
    onScheduleAnother,
}: ScheduledConfirmationProps) {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) return;
        const timer = setTimeout(() => {
            setIsCopied(false);
        }, COPIED_RESET_MS);
        return () => {
            clearTimeout(timer);
        };
    }, [isCopied]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(
                getMeetingLink(meeting.meeting_code),
            );
            setIsCopied(true);
        } catch (error) {
            console.warn("Could not copy meeting link:", error);
        }
    };

    const start = new Date(meeting.scheduled_start_at);
    const end = meeting.scheduled_end_at
        ? new Date(meeting.scheduled_end_at)
        : null;

    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--success)_13%,var(--card))] text-success"
            >
                <CalendarCheck className="size-8" strokeWidth={1.75} />
            </span>
            <h2
                className="font-display text-2xl font-semibold"
                aria-live="polite"
            >
                Meeting scheduled
            </h2>
            <div className="flex flex-col gap-1">
                <p className="text-base font-semibold">{meeting.title}</p>
                <p className="text-sm text-muted-foreground">
                    {formatMeetingTime(start, end)}
                </p>
            </div>

            <div className="flex items-center gap-1">
                <span className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 font-mono text-[13px] tracking-[0.02em]">
                    {meeting.meeting_code}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                        void copyLink();
                    }}
                    className="h-9 gap-1.5 px-2.5 text-sm text-muted-foreground"
                >
                    {isCopied ? <Check className="text-success" /> : <Copy />}
                    {isCopied ? "Copied" : "Copy link"}
                </Button>
                <span className="sr-only" aria-live="polite">
                    {isCopied ? "Meeting link copied" : ""}
                </span>
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-2.5">
                <Button asChild className="h-11 px-[18px] text-[15px]">
                    <Link to="/">Back to home</Link>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onScheduleAnother}
                    className="h-11 border-input bg-card px-[18px] text-[15px]"
                >
                    Schedule another
                </Button>
            </div>
        </div>
    );
}
