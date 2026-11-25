import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import FullCalendar, {
    type CalendarOptions,
    type CalendarRef,
    type DateSelectInfo,
    type DateSpanApi,
    type DatesSetInfo,
    type DayCellInfo,
    type DayHeaderInfo,
    type EventClickInfo,
    type EventInput,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import formaThemePlugin from "@fullcalendar/react/themes/forma";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/forma/theme.css";
import "@/components/Calendar/calendar.css";
import { getCalendarMeetings } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import type { CalendarMeeting } from "@/api/types/response.types";
import CalendarToolbar from "@/components/Calendar/CalendarToolbar";
import MeetingDialog from "@/components/Calendar/MeetingDialog";
import CancelMeetingDialog from "@/components/Schedule/CancelMeetingDialog";
import ScheduleMeetingDialog from "@/components/Schedule/ScheduleMeetingDialog";
import { getStartForCalendarSelection } from "@/components/Schedule/scheduleUtils";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    type CalendarView,
    calendarInvalidated,
    calendarLoadFailed,
    calendarLoadStarted,
    calendarLoaded,
    calendarPositionChanged,
    calendarRangeChanged,
    selectCalendar,
} from "@/store/slices/calendarSlice";

const PLUGINS = [
    dayGridPlugin,
    timeGridPlugin,
    interactionPlugin,
    formaThemePlugin,
];

// Event colours by status, as Koel tokens so they follow the theme.
const STATUS_COLORS: Record<
    CalendarMeeting["status"],
    { color: string; contrastColor: string }
> = {
    scheduled: {
        color: "var(--primary)",
        contrastColor: "var(--primary-foreground)",
    },
    running: {
        color: "var(--recording-dot)",
        contrastColor: "var(--primary-foreground)",
    },
    ended: {
        color: "var(--muted)",
        contrastColor: "var(--muted-foreground)",
    },
    cancelled: {
        color: "var(--muted)",
        contrastColor: "var(--muted-foreground)",
    },
};

// What FullCalendar passes to a formatter function: the date's wall-clock parts
// (month counts from 0), and `end` when it's formatting a range.
type FormatterArg = Parameters<
    Extract<CalendarOptions["dayHeaderFormat"], (arg: never) => string>
>[0];

const pad = (value: number) => {
    return String(value).padStart(2, "0");
};

// Week/day column headers: the weekday over "23/11", with today highlighted.
// The theme's own header shows only the parts it recognises (weekday, day),
// so a single custom string would leave it blank. Instead the format below
// keeps those parts separate and this puts them together.
const DAY_HEADER_FORMAT = {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
} as const;

const renderDayHeader = (info: DayHeaderInfo) => {
    return (
        <div className="flex flex-col items-start gap-0.5 py-1">
            <span className="text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase">
                {info.weekdayText}
            </span>
            <span
                className={cn(
                    "rounded-md font-display text-base leading-6 font-semibold tabular-nums",
                    info.isToday &&
                        "-ml-1.5 bg-primary px-1.5 text-primary-foreground",
                )}
            >
                {info.dayNumberText}/{info.monthText}
            </span>
        </div>
    );
};

// Time axis and meeting times: "09:00", or "09:00 – 09:45" for a range.
const formatClock = ({ start, end }: FormatterArg) => {
    const startText = `${pad(start.hour)}:${pad(start.minute)}`;
    if (!end) return startText;
    return `${startText} – ${pad(end.hour)}:${pad(end.minute)}`;
};

// First day of a month in the month view: "01/12".
const formatMonthStart = ({ date }: FormatterArg) => {
    return `${pad(date.day)}/${pad(date.month + 1)}`;
};

// "+N more" popover: "23/11/2026".
const formatPopoverDate = ({ date }: FormatterArg) => {
    return `${pad(date.day)}/${pad(date.month + 1)}/${date.year}`;
};

const monthTitleFormat = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
});

// The toolbar title for the range on screen: "November 2026" for a month,
// "22/11/2026 – 28/11/2026" for a week, "23/11/2026" for a day.
function getRangeTitle(view: CalendarView, start: Date, end: Date) {
    if (view === "dayGridMonth") return monthTitleFormat.format(start);
    if (view === "timeGridDay") return formatDate(start);
    const lastDay = new Date(end.getTime() - 1);
    return `${formatDate(start)} – ${formatDate(lastDay)}`;
}

const VIEW_OPTIONS: CalendarOptions["views"] = {
    dayGridMonth: { dayHeaderFormat: { weekday: "short" } },
    timeGridWeek: {
        dayHeaderFormat: DAY_HEADER_FORMAT,
        dayHeaderContent: renderDayHeader,
    },
    timeGridDay: {
        dayHeaderFormat: DAY_HEADER_FORMAT,
        dayHeaderContent: renderDayHeader,
    },
};

