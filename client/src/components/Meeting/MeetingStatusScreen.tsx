import type { ReactNode } from "react";
import { Link } from "react-router";
import KoelLogo from "@/components/common/KoelLogo";
import ThemeToggle from "@/components/common/ThemeToggle";

type MeetingStatusScreenProps = {
    icon?: ReactNode;
    title: string;
    description?: string;
    // Extra content under the description, e.g. a form.
    children?: ReactNode;
    actions?: ReactNode;
};

// Full-screen message shown around a call: joining, left, ended, or an error.
export default function MeetingStatusScreen({
    icon,
    title,
    description,
    children,
    actions,
}: MeetingStatusScreenProps) {
    return (
        <div className="flex min-h-svh flex-col bg-background text-foreground">
            <header className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-10">
                <Link
                    to="/"
                    aria-label="Koel home"
                    className="inline-flex items-center gap-2"
                >
                    <KoelLogo />
                    <span className="font-display text-xl font-semibold tracking-tight">
                        Koel
                    </span>
                </Link>
                <ThemeToggle />
            </header>

            <main className="flex flex-1 items-center justify-center px-4 pb-20">
                <div className="flex max-w-[420px] flex-col items-center gap-4 text-center">
                    {icon && (
                        <span
                            aria-hidden="true"
                            className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
                        >
                            {icon}
                        </span>
                    )}
                    <h1
                        className="font-display text-[28px] leading-tight font-semibold tracking-[-0.01em]"
                        aria-live="polite"
                    >
                        {title}
                    </h1>
                    {description && (
                        <p className="text-[15px] leading-normal text-muted-foreground">
                            {description}
                        </p>
                    )}
                    {children}
                    {actions && (
                        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
                            {actions}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
