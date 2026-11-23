import {
    AudioLines,
    MessageSquare,
    Mic,
    MicOff,
    PhoneOff,
    ScreenShare,
    Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PreviewTile = {
    person: string;
    name: string;
    isSpeaking?: boolean;
    isMuted?: boolean;
};

const TILES: PreviewTile[] = [
    { person: "riya", name: "Riya", isSpeaking: true },
    { person: "arjun", name: "Arjun" },
    { person: "sara", name: "Sara", isMuted: true },
    { person: "kabir", name: "Kabir" },
];

const CONTROLS = [
    { key: "mic", Icon: Mic },
    { key: "camera", Icon: Video },
    { key: "share", Icon: ScreenShare },
    { key: "chat", Icon: MessageSquare },
];

// Decorative, non-interactive mock of a Koel call for the guest landing page.
// The panel and the person tiles are dark in both themes, like the real room.
export default function MeetingPreview() {
    return (
        <div aria-hidden="true" className="relative select-none">
            <div className="rounded-2xl border border-border bg-panel p-3 text-[oklch(0.956_0.005_264)] shadow-xl">
                <div className="flex items-center justify-between gap-3 px-1.5 pt-1 pb-3">
                    <span className="truncate font-display text-sm font-semibold">
                        Weekly design sync
                    </span>
                    <span className="font-mono text-xs text-[oklch(0.73_0.015_264)]">
                        abc-defg-hij
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {TILES.map((tile) => {
                        return (
                            <div
                                key={tile.person}
                                data-person={tile.person}
                                className={cn(
                                    "koel-figure relative aspect-[4/3] overflow-hidden rounded-xl",
                                    tile.isSpeaking && "ring-2 ring-primary",
                                )}
                            >
                                <div className="video-tile absolute inset-0" />
                                <div className="koel-figure-head" />
                                <div className="koel-figure-body" />
                                <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/45 px-2 py-0.5 text-[11px] font-medium">
                                    {tile.isMuted && (
                                        <MicOff className="size-3" />
                                    )}
                                    {tile.name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center gap-2 pt-3 pb-1">
                    {CONTROLS.map(({ key, Icon }) => {
                        return (
                            <span
                                key={key}
                                className="flex size-9 items-center justify-center rounded-full bg-control"
                            >
                                <Icon className="size-4" />
                            </span>
                        );
                    })}
                    <span className="flex h-9 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                        <PhoneOff className="size-4" />
                    </span>
                </div>
            </div>

            <div className="absolute -bottom-4 -left-2 flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-3.5 pl-1.5 text-xs font-medium text-card-foreground shadow-lg sm:-left-6">
                <span className="flex size-6 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary)_25%,var(--card))]">
                    <AudioLines className="size-3.5" />
                </span>
                Noise cancellation on
            </div>
        </div>
    );
}