// The first time, phones start on the day view (a week of columns is too
// narrow there) and larger screens on the week view.
function getDefaultView(): CalendarView {
    return window.matchMedia("(min-width: 640px)").matches
        ? "timeGridWeek"
        : "timeGridDay";
}

// FullCalendar's default slot length in the week and day views.
const SLOT_MS = 30 * 60 * 1000;

const startOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// Where the meeting's block ends on the calendar: when it actually ended, for
// meetings that have. Otherwise the calendar gives it its default length.
function getEventEnd(meeting: CalendarMeeting) {
    if (
        meeting.ended_at &&
        new Date(meeting.ended_at) > new Date(meeting.scheduled_start_at)
    ) {
        return meeting.ended_at;
    }
    return undefined;
}

// /calendar: the signed-in user's meetings by month, week, or day, filling the
// page below the navbar. Clicking a meeting opens it to start or join (and for
// the host of a scheduled one, edit or cancel); clicking
// a day or time opens the schedule modal for that slot. Meetings are loaded
// for whatever range is on screen, each time it changes.
export default function CalendarPage() {
    const calendarRef = useRef<CalendarRef>(null);
    const dispatch = useAppDispatch();
    const calendar = useAppSelector(selectCalendar);
    const { meetings, range, refreshKey } = calendar;
    const isLoading = calendar.status === "loading";
    const error = calendar.status === "error" ? calendar.error : null;

    // Reopen where the user left the calendar, if they've been here before.
    const [initialView] = useState(() => {
        return calendar.view ?? getDefaultView();
    });
    const [initialDate] = useState(() => {
        return calendar.date ?? undefined;
    });

    // Loads the meetings for the range on screen: on mount, when the range
    // changes, and when the calendar is invalidated (e.g. after scheduling).
    const rangeFrom = range?.from;
    const rangeTo = range?.to;
    useEffect(() => {
        if (!rangeFrom || !rangeTo) return;
        const controller = new AbortController();
        dispatch(calendarLoadStarted());

        getCalendarMeetings(
            new Date(rangeFrom),
            new Date(rangeTo),
            controller.signal,
        )
            .then((data) => {
                dispatch(calendarLoaded(data));
            })
            .catch((loadError) => {
                if (controller.signal.aborted) return;
                dispatch(calendarLoadFailed(getApiErrorMessage(loadError)));
            });

        return () => {
            controller.abort();
        };
    }, [dispatch, rangeFrom, rangeTo, refreshKey]);
    const [view, setView] = useState<CalendarView>(initialView);
    const [title, setTitle] = useState("");
    const [isTodayInView, setIsTodayInView] = useState(true);

    const [selectedMeeting, setSelectedMeeting] =
        useState<CalendarMeeting | null>(null);
    const [isMeetingOpen, setIsMeetingOpen] = useState(false);
    const [scheduleStart, setScheduleStart] = useState<Date | undefined>(
        undefined,
    );
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    // Edit and Cancel open from the meeting modal, which closes first. Both act
    // on selectedMeeting.
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const events = useMemo<EventInput[]>(() => {
        return meetings.map((meeting) => {
            return {
                id: meeting._id,
                title: meeting.title,
                start: meeting.scheduled_start_at,
                end: getEventEnd(meeting),
                ...STATUS_COLORS[meeting.status],
            };
        });
    }, [meetings]);

    const getApi = () => {
        return calendarRef.current?.getApi();
    };

    const openSchedule = (start?: Date) => {
        setScheduleStart(start);
        setIsScheduleOpen(true);
    };

    // Keeps the toolbar in step whenever the calendar moves or changes view,
    // and loads the meetings for the dates now on screen.
    const handleDatesSet = (info: DatesSetInfo) => {
        const now = Date.now();
        const viewType = info.view.type as CalendarView;
        dispatch(
            calendarPositionChanged({
                view: viewType,
                date: info.view.currentStart.toISOString(),
            }),
        );
        dispatch(
            calendarRangeChanged({
                from: info.view.activeStart.toISOString(),
                to: info.view.activeEnd.toISOString(),
            }),
        );
        setTitle(
            getRangeTitle(
                viewType,
                info.view.currentStart,
                info.view.currentEnd,
            ),
        );
        setView(viewType);
        setIsTodayInView(
            info.view.currentStart.getTime() <= now &&
                now < info.view.currentEnd.getTime(),
        );
    };

    const handleEventClick = (info: EventClickInfo) => {
        info.jsEvent.preventDefault();
        const meeting = meetings.find((item) => {
            return item._id === info.event.id;
        });
        if (!meeting) return;
        setSelectedMeeting(meeting);
        setIsMeetingOpen(true);
    };

    // Meetings only have a start time, so one slot (week/day views) or one day
    // (month view) can be picked, not a range. Only the future: a slot that
    // hasn't fully passed, or a day from today on.
    const isSelectable = (span: DateSpanApi) => {
        if (span.allDay) {
            // Compared by date, not hours, so 23- and 25-hour days count as one.
            const nextDay = new Date(span.start);
            nextDay.setDate(nextDay.getDate() + 1);
            return (
                span.end.getTime() <= nextDay.getTime() &&
                span.start.getTime() >= startOfToday().getTime()
            );
        }
        const length = span.end.getTime() - span.start.getTime();
        return length <= SLOT_MS && span.end.getTime() > Date.now();
    };

    // Clicking a time slot opens the schedule modal starting at that time. In
    // the month view, picking a day opens it for that day.
    const handleSelect = (info: DateSelectInfo) => {
        openSchedule(
            getStartForCalendarSelection(info.start, info.allDay, new Date()),
        );
    };

    // Past days don't get the pointer, since clicking them does nothing.
    const getDayCellClass = (info: DayCellInfo) => {
        if (info.isPast && !info.isToday) return "";
        return info.view.type === "dayGridMonth"
            ? "koel-clickable koel-clickable-day"
            : "koel-clickable";
    };

    return (
        // 73px is the navbar. The footer sits just below the fold.
        <div className="flex h-[calc(100svh-73px)] min-h-[600px] flex-col gap-4 px-4 pt-5 pb-4 sm:px-6">
            <h1 className="sr-only">Calendar</h1>

            <CalendarToolbar
                title={title}
                isLoading={isLoading}
                view={view}
                isTodayInView={isTodayInView}
                onToday={() => {
                    getApi()?.today();
                }}
                onPrev={() => {
                    getApi()?.prev();
                }}
                onNext={() => {
                    getApi()?.next();
                }}
                onViewChange={(nextView) => {
                    getApi()?.changeView(nextView);
                }}
                onSchedule={() => {
                    openSchedule();
                }}
            />

            {error && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[color-mix(in_oklch,var(--destructive)_11%,var(--card))] px-4 py-2 text-sm text-destructive"
                >
                    <span className="flex items-center gap-2">
                        <CircleAlert className="size-4 shrink-0" />
                        Couldn’t load your meetings. {error}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            dispatch(calendarInvalidated());
                        }}
                        className="h-9 border-input bg-card px-3 text-sm text-foreground"
                    >
                        Try again
                    </Button>
                </div>
            )}

            <div className="koel-calendar min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card">
                <FullCalendar
                    ref={calendarRef}
                    plugins={PLUGINS}
                    initialView={initialView}
                    initialDate={initialDate}
                    headerToolbar={false}
                    height="100%"
                    events={events}
                    nowIndicator
                    dayMaxEvents
                    scrollTime="08:00:00"
                    views={VIEW_OPTIONS}
                    slotHeaderFormat={formatClock}
                    eventTimeFormat={formatClock}
                    monthStartFormat={formatMonthStart}
                    popoverFormat={formatPopoverDate}
                    dayCellClass={getDayCellClass}
                    slotLaneClass="koel-clickable"
                    datesSet={handleDatesSet}
                    eventClick={handleEventClick}
                    selectable
                    selectMirror
                    selectAllow={isSelectable}
                    select={handleSelect}
                />
            </div>

            <MeetingDialog
                open={isMeetingOpen}
                onOpenChange={setIsMeetingOpen}
                meeting={selectedMeeting}
                onEdit={() => {
                    setIsMeetingOpen(false);
                    setIsEditOpen(true);
                }}
                onCancel={() => {
                    setIsMeetingOpen(false);
                    setIsCancelOpen(true);
                }}
            />
            <ScheduleMeetingDialog
                open={isEditOpen && selectedMeeting !== null}
                onOpenChange={setIsEditOpen}
                meeting={selectedMeeting ?? undefined}
            />
            <CancelMeetingDialog
                open={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                meeting={selectedMeeting}
            />
            <ScheduleMeetingDialog
                open={isScheduleOpen}
                onOpenChange={(open) => {
                    setIsScheduleOpen(open);
                    // Clear the highlighted slot once the modal is closed.
                    if (!open) getApi()?.unselect();
                }}
                initialStart={scheduleStart}
            />
        </div>
    );
}
