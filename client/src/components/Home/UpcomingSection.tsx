import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CalendarDays } from "lucide-react";
import { getUpcomingMeetings } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import UpcomingList from "@/components/Home/UpcomingList";
import ScheduleMeetingDialog from "@/components/Schedule/ScheduleMeetingDialog";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    selectUpcoming,
    upcomingInvalidated,
    upcomingLoadFailed,
    upcomingLoadStarted,
    upcomingLoaded,
    upcomingMoreFailed,
    upcomingMoreLoaded,
    upcomingMoreStarted,
} from "@/store/slices/upcomingSlice";

// "Upcoming" heading with the total count, and the list below it.
// Loads page 1 on mount and whenever the list is invalidated.
export default function UpcomingSection() {
    const dispatch = useAppDispatch();
    const upcoming = useAppSelector(selectUpcoming);
    const loadMoreController = useRef<AbortController | null>(null);
    // Lives here, not in the list, so it stays open while the list reloads.
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        // A reload makes any "Show more" page in flight stale.
        loadMoreController.current?.abort();
        dispatch(upcomingLoadStarted());

        getUpcomingMeetings(1, controller.signal)
            .then((data) => {
                dispatch(upcomingLoaded(data));
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                dispatch(upcomingLoadFailed(getApiErrorMessage(error)));
            });

        return () => {
            controller.abort();
            loadMoreController.current?.abort();
        };
    }, [dispatch, upcoming.refreshKey]);

    const loadMore = async () => {
        if (
            upcoming.status !== "ready" ||
            !upcoming.hasMore ||
            upcoming.isLoadingMore
        ) {
            return;
        }
        const controller = new AbortController();
        loadMoreController.current = controller;
        dispatch(upcomingMoreStarted());
        try {
            const data = await getUpcomingMeetings(
                upcoming.page + 1,
                controller.signal,
            );
            dispatch(upcomingMoreLoaded(data));
        } catch (error) {
            if (controller.signal.aborted) return;
            dispatch(upcomingMoreFailed(getApiErrorMessage(error)));
        }
    };

    return (
        <section
            aria-labelledby="upcoming-heading"
            className="flex flex-col gap-5"
        >
            <div className="flex items-center justify-between gap-3 border-b border-border">
                <h2
                    id="upcoming-heading"
                    className="-mb-px inline-flex min-h-12 items-center gap-2 border-b-2 border-primary px-0.5 text-[15px] font-medium"
                >
                    Upcoming
                    {upcoming.status === "ready" && (
                        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-muted px-[7px] text-xs text-muted-foreground">
                            {upcoming.total}
                        </span>
                    )}
                </h2>
                <Button
                    asChild
                    variant="ghost"
                    className="-mr-3.5 h-11 px-3.5 text-sm text-muted-foreground"
                >
                    <Link to="/calendar">
                        <CalendarDays />
                        Calendar
                    </Link>
                </Button>
            </div>
            <UpcomingList
                state={upcoming}
                onRetry={() => {
                    dispatch(upcomingInvalidated());
                }}
                onLoadMore={() => {
                    void loadMore();
                }}
                onSchedule={() => {
                    setIsScheduleOpen(true);
                }}
            />
            <ScheduleMeetingDialog
                open={isScheduleOpen}
                onOpenChange={setIsScheduleOpen}
            />
        </section>
    );
}
