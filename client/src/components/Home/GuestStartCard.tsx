import { Link } from "react-router";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown to guests in place of "New meeting": starting or scheduling needs an account.
export default function GuestStartCard() {
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
                        Host your own meetings
                    </h2>
                    <p className="text-sm leading-normal text-muted-foreground">
                        Sign in to start a meeting now or schedule one for
                        later. You can join one with a code without an account.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
                <Button
                    asChild
                    className="h-11 flex-[1_1_140px] px-[18px] text-[15px]"
                >
                    <Link to="/login">Sign in</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="h-11 flex-[1_1_140px] border-input bg-card px-[18px] text-[15px]"
                >
                    <Link to="/register">Create account</Link>
                </Button>
            </div>
        </div>
    );
}
