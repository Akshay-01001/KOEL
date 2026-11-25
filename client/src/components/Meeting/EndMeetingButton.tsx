import { useState } from "react";
import { PhoneOff } from "lucide-react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";

type EndMeetingButtonProps = {
    // Ends the meeting on the server; a rejected promise shows its error.
    onConfirm: () => Promise<void>;
};

// Host only: "End for everyone" in the call header, behind a confirmation,
// since it removes everyone and the meeting can't be started again.
export default function EndMeetingButton({ onConfirm }: EndMeetingButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant="destructive"
                onClick={() => {
                    setIsOpen(true);
                }}
                className="h-9 gap-1.5 px-2.5 text-sm"
            >
                <PhoneOff />
                End for everyone
            </Button>
            <ConfirmDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                title="End the meeting for everyone?"
                description="Everyone will be removed from the call, and the meeting can’t be started again. To step out and keep it running, use Leave instead."
                confirmLabel="End meeting"
                pendingLabel="Ending…"
                onConfirm={onConfirm}
                // The call is always dark; the dialog renders outside it, so it opts in too.
                className="dark"
            />
        </>
    );
}
