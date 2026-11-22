import type { ReactNode } from "react";
import GoogleButton from "@/components/common/GoogleButton";

type AuthFormLayoutProps = {
    title: string;
    subtitle: string;
    googleLabel: string;
    // Optional message above the Google button, e.g. "Your session expired".
    notice?: ReactNode;
    children: ReactNode;
};

// Shared shell for the right-hand side of the login and register pages:
// heading, Google button, "or continue with email" divider, the form, and the terms note.
export default function AuthFormLayout({
    title,
    subtitle,
    googleLabel,
    notice,
    children,
}: AuthFormLayoutProps) {
    return (
        <div className="w-full max-w-[420px]">
            <p className="text-sm font-medium text-muted-foreground">
                Welcome to Koel
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">
                {title}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>

            {notice && (
                <p
                    role="status"
                    className="mt-6 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground"
                >
                    {notice}
                </p>
            )}

            <GoogleButton label={googleLabel} className="mt-8" />

            <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground">
                    or continue with email
                </span>
                <span className="h-px flex-1 bg-border" />
            </div>

            {children}

            <p className="mt-8 text-center text-xs text-muted-foreground">
                By continuing, you agree to Koel&rsquo;s terms and privacy
                policy.
            </p>
        </div>
    );
}
