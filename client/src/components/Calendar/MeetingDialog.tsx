import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
    CalendarDays,
    CalendarX,
    Check,
    Copy,
    LoaderCircle,
    Pencil,
    UserRound,
} from "lucide-react";
import { startMeeting } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import type { CalendarMeeting } from "@/api/types/response.types";
import { formatMeetingTime } from "@/components/Schedule/scheduleUtils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getMeetingLink, getMeetingPath } from "@/lib/meetingCode";
import { cn } from "@/lib/utils";

const COPIED_RESET_MS = 2000;
const BUTTON_CLASS = "h-11 px-[18px] text-[15px]";

const STATUS_BADGES: Record<
    CalendarMeeting["status"],
    { text: string; className: string }
> = {
    running: {
        text: "Live now",
        className: "bg-recording text-recording-foreground",
    },
    scheduled: {
        text: "Scheduled",
        className: "bg-accent text-accent-foreground",
    },
    ended: { text: "Ended", className: "bg-muted text-muted-foreground" },
    cancelled: {
        text: "Cancelled",
        className: "bg-muted text-muted-foreground",
    },
};

type MeetingDialogBodyProps = {
    meeting: CalendarMeeting;
    onEdit: () => void;
    onCancel: () => void;
};

// The modal's contents for one meeting: when, who hosts, the code with a copy
// button, and Start (host, not started yet) or Join while it can be joined.
// The host of a scheduled meeting can also edit or cancel it.
function MeetingDialogBody({
    meeting,
    onEdit,
    onCancel,
}: MeetingDialogBodyProps) {
    const navigate = useNavigate();
    const [isCopied, setIsCopied] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);

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

    const isHostStart = meeting.is_host && meeting.status === "scheduled";
    const isJoinable =
        meeting.status === "scheduled" || meeting.status === "running";

    // Host: open the room first, then go to the meeting page. Everyone else
    // (and a host whose meeting is already live) goes straight there.
    const handleAction = async () => {
        if (isHostStart) {
            setIsStarting(true);
            setStartError(null);
            try {
                await startMeeting(meeting._id);
            } catch (error) {
                setStartError(getApiErrorMessage(error));
                setIsStarting(false);
                return;
            }
        }
        navigate(getMeetingPath(meeting.meeting_code));
    };

    const badge = STATUS_BADGES[meeting.status];
    const when = formatMeetingTime(
        new Date(meeting.scheduled_start_at),
        meeting.scheduled_end_at ? new Date(meeting.scheduled_end_at) : null,
    );

    let actionLabel = "Join";
    if (isHostStart) actionLabel = isStarting ? "Starting…" : "Start meeting";

    return (
        <>
            <DialogHeader className="gap-2.5 pr-10">
                <span
                    className={cn(
                        "inline-flex h-[26px] w-fit items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium",
                        badge.className,
                    )}
                >
                    {meeting.status === "running" && (
                        <span
                            aria-hidden="true"
                            className="size-2 rounded-full bg-recording-dot motion-safe:animate-pulse"
                        />
                    )}
                    {badge.text}
                </span>
                <DialogTitle className="font-display text-2xl leading-tight font-semibold tracking-[-0.01em] break-words">
                    {meeting.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Meeting details
                    {isJoinable ? ` and ${actionLabel.toLowerCase()}` : ""}
                </DialogDescription>
            </DialogHeader>

            <dl className="flex flex-col gap-3 text-[15px]">
                <div className="flex items-start gap-3">
                    <dt className="sr-only">When</dt>
                    <CalendarDays
                        aria-hidden="true"
                        className="mt-0.5 size-[18px] shrink-0 text-muted-foreground"
                    />
                    <dd>{when}</dd>
                </div>
                <div className="flex items-start gap-3">
                    <dt className="sr-only">Host</dt>
                    <UserRound
                        aria-hidden="true"
                        className="mt-0.5 size-[18px] shrink-0 text-muted-foreground"
                    />
                    <dd>
                        {meeting.is_host
                            ? "You’re the host"
                            : `Hosted by ${meeting.host_name}`}
                    </dd>
                </div>
            </dl>

            {meeting.description && (
                <p className="text-sm leading-6 break-words whitespace-pre-line text-muted-foreground">
                    {meeting.description}
                </p>
            )}

            <div className="flex items-center gap-1">
                <span className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 font-mono text-[13px] tracking-[0.02em] tabular-nums">
                    {meeting.meeting_code}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                        void copyLink();
                    }}
                    className="h-11 gap-1.5 px-2.5 text-sm text-muted-foreground"
                >
                    {isCopied ? <Check className="text-success" /> : <Copy />}
                    {isCopied ? "Copied" : "Copy link"}
                </Button>
                <span className="sr-only" aria-live="polite">
                    {isCopied ? "Meeting link copied" : ""}
                </span>
            </div>

            {startError && (
                <p
                    role="alert"
                    className="rounded-lg bg-[color-mix(in_oklch,var(--destructive)_11%,var(--card))] px-3.5 py-2.5 text-sm text-destructive"
                >
                    {startError}
                </p>
            )}

            <div className="flex flex-wrap justify-end gap-2.5 border-t border-border pt-5">
                {isHostStart && (
                    <div className="mr-auto flex flex-wrap gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isStarting}
                            onClick={onEdit}
                            className={cn(BUTTON_CLASS, "px-3.5")}
                        >
                            <Pencil />
                            Edit
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isStarting}
                            onClick={onCancel}
                            className={cn(
                                BUTTON_CLASS,
                                "px-3.5 text-destructive hover:text-destructive",
                            )}
                        >
                            <CalendarX />
                            Cancel meeting
                        </Button>
                    </div>
                )}
                <DialogClose asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className={BUTTON_CLASS}
                    >
                        Close
                    </Button>
                </DialogClose>
                {isJoinable && (
                    <Button
                        type="button"
                        disabled={isStarting}
                        onClick={() => {
                            void handleAction();
                        }}
                        className={cn(BUTTON_CLASS, "min-w-32")}
                    >
                        {isStarting && (
                            <LoaderCircle className="motion-safe:animate-spin" />
                        )}
                        {actionLabel}
                    </Button>
                )}
            </div>
        </>
    );
}

type MeetingDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // The meeting clicked on the calendar. Kept after closing so the modal
    // doesn't go blank while it fades out.
    meeting: CalendarMeeting | null;
    // The host picked Edit or Cancel meeting; the caller opens that dialog.
    onEdit: (meeting: CalendarMeeting) => void;
    onCancel: (meeting: CalendarMeeting) => void;
};

// Opens when a meeting is clicked on the calendar, to start or join it, or for
// the host of a scheduled one, to edit or cancel it.
export default function MeetingDialog({
    open,
    onOpenChange,
    meeting,
    onEdit,
    onCancel,
}: MeetingDialogProps) {
    return (
        <Dialog open={open && meeting !== null} onOpenChange={onOpenChange}>
            <DialogContent className="gap-5 bg-card p-5 text-card-foreground sm:max-w-[460px] sm:p-7">
                {meeting && (
                    <MeetingDialogBody
                        key={meeting._id}
                        meeting={meeting}
                        onEdit={() => {
                            onEdit(meeting);
                        }}
                        onCancel={() => {
                            onCancel(meeting);
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
