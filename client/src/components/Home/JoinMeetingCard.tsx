import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMeetingPath, parseMeetingCode } from "@/lib/meetingCode";

// "Join with a code" card. Accepts a bare code or a full meeting link and
// opens the meeting page, which does the actual join.
export default function JoinMeetingCard() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const meetingCode = parseMeetingCode(code);
        if (!meetingCode) {
            setError(
                "That doesn’t look like a meeting code, e.g. abc-defg-hij.",
            );
            return;
        }
        navigate(getMeetingPath(meetingCode));
    };

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7">
            <div className="flex items-start gap-4">
                <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted"
                >
                    <Link2 className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-semibold">
                        Join with a code
                    </h2>
                    <p className="text-sm leading-normal text-muted-foreground">
                        Enter the code from your invite, or paste the link.
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-2"
            >
                <div className="flex flex-wrap gap-2.5">
                    <label htmlFor="meeting-code" className="sr-only">
                        Meeting code or link
                    </label>
                    <Input
                        id="meeting-code"
                        type="text"
                        placeholder="abc-defg-hij"
                        autoComplete="off"
                        value={code}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={
                            error ? "meeting-code-error" : undefined
                        }
                        onChange={(event) => {
                            setCode(event.target.value);
                            setError(null);
                        }}
                        className="h-11 flex-[1_1_180px] bg-card px-3.5 font-mono text-[15px] tracking-[0.02em]"
                    />
                    <Button
                        type="submit"
                        variant="outline"
                        disabled={!code.trim()}
                        className="h-11 min-w-24 border-input bg-card px-[18px] text-[15px]"
                    >
                        Join
                    </Button>
                </div>
                {error && (
                    <p
                        id="meeting-code-error"
                        role="alert"
                        className="text-[13px] text-destructive"
                    >
                        {error}
                    </p>
                )}
            </form>
        </div>
    );
}
