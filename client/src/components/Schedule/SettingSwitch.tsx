import { cn } from "@/lib/utils";

type SettingSwitchProps = {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    showDivider: boolean;
};

// One on/off row: label and hint on the left, a switch on the right.
// The whole row is a <label>, so clicking the text flips the switch too.
export default function SettingSwitch({
    id,
    label,
    description,
    checked,
    onCheckedChange,
    showDivider,
}: SettingSwitchProps) {
    const descriptionId = `${id}-description`;

    return (
        <label
            htmlFor={id}
            className={cn(
                "flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2.5",
                showDivider && "border-t border-border",
            )}
        >
            <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-medium">{label}</span>
                <span
                    id={descriptionId}
                    className="text-[13px] leading-[1.45] text-muted-foreground"
                >
                    {description}
                </span>
            </span>
            <button
                type="button"
                role="switch"
                id={id}
                aria-checked={checked}
                aria-describedby={descriptionId}
                onClick={() => {
                    onCheckedChange(!checked);
                }}
                className={cn(
                    "relative h-[26px] w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                    "after:absolute after:top-[3px] after:left-[3px] after:size-5 after:rounded-full after:bg-card after:shadow-sm after:transition-transform",
                    checked
                        ? "bg-primary after:translate-x-[18px]"
                        : "bg-input",
                )}
            />
        </label>
    );
}
