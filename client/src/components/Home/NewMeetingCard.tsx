import { useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, LoaderCircle, Video } from "lucide-react";
import { createInstantMeeting } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import ScheduleMeetingDialog from "@/components/Schedule/ScheduleMeetingDialog";
import { Button } from "@/components/ui/button";
import { getMeetingPath } from "@/lib/meetingCode";

const INSTANT_MEETING_TITLE = "Instant meeting";

// "Start now" creates a meeting on the server and drops the user into its room.
// "Schedule" opens the schedule modal.
export default function NewMeetingCard() {
    const navigate = useNavigate();
    const [isStarting, setIsStarting] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartNow = async () => {
        setIsStarting(true);
        setError(null);
        try {
            const meeting = await createInstantMeeting({
                title: INSTANT_MEETING_TITLE,
            });
            navigate(getMeetingPath(meeting.meeting_code));
        } catch (startError) {
            setError(getApiErrorMessage(startError));
            setIsStarting(false);
        }
    };

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7">
            <div className="flex items-start gap-4">
                <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--primary)_20%,var(--card))]"
                >
                    <Video className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-semibold">
                        New meeting
                    </h2>
                    <p className="text-sm leading-normal text-muted-foreground">
                        Start now and share the link, or pick a time for later.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2.5">
                    <Button
                        type="button"
                        disabled={isStarting}
                        onClick={() => {
                            void handleStartNow();
                        }}
                        className="h-11 flex-[1_1_140px] px-[18px] text-[15px]"
                    >
                        {isStarting && (
                            <LoaderCircle className="motion-safe:animate-spin" />
                        )}
                        {isStarting ? "Starting…" : "Start now"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setIsScheduleOpen(true);
                        }}
                        className="h-11 flex-[1_1_140px] border-input bg-card px-[18px] text-[15px]"
                    >
                        <Calendar />
                        Schedule
                    </Button>
                </div>
                {error && (
                    <p role="alert" className="text-[13px] text-destructive">
                        {error}
                    </p>
                )}
            </div>

            <ScheduleMeetingDialog
                open={isScheduleOpen}
                onOpenChange={setIsScheduleOpen}
            />
        </div>
    );
}
