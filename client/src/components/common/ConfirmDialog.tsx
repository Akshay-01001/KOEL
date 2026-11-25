import { useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { getApiErrorMessage } from "@/api/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    // The destructive button, e.g. "End meeting", and its label while working.
    confirmLabel: string;
    pendingLabel: string;
    // The button that backs out without doing anything.
    dismissLabel?: string;
    // Does the work. If it rejects, its error is shown and the dialog stays open;
    // closing it on success is up to the caller.
    onConfirm: () => Promise<void>;
    className?: string;
};

const BUTTON_CLASS = "h-11 px-[18px] text-[15px]";

// "Are you sure?" for actions that can't be undone, like ending or cancelling
// a meeting.
export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    pendingLabel,
    dismissLabel = "Cancel",
    onConfirm,
    className,
}: ConfirmDialogProps) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (nextOpen: boolean) => {
        if (isPending) return;
        if (!nextOpen) setError(null);
        onOpenChange(nextOpen);
    };

    const handleConfirm = async () => {
        setIsPending(true);
        setError(null);
        try {
            await onConfirm();
        } catch (confirmError) {
            setError(getApiErrorMessage(confirmError));
        }
        setIsPending(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "gap-5 bg-card p-5 font-sans text-card-foreground sm:max-w-[420px] sm:p-6",
                    className,
                )}
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="font-display text-xl leading-tight font-semibold break-words">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[15px] leading-normal text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <p
                        role="alert"
                        className="rounded-lg bg-[color-mix(in_oklch,var(--destructive)_11%,var(--card))] px-3.5 py-2.5 text-sm text-destructive"
                    >
                        {error}
                    </p>
                )}

                <div className="flex flex-wrap justify-end gap-2.5">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isPending}
                            className={BUTTON_CLASS}
                        >
                            {dismissLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                            void handleConfirm();
                        }}
                        className={cn(
                            BUTTON_CLASS,
                            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                        )}
                    >
                        {isPending && (
                            <LoaderCircle className="motion-safe:animate-spin" />
                        )}
                        {isPending ? pendingLabel : confirmLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
