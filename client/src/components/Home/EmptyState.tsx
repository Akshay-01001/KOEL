import type { ReactNode } from "react";

type EmptyStateProps = {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
};

// Centered card shown when a list on the home page has nothing in it.
export default function EmptyState({
    icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
                {icon}
            </span>
            <h3 className="font-display text-xl font-semibold">{title}</h3>
            <p className="max-w-[380px] text-[15px] leading-normal text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-1.5">{action}</div>}
        </div>
    );
}
