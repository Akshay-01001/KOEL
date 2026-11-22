import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMeetingLink } from "@/lib/meetingCode";

type MeetingHeaderProps = {
    title: string;
    meetingCode: string;
};

const COPIED_RESET_MS = 2000;

// Thin bar above the call with the meeting title, its code, and a copy-link button
// so the host can invite people.
export default function MeetingHeader({
    title,
    meetingCode,
}: MeetingHeaderProps) {
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
            await navigator.clipboard.writeText(getMeetingLink(meetingCode));
            setIsCopied(true);
        } catch (error) {
            console.warn("Could not copy meeting link:", error);
        }
    };

    return (
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-panel px-4 py-2.5 text-foreground">
            <h1 className="truncate font-display text-base font-semibold">
                {title}
            </h1>
            <div className="flex items-center gap-1">
                <span className="inline-flex h-7 items-center rounded-full bg-control px-2.5 font-mono text-[13px] tracking-[0.02em]">
                    {meetingCode}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                        void copyLink();
                    }}
                    className="h-9 gap-1.5 px-2.5 text-sm text-muted-foreground hover:bg-control hover:text-foreground"
                >
                    {isCopied ? <Check className="text-success" /> : <Copy />}
                    {isCopied ? "Copied" : "Copy link"}
                </Button>
                <span className="sr-only" aria-live="polite">
                    {isCopied ? "Meeting link copied" : ""}
                </span>
            </div>
        </header>
    );
}
