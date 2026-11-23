import {
    AudioLines,
    CalendarClock,
    Check,
    Globe,
    ScreenShare,
    ShieldCheck,
    UserRoundCheck,
} from "lucide-react";
import MeetingPreview from "@/components/Home/MeetingPreview";

const HIGHLIGHTS = ["Nothing to install", "Free to join", "Any modern browser"];

const FEATURES = [
    {
        Icon: AudioLines,
        title: "Noise cancellation",
        description:
            "Background noise is filtered out of your mic, so people hear you, not your keyboard.",
    },
    {
        Icon: Globe,
        title: "Right in your browser",
        description:
            "No app to download. Open the link and you’re in the meeting.",
    },
    {
        Icon: UserRoundCheck,
        title: "Join without an account",
        description:
            "Guests can join with just a code when the host allows it.",
    },
    {
        Icon: CalendarClock,
        title: "Schedule ahead",
        description:
            "Pick a time, share the link, and the room is ready when you are.",
    },
    {
        Icon: ShieldCheck,
        title: "You decide who gets in",
        description:
            "Turn on Ask to join and approve each person before they enter.",
    },
    {
        Icon: ScreenShare,
        title: "Share and chat",
        description:
            "Present your screen and send messages without leaving the call.",
    },
];

// What guests see below the join cards: a short pitch with an illustrated call,
// then the feature grid. Sign-in actions live in the navbar only.
export default function GuestShowcase() {
    return (
        <section
            aria-labelledby="showcase-heading"
            className="flex flex-col gap-16 border-t border-border pt-14 sm:pt-20"
        >
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
                <div className="flex flex-col gap-6">
                    <p className="flex w-fit items-center gap-2 rounded-full bg-[color-mix(in_oklch,var(--primary)_18%,var(--card))] px-3 py-1 text-[13px] font-medium">
                        <span className="size-1.5 rounded-full bg-primary" />
                        Video meetings, simply
                    </p>
                    <h2
                        id="showcase-heading"
                        className="max-w-[520px] font-display text-[40px] leading-[1.08] font-semibold tracking-[-0.02em] sm:text-5xl"
                    >
                        Meetings that feel like being in the same room.
                    </h2>
                    <p className="max-w-[460px] text-base leading-7 text-muted-foreground">
                        Koel is a calm, quick place to talk face to face. Share
                        a link, let people in, and keep the focus on the
                        conversation instead of the tools.
                    </p>
                    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        {HIGHLIGHTS.map((highlight) => {
                            return (
                                <li
                                    key={highlight}
                                    className="flex items-center gap-1.5"
                                >
                                    <Check className="size-4 text-success" />
                                    {highlight}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <MeetingPreview />
            </div>

            <div className="flex flex-col gap-6">
                <h3 className="font-display text-2xl font-semibold tracking-[-0.01em]">
                    Everything a good call needs
                </h3>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map(({ Icon, title, description }) => {
                        return (
                            <li
                                key={title}
                                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
                            >
                                <span
                                    aria-hidden="true"
                                    className="flex size-10 items-center justify-center rounded-lg bg-muted"
                                >
                                    <Icon className="size-5" />
                                </span>
                                <h4 className="font-display text-lg font-semibold">
                                    {title}
                                </h4>
                                <p className="text-sm leading-normal text-muted-foreground">
                                    {description}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
