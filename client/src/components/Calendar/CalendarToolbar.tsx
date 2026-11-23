import { ChevronLeft, ChevronRight, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/store/slices/calendarSlice";

const VIEWS: { value: CalendarView; label: string }[] = [
    { value: "dayGridMonth", label: "Month" },
    { value: "timeGridWeek", label: "Week" },
    { value: "timeGridDay", label: "Day" },
];

// "Previous month", "Next week", ...
function getStepLabel(direction: "Previous" | "Next", view: CalendarView) {
    const unit = VIEWS.find((option) => {
        return option.value === view;
    })?.label.toLowerCase();
    return `${direction} ${unit}`;
}

type CalendarToolbarProps = {
    title: string;
    // Meetings for the range on screen are still loading.
    isLoading: boolean;
    view: CalendarView;
    isTodayInView: boolean;
    onToday: () => void;
    onPrev: () => void;
    onNext: () => void;
    onViewChange: (view: CalendarView) => void;
    onSchedule: () => void;
};

// Above the calendar: Today and the arrows, the range being shown, the
// Month/Week/Day switch, and a button that opens the schedule modal.
export default function CalendarToolbar({
    title,
    isLoading,
    view,
    isTodayInView,
    onToday,
    onPrev,
    onNext,
    onViewChange,
    onSchedule,
}: CalendarToolbarProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    disabled={isTodayInView}
                    onClick={onToday}
                    className="mr-1 h-11 border-input bg-card px-3.5 text-sm"
                >
                    Today
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={getStepLabel("Previous", view)}
                    onClick={onPrev}
                    className="size-11"
                >
                    <ChevronLeft className="size-5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={getStepLabel("Next", view)}
                    onClick={onNext}
                    className="size-11"
                >
                    <ChevronRight className="size-5" />
                </Button>
                <h2
                    aria-live="polite"
                    className="ml-2 truncate font-display text-xl font-semibold tracking-[-0.01em]"
                >
                    {title}
                </h2>
                {isLoading && (
                    <span role="status" className="ml-1 flex shrink-0">
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-4 text-muted-foreground motion-safe:animate-spin"
                        />
                        <span className="sr-only">Loading meetings…</span>
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div
                    role="group"
                    aria-label="Calendar view"
                    className="flex h-11 items-center gap-0.5 rounded-lg bg-muted p-1"
                >
                    {VIEWS.map((option) => {
                        const isActive = option.value === view;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => {
                                    onViewChange(option.value);
                                }}
                                className={cn(
                                    "h-full cursor-pointer rounded-md px-3.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                                    isActive
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
                <Button
                    type="button"
                    onClick={onSchedule}
                    className="h-11 px-3.5 text-sm"
                >
                    <Plus />
                    Schedule
                </Button>
            </div>
        </div>
    );
}
