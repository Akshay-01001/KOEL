import GuestShowcase from "@/components/Home/GuestShowcase";
import GuestStartCard from "@/components/Home/GuestStartCard";
import JoinMeetingCard from "@/components/Home/JoinMeetingCard";
import NewMeetingCard from "@/components/Home/NewMeetingCard";
import UpcomingSection from "@/components/Home/UpcomingSection";
import { useAppSelector } from "@/store/hooks";

function getGreeting(date: Date) {
    const hour = date.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

// Landing page. Signed-in users get the greeting, start/join cards, and their
// upcoming meetings; guests can join with a code and see what Koel offers.
export default function Home() {
    const user = useAppSelector((state) => {
        return state.user.user;
    });
    const firstName = user?.name.trim().split(/\s+/)[0];
    const greeting = getGreeting(new Date());

    let heading = "Join a meeting";
    if (user) heading = firstName ? `${greeting}, ${firstName}` : greeting;

    return (
        <div className="mx-auto flex max-w-[1120px] flex-col gap-10 px-4 pt-12 pb-20 sm:px-10">
            <h1 className="font-display text-[34px] leading-[1.15] font-semibold tracking-[-0.02em]">
                {heading}
            </h1>

            <section
                aria-label="Start or join"
                className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4"
            >
                {user ? (
                    <>
                        <NewMeetingCard />
                        <JoinMeetingCard />
                    </>
                ) : (
                    <>
                        <JoinMeetingCard />
                        <GuestStartCard />
                    </>
                )}
            </section>

            {user ? <UpcomingSection /> : <GuestShowcase />}
        </div>
    );
}
