import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { LoaderCircle } from "lucide-react";
import { scheduleMeeting } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import type { MeetingSettings } from "@/api/types/payload.types";
import type { Meeting } from "@/api/types/response.types";
import MoreOptions from "@/components/Schedule/MoreOptions";
import {
    DEFAULT_MEETING_SETTINGS,
    combineDateAndTime,
    getDefaultSlot,
    getTimeZoneLabel,
    toDateInputValue,
    toTimeInputValue,
} from "@/components/Schedule/scheduleUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 1000;

type FieldErrors = {
    title?: string;
    startTime?: string;
    endTime?: string;
};

type ScheduleFormProps = {
    onScheduled: (meeting: Meeting) => void;
};

const FIELD_CLASS = "h-11 bg-card px-3.5 text-[15px]";

// Title, description, date and time, and meeting settings.
export default function ScheduleForm({ onScheduled }: ScheduleFormProps) {
    const [defaultSlot] = useState(() => {
        return getDefaultSlot(new Date());
    });

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(toDateInputValue(defaultSlot.start));
    const [startTime, setStartTime] = useState(
        toTimeInputValue(defaultSlot.start),
    );
    // The end shares the start's date, so leave it empty if the default slot crosses midnight.
    const [endTime, setEndTime] = useState(() => {
        const sameDay =
            toDateInputValue(defaultSlot.end) ===
            toDateInputValue(defaultSlot.start);
        return sameDay ? toTimeInputValue(defaultSlot.end) : "";
    });
    const [settings, setSettings] = useState<MeetingSettings>(
        DEFAULT_MEETING_SETTINGS,
    );

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const clearFieldError = (field: keyof FieldErrors) => {
        setFieldErrors((errors) => {
            return { ...errors, [field]: undefined };
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        const start = combineDateAndTime(date, startTime);
        const end = endTime ? combineDateAndTime(date, endTime) : null;
        const errors: FieldErrors = {};

        if (!title.trim()) errors.title = "Add a title";
        if (!start) {
            errors.startTime = "Pick a date and start time";
        } else if (start.getTime() <= Date.now()) {
            errors.startTime = "Pick a time in the future";
        }
        if (start && end && end.getTime() <= start.getTime()) {
            errors.endTime = "The end time must be after the start time";
        }

        setFieldErrors(errors);
        if (Object.values(errors).some(Boolean) || !start) return;

        setIsSubmitting(true);
        try {
            const meeting = await scheduleMeeting({
                title: title.trim(),
                description: description.trim() || undefined,
                scheduled_start_at: start.toISOString(),
                scheduled_end_at: end?.toISOString(),
                settings,
            });
            onScheduled(meeting);
        } catch (error) {
            setFormError(getApiErrorMessage(error));
            setIsSubmitting(false);
        }
    };

    const timeZoneLabel = getTimeZoneLabel(
        combineDateAndTime(date, startTime) ?? defaultSlot.start,
    );

    return (
        <form
            noValidate
            onSubmit={(event) => {
                void handleSubmit(event);
            }}
            className="flex flex-col gap-[22px] rounded-2xl border border-border bg-card p-5 sm:p-8"
        >
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    type="text"
                    placeholder="e.g. Weekly design sync"
                    maxLength={TITLE_MAX_LENGTH}
                    value={title}
                    aria-invalid={fieldErrors.title ? true : undefined}
                    aria-describedby={
                        fieldErrors.title ? "title-error" : undefined
                    }
                    onChange={(event) => {
                        setTitle(event.target.value);
                        clearFieldError("title");
                    }}
                    className={FIELD_CLASS}
                />
                {fieldErrors.title && (
                    <p
                        id="title-error"
                        className="text-[13px] text-destructive"
                    >
                        {fieldErrors.title}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">
                    Description
                    <span className="font-normal text-muted-foreground">
                        (optional)
                    </span>
                </Label>
                <textarea
                    id="description"
                    rows={3}
                    placeholder="What’s this meeting about?"
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    value={description}
                    onChange={(event) => {
                        setDescription(event.target.value);
                    }}
                    className="min-h-22 w-full resize-y rounded-lg border border-input bg-card px-3.5 py-2.5 text-[15px] leading-normal outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
            </div>

            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            min={toDateInputValue(new Date())}
                            value={date}
                            onChange={(event) => {
                                setDate(event.target.value);
                                clearFieldError("startTime");
                                clearFieldError("endTime");
                            }}
                            className={FIELD_CLASS}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="start-time">Starts</Label>
                        <Input
                            id="start-time"
                            type="time"
                            step={300}
                            value={startTime}
                            aria-invalid={
                                fieldErrors.startTime ? true : undefined
                            }
                            aria-describedby={
                                fieldErrors.startTime
                                    ? "start-time-error"
                                    : undefined
                            }
                            onChange={(event) => {
                                setStartTime(event.target.value);
                                clearFieldError("startTime");
                                clearFieldError("endTime");
                            }}
                            className={FIELD_CLASS}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="end-time">
                            Ends
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="end-time"
                            type="time"
                            step={300}
                            value={endTime}
                            aria-invalid={
                                fieldErrors.endTime ? true : undefined
                            }
                            aria-describedby={
                                fieldErrors.endTime
                                    ? "end-time-error"
                                    : undefined
                            }
                            onChange={(event) => {
                                setEndTime(event.target.value);
                                clearFieldError("endTime");
                            }}
                            className={FIELD_CLASS}
                        />
                    </div>
                </div>
                {fieldErrors.startTime && (
                    <p
                        id="start-time-error"
                        className="text-[13px] text-destructive"
                    >
                        {fieldErrors.startTime}
                    </p>
                )}
                {fieldErrors.endTime && (
                    <p
                        id="end-time-error"
                        className="text-[13px] text-destructive"
                    >
                        {fieldErrors.endTime}
                    </p>
                )}
                {timeZoneLabel && (
                    <p className="text-[13px] leading-[1.45] text-muted-foreground">
                        {timeZoneLabel}
                    </p>
                )}
            </div>

            <MoreOptions
                settings={settings}
                onChange={(patch) => {
                    setSettings((current) => {
                        return { ...current, ...patch };
                    });
                }}
            />

            {formError && (
                <p
                    role="alert"
                    className="rounded-lg bg-[color-mix(in_oklch,var(--destructive)_11%,var(--card))] px-3.5 py-2.5 text-sm text-destructive"
                >
                    {formError}
                </p>
            )}

            <div className="flex flex-wrap justify-end gap-2.5 border-t border-border pt-[22px]">
                <Button
                    asChild
                    variant="ghost"
                    className="h-11 px-[18px] text-[15px]"
                >
                    <Link to="/">Cancel</Link>
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 min-w-42 px-[18px] text-[15px]"
                >
                    {isSubmitting && (
                        <LoaderCircle className="motion-safe:animate-spin" />
                    )}
                    {isSubmitting ? "Scheduling…" : "Schedule meeting"}
                </Button>
            </div>
        </form>
    );
}
