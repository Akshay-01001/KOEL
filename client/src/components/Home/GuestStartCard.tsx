import { Check, Video } from "lucide-react";

const HOST_PERKS = [
    "Start a meeting instantly and share the link",
    "Schedule meetings for later",
    "Choose who gets in and what they can do",
];

// Shown to guests in place of "New meeting": explains what an account unlocks.
// No buttons here; Sign in and Create account are in the navbar.
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
                        Want to host?
                    </h2>
                    <p className="text-sm leading-normal text-muted-foreground">
                        A free account lets you run your own meetings.
                    </p>
                </div>
            </div>

            <ul className="flex flex-col gap-2.5 text-sm">
                {HOST_PERKS.map((perk) => {
                    return (
                        <li key={perk} className="flex items-start gap-2.5">
                            <Check
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-success"
                            />
                            {perk}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
