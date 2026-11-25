import type { ComponentProps } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// react-day-picker styled with the app's theme (no stylesheet of its own), so
// it follows light and dark mode like everything else.
function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: ComponentProps<typeof DayPicker>) {
    const defaults = getDefaultClassNames();
    const navButton = cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "size-9 text-muted-foreground aria-disabled:pointer-events-none aria-disabled:opacity-35",
    );

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("relative w-fit font-sans", className)}
            classNames={{
                root: cn(defaults.root),
                months: cn("relative flex flex-col", defaults.months),
                month: cn("flex flex-col gap-2", defaults.month),
                nav: cn(
                    "absolute inset-x-0 top-0 flex items-center justify-between",
                    defaults.nav,
                ),
                button_previous: cn(navButton, defaults.button_previous),
                button_next: cn(navButton, defaults.button_next),
                month_caption: cn(
                    "flex h-9 items-center justify-center",
                    defaults.month_caption,
                ),
                caption_label: cn(
                    "font-display text-[15px] font-semibold",
                    defaults.caption_label,
                ),
                month_grid: cn("border-collapse", defaults.month_grid),
                weekdays: cn("flex", defaults.weekdays),
                weekday: cn(
                    "flex h-8 w-10 items-center justify-center text-xs font-medium text-muted-foreground",
                    defaults.weekday,
                ),
                week: cn("mt-0.5 flex", defaults.week),
                day: cn("size-10 p-0 text-center", defaults.day),
                day_button: cn(
                    "flex size-10 cursor-pointer items-center justify-center rounded-lg text-sm tabular-nums outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none",
                    defaults.day_button,
                ),
                today: cn(
                    "[&>button]:font-semibold [&>button]:text-primary",
                    defaults.today,
                ),
                selected: cn(
                    "[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90",
                    defaults.selected,
                ),
                outside: cn(
                    "[&>button]:text-muted-foreground",
                    defaults.outside,
                ),
                disabled: cn("[&>button]:opacity-35", defaults.disabled),
                hidden: cn("invisible", defaults.hidden),
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className: chevronClass }) => {
                    return orientation === "left" ? (
                        <ChevronLeft className={cn("size-4", chevronClass)} />
                    ) : (
                        <ChevronRight className={cn("size-4", chevronClass)} />
                    );
                },
            }}
            {...props}
        />
    );
}

export { Calendar };
