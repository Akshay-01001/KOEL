import UpcomingList from "@/components/Home/UpcomingList";
import { useUpcomingMeetings } from "@/components/Home/useUpcomingMeetings";

// "Upcoming" heading with the total count (once loaded), and the list below it.
// Loads its own data, so it's only fetched when this section is shown (signed-in users).
export default function UpcomingSection() {
    const { state: upcoming, reload, loadMore } = useUpcomingMeetings();

    return (
        <section
            aria-labelledby="upcoming-heading"
            className="flex flex-col gap-5"
        >
            <div className="flex border-b border-border">
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
            </div>
            <UpcomingList
                state={upcoming}
                onRetry={reload}
                onLoadMore={() => {
                    void loadMore();
                }}
            />
        </section>
    );
}
