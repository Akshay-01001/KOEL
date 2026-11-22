import { Link, useLocation } from "react-router";
import KoelLogo from "@/components/common/KoelLogo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";

type LoginHeaderProps = {
    prompt: string;
    actionLabel: string;
    actionTo: string;
};

// Top bar shared by the login and register pages; the right side links to the other page.
export default function LoginHeader({
    prompt,
    actionLabel,
    actionTo,
}: LoginHeaderProps) {
    const location = useLocation();

    return (
        <header className="flex h-20 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
                <KoelLogo />
                <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
                    Koel
                </span>
            </Link>

            <div className="flex items-center gap-3">
                <ThemeToggle />
                <span className="hidden text-sm text-muted-foreground sm:inline">
                    {prompt}
                </span>
                <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-lg bg-card px-4 text-sm font-medium shadow-xs"
                >
                    {/* Keep the "come back to" target when switching between login and register. */}
                    <Link to={actionTo} state={location.state}>
                        {actionLabel}
                    </Link>
                </Button>
            </div>
        </header>
    );
}
