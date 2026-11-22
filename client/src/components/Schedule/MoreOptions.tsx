import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type {
    MeetingSettings,
    RecordingAccess,
} from "@/api/types/payload.types";
import SettingSwitch from "@/components/Schedule/SettingSwitch";
import { cn } from "@/lib/utils";

type MoreOptionsProps = {
    settings: MeetingSettings;
    onChange: (patch: Partial<MeetingSettings>) => void;
};

type BooleanSetting = {
    [Key in keyof MeetingSettings]: MeetingSettings[Key] extends boolean
        ? Key
        : never;
}[keyof MeetingSettings];

type SwitchRow = {
    key: BooleanSetting;
    label: string;
    description: string;
};

const JOINING_ROWS: SwitchRow[] = [
    {
        key: "join_approval_required",
        label: "Ask to join",
        description: "People wait until you let them in.",
    },
    {
        key: "guest_access",
        label: "Allow guests",
        description: "People without an account can join as “Anonymous”.",
    },
];

const IN_MEETING_ROWS: SwitchRow[] = [
    {
        key: "chat_enabled",
        label: "Chat",
        description: "Everyone can send messages.",
    },
    {
        key: "screen_share_enabled",
        label: "Screen sharing",
        description: "Everyone can share their screen.",
    },
];

// "Specific people" from the design is left out until recordings exist to share.
const WATCH_OPTIONS: {
    value: RecordingAccess;
    label: string;
    description: string;
}[] = [
    { value: "host_only", label: "Host only", description: "Just you." },
    {
        value: "participants",
        label: "Everyone who attended",
        description: "Anyone who was in the meeting.",
    },
];

const SECTION_HEADING_CLASS =
    "text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase";

function getSummary(settings: MeetingSettings) {
    return [
        settings.join_approval_required
            ? "Ask to join on"
            : "People join directly",
        settings.guest_access ? "guests allowed" : "no guests",
        settings.who_can_record === "host_only"
            ? "only you can record"
            : "anyone can record",
    ].join(" · ");
}

// Collapsible "More options" block with the meeting's joining, in-call and recording settings.
export default function MoreOptions({ settings, onChange }: MoreOptionsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const renderSwitches = (rows: SwitchRow[]) => {
        return rows.map((row, index) => {
            return (
                <SettingSwitch
                    key={row.key}
                    id={`setting-${row.key}`}
                    label={row.label}
                    description={row.description}
                    checked={settings[row.key]}
                    onCheckedChange={(checked) => {
                        onChange({ [row.key]: checked });
                    }}
                    showDivider={index > 0}
                />
            );
        });
    };

    return (
        <div className="border-t border-border pt-1.5">
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls="more-options"
                onClick={() => {
                    setIsOpen((open) => {
                        return !open;
                    });
                }}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 text-left"
            >
                <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">
                        More options
                    </span>
                    <span className="text-[13px] leading-[1.45] text-muted-foreground">
                        {getSummary(settings)}
                    </span>
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        "size-5 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                    )}
                />
            </button>

            {isOpen && (
                <div id="more-options" className="flex flex-col gap-6 pt-3">
                    <div>
                        <h2 className={cn(SECTION_HEADING_CLASS, "mb-1")}>
                            Joining
                        </h2>
                        {renderSwitches(JOINING_ROWS)}
                    </div>

                    <div>
                        <h2 className={cn(SECTION_HEADING_CLASS, "mb-1")}>
                            In the meeting
                        </h2>
                        {renderSwitches(IN_MEETING_ROWS)}
                    </div>

                    <div className="flex flex-col gap-[18px]">
                        <h2 className={SECTION_HEADING_CLASS}>Recording</h2>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <span
                                id="who-can-record"
                                className="text-[15px] font-medium"
                            >
                                Who can record
                            </span>
                            <div
                                role="group"
                                aria-labelledby="who-can-record"
                                className="inline-flex gap-[3px] rounded-lg bg-muted p-[3px]"
                            >
                                {(
                                    [
                                        ["host_only", "Host only"],
                                        ["anyone", "Anyone"],
                                    ] as const
                                ).map(([value, label]) => {
                                    const isPressed =
                                        settings.who_can_record === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-pressed={isPressed}
                                            onClick={() => {
                                                onChange({
                                                    who_can_record: value,
                                                });
                                            }}
                                            className={cn(
                                                "min-h-11 cursor-pointer rounded-md px-4 text-sm font-medium transition-colors",
                                                isPressed
                                                    ? "bg-card text-foreground shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground",
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <fieldset className="flex flex-col gap-2">
                            <legend className="mb-2.5 text-[15px] font-medium">
                                Who can watch recordings
                            </legend>
                            {WATCH_OPTIONS.map((option) => {
                                const isChecked =
                                    settings.recording_access === option.value;
                                return (
                                    <label
                                        key={option.value}
                                        className={cn(
                                            "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3",
                                            isChecked
                                                ? "border-primary bg-[color-mix(in_oklch,var(--primary)_8%,var(--card))]"
                                                : "border-border",
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="recording-access"
                                            checked={isChecked}
                                            onChange={() => {
                                                onChange({
                                                    recording_access:
                                                        option.value,
                                                });
                                            }}
                                            className="mt-0.5 size-[18px] shrink-0 accent-primary"
                                        />
                                        <span className="flex flex-col gap-0.5">
                                            <span className="text-[15px] font-medium">
                                                {option.label}
                                            </span>
                                            <span className="text-[13px] leading-[1.45] text-muted-foreground">
                                                {option.description}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </fieldset>
                    </div>
                </div>
            )}
        </div>
    );
}
