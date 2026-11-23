import { useRef, type ComponentProps } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DATE_PLACEHOLDER, maskDateInput, parseDate } from "@/lib/dateFormat";
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

const pad = (value: number) => {
    return String(value).padStart(2, "0");
};

// "YYYY-MM-DD", the value the browser's native date picker works with.
const toIsoDay = (date: Date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// A date typed as DD/MM/YYYY (the slashes are added while typing), with a
// button that opens the browser's date picker for those who'd rather pick.
export default function DateField({
    value,
    onValueChange,
    min,
    className,
    disabled,
    ...inputProps
}: DateFieldProps) {
    const pickerRef = useRef<HTMLInputElement>(null);

    const parsed = parseDate(value);
    const pickerValue = parsed
        ? `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`
        : "";

    const openPicker = () => {
        const picker = pickerRef.current;
        if (!picker) return;
        try {
            picker.showPicker();
        } catch {
            // Older browsers without showPicker(): typing still works.
            picker.focus();
        }
    };

    return (
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
            {/* The native picker, kept invisible under the field so its popup opens there. */}
            <input
                ref={pickerRef}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                min={min ? toIsoDay(min) : undefined}
                value={pickerValue}
                disabled={disabled}
                onChange={(event) => {
                    const [year, month, day] = event.target.value.split("-");
                    if (year && month && day) {
                        onValueChange(`${day}/${month}/${year}`);
                    }
                }}
                className="pointer-events-none absolute inset-x-0 bottom-0 h-0 w-full opacity-0"
            />
            <button
                type="button"
                aria-label="Choose a date"
                disabled={disabled}
                onClick={openPicker}
                className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
                <CalendarDays className="size-4" />
            </button>
        </div>
    );
}
