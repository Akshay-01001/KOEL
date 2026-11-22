import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Meeting } from "@/api/types/response.types";
import ScheduleForm from "@/components/Schedule/ScheduleForm";
import ScheduledConfirmation from "@/components/Schedule/ScheduledConfirmation";
import { Button } from "@/components/ui/button";

// /schedule: the schedule form, then a confirmation once the meeting is saved.
export default function ScheduleMeeting() {
    const [scheduledMeeting, setScheduledMeeting] = useState<Meeting | null>(
        null,
    );

    return (
        <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-10">
            <Button
                asChild
                variant="ghost"
                className="-ml-3.5 h-11 self-start px-3.5 text-sm text-muted-foreground"
            >
                <Link to="/">
                    <ArrowLeft />
                    Back to home
                </Link>
            </Button>

            <h1 className="font-display text-[30px] leading-[1.15] font-semibold tracking-[-0.02em]">
                Schedule a meeting
            </h1>

            {scheduledMeeting ? (
                <ScheduledConfirmation
                    meeting={scheduledMeeting}
                    onScheduleAnother={() => {
                        setScheduledMeeting(null);
                    }}
                />
            ) : (
                <ScheduleForm onScheduled={setScheduledMeeting} />
            )}
        </div>
    );
}
