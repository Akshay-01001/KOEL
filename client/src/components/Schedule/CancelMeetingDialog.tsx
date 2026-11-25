import { cancelMeeting } from "@/api/apiFunctions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAppDispatch } from "@/store/hooks";
import { calendarInvalidated } from "@/store/slices/calendarSlice";
import { upcomingInvalidated } from "@/store/slices/upcomingSlice";

type CancelMeetingDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // The meeting to cancel. Kept after closing so the text doesn't go blank
    // while the dialog fades out.
    meeting: { _id: string; title: string } | null;
};

// Confirms, then cancels a scheduled meeting. The upcoming list and calendar
// refresh on their own.
export default function CancelMeetingDialog({
    open,
    onOpenChange,
    meeting,
}: CancelMeetingDialogProps) {
    const dispatch = useAppDispatch();

    const handleConfirm = async () => {
        if (!meeting) return;
        await cancelMeeting(meeting._id);
        dispatch(upcomingInvalidated());
        dispatch(calendarInvalidated());
        onOpenChange(false);
    };

    return (
        <ConfirmDialog
            open={open && meeting !== null}
            onOpenChange={onOpenChange}
            title="Cancel this meeting?"
            description={
                <>
                    <span className="font-medium text-foreground">
                        {meeting?.title}
                    </span>{" "}
                    will be cancelled and its link will stop working. This can’t
                    be undone.
                </>
            }
            confirmLabel="Cancel meeting"
            pendingLabel="Cancelling…"
            dismissLabel="Keep meeting"
            onConfirm={handleConfirm}
        />
    );
}
