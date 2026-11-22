import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Copy, LoaderCircle } from "lucide-react";
import type { UpcomingMeeting } from "@/api/types/response.types";
import {
    getDateBlock,
    getStatusBadge,
    getWhenText,
} from "@/components/Home/upcomingUtils";
import { Button } from "@/components/ui/button";
import { getMeetingLink, getMeetingPath } from "@/lib/meetingCode";
import { cn } from "@/lib/utils";

type UpcomingMeetingRowProps = {
    meeting: UpcomingMeeting;
    now: Date;
    isStarting: boolean;
    startError?: string;
    onStart: () => void;
};

const COPIED_RESET_MS = 2000;
const ACTION_BUTTON_CLASS =
    "h-11 min-w-[88px] border-input bg-card px-3.5 text-sm";

export default function UpcomingMeetingRow({
    meeting,
    now,
    isStarting,
    startError,
    onStart,
}: UpcomingMeetingRowProps) {
    const [isCopied, setIsCopied] = useState(false);

    // Switch the check mark back to the copy icon after a moment.
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

    const dateBlock = getDateBlock(
        new Date(meeting.started_at ?? meeting.scheduled_start_at),
    );
    const badge = getStatusBadge(meeting, now);
    // A host starts a scheduled meeting; everyone else (and a host of a live one) joins.
    const actionLabel =
        meeting.is_host && meeting.status === "scheduled" ? "Start" : "Join";

    return (
        <li className="flex flex-col gap-2 px-6 py-[18px]">
            <div className="flex flex-wrap items-center gap-5">
                <div
                    aria-hidden="true"
                    className="flex size-14 shrink-0 flex-col items-center justify-center gap-px rounded-lg bg-muted"
                >
                    <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground">
                        {dateBlock.dayOfWeek}
                    </span>
                    <span className="font-display text-[21px] leading-none font-semibold">
                        {dateBlock.day}
                    </span>
                </div>

                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-semibold break-words">
                            {meeting.title}
                        </h3>
                        {badge && (
                            <span
                                className={cn(
                                    "inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium whitespace-nowrap",
                                    badge.isLive
                                        ? "bg-recording text-recording-foreground"
                                        : "bg-accent text-accent-foreground",
                                )}
                            >
                                {badge.isLive && (
                                    <span
                                        aria-hidden="true"
                                        className="size-2 rounded-full bg-recording-dot motion-safe:animate-pulse"
                                    />
                                )}
                                {badge.text}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {getWhenText(meeting, now)} ·{" "}
                        {meeting.is_host
                            ? "You’re the host"
                            : `Hosted by ${meeting.host_name}`}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <span className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 font-mono text-[13px] tracking-[0.02em] tabular-nums">
                        {meeting.meeting_code}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Copy link for ${meeting.title}`}
                        onClick={() => {
                            void copyLink();
                        }}
                        className="size-11 text-muted-foreground"
                    >
                        {isCopied ? (
                            <Check className="text-success" />
                        ) : (
                            <Copy />
                        )}
                    </Button>
                    <span className="sr-only" aria-live="polite">
                        {isCopied ? "Link copied" : ""}
                    </span>
                </div>

                {meeting.is_host ? (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isStarting}
                        aria-label={`${actionLabel} ${meeting.title}`}
                        onClick={onStart}
                        className={ACTION_BUTTON_CLASS}
                    >
                        {isStarting && (
                            <LoaderCircle className="motion-safe:animate-spin" />
                        )}
                        {actionLabel}
                    </Button>
                ) : (
                    <Button
                        asChild
                        variant="outline"
                        className={ACTION_BUTTON_CLASS}
                    >
                        <Link
                            to={getMeetingPath(meeting.meeting_code)}
                            aria-label={`${actionLabel} ${meeting.title}`}
                        >
                            {actionLabel}
                        </Link>
                    </Button>
                )}
            </div>

            {startError && (
                <p role="alert" className="text-[13px] text-destructive">
                    {startError}
                </p>
            )}
        </li>
    );
}
