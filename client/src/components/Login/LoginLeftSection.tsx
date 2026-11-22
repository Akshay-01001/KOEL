import { cn } from "@/lib/utils";

const avatars = [
    { initials: "RS", className: "bg-primary text-primary-foreground" },
    { initials: "AM", className: "bg-avatar-mint text-avatar-mint-foreground" },
    { initials: "SI", className: "bg-avatar-sand text-avatar-sand-foreground" },
];

export default function LoginLeftSection() {
    return (
        <section className="hidden flex-col justify-between bg-secondary p-14 text-secondary-foreground lg:flex">
            <div className="flex flex-1 flex-col justify-center pb-14">
                <p className="text-sm font-semibold text-primary">
                    A calmer way to meet
                </p>
                <h2 className="mt-4 max-w-[460px] font-display text-5xl leading-[1.1] font-semibold">
                    Good conversations start face to face.
                </h2>
                <p className="mt-8 max-w-sm text-base leading-7 text-secondary-foreground/75">
                    Bring your people together in a space that keeps the focus
                    on what matters.
                </p>
            </div>

            <div className="flex items-center gap-4 border-t border-secondary-foreground/15 pt-6">
                <div className="flex -space-x-1">
                    {avatars.map(({ initials, className }) => (
                        <span
                            key={initials}
                            aria-hidden="true"
                            className={cn(
                                "flex size-9 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-secondary",
                                className,
                            )}
                        >
                            {initials}
                        </span>
                    ))}
                </div>
                <p className="text-sm text-secondary-foreground/80">
                    One click away from your next great conversation.
                </p>
            </div>
        </section>
    );
}
