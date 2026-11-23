import { useState } from "react";
import type { Meeting } from "@/api/types/response.types";
import ScheduleForm from "@/components/Schedule/ScheduleForm";
import ScheduledConfirmation from "@/components/Schedule/ScheduledConfirmation";
import type { ScheduleSlot } from "@/components/Schedule/scheduleUtils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch } from "@/store/hooks";
import { calendarInvalidated } from "@/store/slices/calendarSlice";
import { upcomingInvalidated } from "@/store/slices/upcomingSlice";

type ScheduleMeetingDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Fills in the date and times (e.g. a slot picked on the calendar); without
    // it they start empty.
    initialSlot?: ScheduleSlot;
    // Called as soon as the meeting is saved. The upcoming list and calendar
    // refresh on their own; this is for anything else that needs to know.
    onScheduled?: (meeting: Meeting) => void;
};

type ScheduleDialogBodyProps = {
    initialSlot?: ScheduleSlot;
    onScheduled?: (meeting: Meeting) => void;
    onClose: () => void;
};

// What's inside the modal: the form, then the confirmation once it's saved.
// Radix unmounts this on close, so every open starts with a fresh form.
function ScheduleDialogBody({
    initialSlot,
    onScheduled,
    onClose,
}: ScheduleDialogBodyProps) {
    const dispatch = useAppDispatch();
    const [scheduledMeeting, setScheduledMeeting] = useState<Meeting | null>(
        null,
    );

    if (scheduledMeeting) {
        return (
            <ScheduledConfirmation
                meeting={scheduledMeeting}
                onDone={onClose}
                onScheduleAnother={() => {
                    setScheduledMeeting(null);
                }}
            />
        );
    }

    return (
        <>
            <DialogHeader className="pr-10">
                <DialogTitle className="font-display text-2xl leading-tight font-semibold tracking-[-0.01em]">
                    Schedule a meeting
                </DialogTitle>
                <DialogDescription>
                    Pick a time, then share the link with whoever’s joining.
                </DialogDescription>
            </DialogHeader>
            <ScheduleForm
                initialSlot={initialSlot}
                onScheduled={(meeting) => {
                    setScheduledMeeting(meeting);
                    // Whichever lists have been loaded pick up the new meeting.
                    dispatch(upcomingInvalidated());
                    dispatch(calendarInvalidated());
                    onScheduled?.(meeting);
                }}
                onCancel={onClose}
            />
        </>
    );
}

// The schedule form as a modal, opened from the home page and the calendar.
export default function ScheduleMeetingDialog({
    open,
    onOpenChange,
    initialSlot,
    onScheduled,
}: ScheduleMeetingDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                // A stray click outside shouldn't throw away a half-filled form;
                // Escape, the close button, and Cancel still close it.
                onInteractOutside={(event) => {
                    event.preventDefault();
                }}
                className="max-h-[calc(100svh-2rem)] gap-6 overflow-y-auto bg-card p-5 text-card-foreground sm:max-w-[600px] sm:p-7"
            >
                <ScheduleDialogBody
                    initialSlot={initialSlot}
                    onScheduled={onScheduled}
                    onClose={() => {
                        onOpenChange(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
