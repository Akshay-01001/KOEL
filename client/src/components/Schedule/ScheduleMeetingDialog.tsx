import { useState } from "react";
import type { EditableMeeting, Meeting } from "@/api/types/response.types";
import ScheduleForm from "@/components/Schedule/ScheduleForm";
import ScheduledConfirmation from "@/components/Schedule/ScheduledConfirmation";
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
    // Fills in the date and time (e.g. a slot picked on the calendar); without
    // it they start empty.
    initialStart?: Date;
    // Edit mode: change this meeting instead of scheduling a new one. The modal
    // closes once the changes are saved.
    meeting?: EditableMeeting;
    // Called as soon as the meeting is saved. The upcoming list and calendar
    // refresh on their own; this is for anything else that needs to know.
    onScheduled?: (meeting: Meeting) => void;
};

type ScheduleDialogBodyProps = {
    initialStart?: Date;
    meeting?: EditableMeeting;
    onScheduled?: (meeting: Meeting) => void;
    onClose: () => void;
};

// What's inside the modal: the form, then the confirmation once it's saved.
// Radix unmounts this on close, so every open starts with a fresh form.
function ScheduleDialogBody({
    initialStart,
    meeting,
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
                    {meeting ? "Edit meeting" : "Schedule a meeting"}
                </DialogTitle>
                <DialogDescription>
                    {meeting
                        ? "The link stays the same, so anyone you’ve shared it with sees the new details."
                        : "Pick a time, then share the link with whoever’s joining."}
                </DialogDescription>
            </DialogHeader>
            <ScheduleForm
                initialStart={initialStart}
                meeting={meeting}
                onSaved={(saved) => {
                    // Whichever lists have been loaded pick up the change.
                    dispatch(upcomingInvalidated());
                    dispatch(calendarInvalidated());
                    onScheduled?.(saved);
                    if (meeting) {
                        onClose();
                        return;
                    }
                    setScheduledMeeting(saved);
                }}
                onCancel={onClose}
            />
        </>
    );
}

// The schedule form as a modal, opened from the home page and the calendar,
// to schedule a meeting or edit one.
export default function ScheduleMeetingDialog({
    open,
    onOpenChange,
    initialStart,
    meeting,
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
                    key={meeting?._id ?? "new"}
                    initialStart={initialStart}
                    meeting={meeting}
                    onScheduled={onScheduled}
                    onClose={() => {
                        onOpenChange(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
