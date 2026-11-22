import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { UserRound } from "lucide-react";
import MeetingStatusScreen from "@/components/Meeting/MeetingStatusScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GuestPreJoinProps = {
    meetingCode: string;
    // Where sign-in should bring the user back to.
    signInFrom: string;
    onJoin: (name: string) => void;
};

const NAME_MAX_LENGTH = 60;

// Before a guest joins: pick the name others will see, or keep the
// "Anonymous 1234" placeholder. Offers sign-in for people with an account.
export default function GuestPreJoin({
    meetingCode,
    signInFrom,
    onJoin,
}: GuestPreJoinProps) {
    const [placeholderName] = useState(() => {
        return `Anonymous ${1000 + Math.floor(Math.random() * 9000)}`;
    });
    const [name, setName] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onJoin(name.trim() || placeholderName);
    };

    return (
        <MeetingStatusScreen
            icon={<UserRound className="size-8" strokeWidth={1.75} />}
            title="Join as a guest"
        >
            <span className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 font-mono text-[13px] tracking-[0.02em]">
                {meetingCode}
            </span>

            <form
                onSubmit={handleSubmit}
                className="mt-2 flex w-full max-w-[360px] flex-col gap-4 text-left"
            >
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="guest-name">Your name</Label>
                    <Input
                        id="guest-name"
                        type="text"
                        autoComplete="name"
                        placeholder={placeholderName}
                        maxLength={NAME_MAX_LENGTH}
                        value={name}
                        aria-describedby="guest-name-help"
                        onChange={(event) => {
                            setName(event.target.value);
                        }}
                        className="h-11 bg-card px-3.5 text-[15px]"
                    />
                    <p
                        id="guest-name-help"
                        className="text-[13px] leading-[1.45] text-muted-foreground"
                    >
                        Others see this name, or “{placeholderName}” if you
                        leave it blank.
                    </p>
                </div>

                <Button
                    type="submit"
                    className="h-12 w-full rounded-xl px-6 text-base"
                >
                    Join now
                </Button>
                <Button
                    asChild
                    variant="ghost"
                    className="h-11 w-full px-[18px] text-[15px]"
                >
                    <Link to="/">Back to home</Link>
                </Button>
            </form>

            <p className="text-sm text-muted-foreground">
                Have an account?{" "}
                <Link
                    to="/login"
                    state={{ from: signInFrom }}
                    className="font-medium text-foreground underline decoration-input underline-offset-[3px] hover:decoration-foreground"
                >
                    Sign in
                </Link>
            </p>
        </MeetingStatusScreen>
    );
}
