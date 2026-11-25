import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { scheduleMeeting, updateMeeting } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import type { MeetingSettings } from "@/api/types/payload.types";
import type { EditableMeeting, Meeting } from "@/api/types/response.types";
import DateField from "@/components/Schedule/DateField";
import MoreOptions from "@/components/Schedule/MoreOptions";
import {
    DEFAULT_MEETING_SETTINGS,
    type ScheduleSlot,
    combineDateAndTime,
    getTimeZoneLabel,
    toDateInputValue,
    toTimeInputValue,
} from "@/components/Schedule/scheduleUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    TIME_PLACEHOLDER,
    maskTimeInput,
    parseDate,
    parseTime,
} from "@/lib/dateFormat";

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 1000;

type FieldErrors = {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
};

type ScheduleFormProps = {
    // Fills in the date and times, e.g. from a slot picked on the calendar.
    // Without it they start empty, showing DD/MM/YYYY and HH:MM.
    initialSlot?: ScheduleSlot;
    // Edit mode: the form starts with this meeting's details and saves changes
    // to it instead of scheduling a new one.
    meeting?: EditableMeeting;
    onSaved: (meeting: Meeting) => void;
    onCancel: () => void;
};

// The date and times the form starts with: the meeting being edited, else the
// picked slot, else nothing.
function getInitialSlot(meeting?: EditableMeeting, slot?: ScheduleSlot) {
    if (meeting) {
        return {
            start: new Date(meeting.scheduled_start_at),
            end: meeting.scheduled_end_at
                ? new Date(meeting.scheduled_end_at)
                : null,
        };
    }
    return slot;
}

const FIELD_CLASS = "h-11 bg-card px-3.5 text-[15px]";

// Title, description, date and time, and meeting settings. Schedules a new
// meeting, or with `meeting` edits that one.
export default function ScheduleForm({
    initialSlot: slot,
    meeting,
    onSaved,
    onCancel,
}: ScheduleFormProps) {
    const isEditing = meeting !== undefined;
    const [initialSlot] = useState(() => {
        return getInitialSlot(meeting, slot);
    });
    const [title, setTitle] = useState(meeting?.title ?? "");
    const [description, setDescription] = useState(meeting?.description ?? "");
    const [date, setDate] = useState(() => {
        return initialSlot ? toDateInputValue(initialSlot.start) : "";
    });
    const [startTime, setStartTime] = useState(() => {
        return initialSlot ? toTimeInputValue(initialSlot.start) : "";
    });
    // The end shares the start's date, so leave it empty if the slot crosses midnight.
    const [endTime, setEndTime] = useState(() => {
        if (!initialSlot?.end) return "";
        const { start, end } = initialSlot;
        const sameDay = toDateInputValue(end) === toDateInputValue(start);
        return sameDay ? toTimeInputValue(end) : "";
    });
    // Today, for the earliest day the date picker offers.
    const [today] = useState(() => {
        return new Date();
    });
    const [settings, setSettings] = useState<MeetingSettings>(() => {
        return { ...DEFAULT_MEETING_SETTINGS, ...meeting?.settings };
    });

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
        // When editing, an unchanged start may already have passed (a meeting
        // that wasn't started on time); only a new start must be in the future.
        const isStartChanged =
            !isEditing || start?.getTime() !== initialSlot?.start.getTime();
        const errors: FieldErrors = {};

        if (!title.trim()) errors.title = "Add a title";
        if (!date) {
            errors.date = "Add a date";
        } else if (!parseDate(date)) {
            errors.date = "Enter the date as DD/MM/YYYY";
        }
        if (!startTime) {
            errors.startTime = "Add a start time";
        } else if (!parseTime(startTime)) {
            errors.startTime = "Enter the start time as HH:MM (24-hour)";
        } else if (isStartChanged && start && start.getTime() <= Date.now()) {
            errors.startTime = "Pick a time in the future";
        }
        if (endTime && !parseTime(endTime)) {
            errors.endTime = "Enter the end time as HH:MM (24-hour)";
        } else if (start && end && end.getTime() <= start.getTime()) {
            errors.endTime = "The end time must be after the start time";
        }

        setFieldErrors(errors);
        if (Object.values(errors).some(Boolean) || !start) return;

        setIsSubmitting(true);
        try {
            const saved = meeting
                ? await updateMeeting(meeting._id, {
                      title: title.trim(),
                      description: description.trim() || null,
                      ...(isStartChanged && {
                          scheduled_start_at: start.toISOString(),
                      }),
                      scheduled_end_at: end?.toISOString() ?? null,
                      settings,
                  })
                : await scheduleMeeting({
                      title: title.trim(),
                      description: description.trim() || undefined,
                      scheduled_start_at: start.toISOString(),
                      scheduled_end_at: end?.toISOString(),
                      settings,
                  });
            onSaved(saved);
        } catch (error) {
            setFormError(getApiErrorMessage(error));
            setIsSubmitting(false);
        }
    };

    const timeZoneLabel = getTimeZoneLabel(
        combineDateAndTime(date, startTime) ?? today,
    );

    return (
        <form
            noValidate
            onSubmit={(event) => {
                void handleSubmit(event);
            }}
            className="flex flex-col gap-[22px]"
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
                        <DateField
                            id="date"
                            min={today}
                            value={date}
                            aria-invalid={fieldErrors.date ? true : undefined}
                            aria-describedby={
                                fieldErrors.date ? "date-error" : undefined
                            }
                            onValueChange={(value) => {
                                setDate(value);
                                clearFieldError("date");
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
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={TIME_PLACEHOLDER}
                            maxLength={TIME_PLACEHOLDER.length}
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
                                setStartTime(maskTimeInput(event.target.value));
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
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder={TIME_PLACEHOLDER}
                            maxLength={TIME_PLACEHOLDER.length}
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
                                setEndTime(maskTimeInput(event.target.value));
                                clearFieldError("endTime");
                            }}
                            className={FIELD_CLASS}
                        />
                    </div>
                </div>
                {fieldErrors.date && (
                    <p id="date-error" className="text-[13px] text-destructive">
                        {fieldErrors.date}
                    </p>
                )}
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
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="h-11 px-[18px] text-[15px]"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 min-w-42 px-[18px] text-[15px]"
                >
                    {isSubmitting && (
                        <LoaderCircle className="motion-safe:animate-spin" />
                    )}
                    {isEditing
                        ? isSubmitting
                            ? "Saving…"
                            : "Save changes"
                        : isSubmitting
                          ? "Scheduling…"
                          : "Schedule meeting"}
                </Button>
            </div>
        </form>
    );
}
