import { useState, type ComponentProps } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DATE_PLACEHOLDER,
    formatDate,
    maskDateInput,
    parseDate,
} from "@/lib/dateFormat";
import { cn } from "@/lib/utils";

type DateFieldProps = Omit<
    ComponentProps<typeof Input>,
    "type" | "value" | "onChange" | "min"
> & {
    // "DD/MM/YYYY", or whatever has been typed so far.
    value: string;
    onValueChange: (value: string) => void;
    // Earliest day the picker offers.
    min?: Date;
};

// A date typed as DD/MM/YYYY (the slashes are added while typing), with a
// button that opens a calendar under the field for those who'd rather pick.
export default function DateField({
    value,
    onValueChange,
    min,
    className,
    disabled,
    ...inputProps
}: DateFieldProps) {
    const [isOpen, setIsOpen] = useState(false);

    const parsed = parseDate(value);
    const selected = parsed
        ? new Date(parsed.year, parsed.month - 1, parsed.day)
        : null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            {/* The calendar lines up with the whole field, not just the button. */}
            <PopoverAnchor asChild>
                <div className="relative">
                    <Input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={DATE_PLACEHOLDER}
                        maxLength={DATE_PLACEHOLDER.length}
                        value={value}
                        disabled={disabled}
                        onChange={(event) => {
                            onValueChange(maskDateInput(event.target.value));
                        }}
                        className={cn("pr-12", className)}
                        {...inputProps}
                    />
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label="Choose a date"
                            disabled={disabled}
                            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                        >
                            <CalendarDays className="size-4" />
                        </button>
                    </PopoverTrigger>
                </div>
            </PopoverAnchor>
            <PopoverContent align="start">
                <Calendar
                    mode="single"
                    // Sunday first, like the Calendar page.
                    weekStartsOn={0}
                    selected={selected ?? undefined}
                    defaultMonth={selected ?? min}
                    disabled={min ? { before: min } : undefined}
                    // Focuses the picked day (or today) when it opens.
                    autoFocus
                    onSelect={(day) => {
                        if (!day) return;
                        onValueChange(formatDate(day));
                        setIsOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
