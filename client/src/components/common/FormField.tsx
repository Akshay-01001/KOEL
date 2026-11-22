import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = ComponentProps<typeof Input> & {
    id: string;
    label: string;
};

export default function FormField({
    id,
    label,
    className,
    ...inputProps
}: FormFieldProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
            </Label>
            <Input
                id={id}
                name={id}
                className={cn(
                    "h-12 rounded-lg bg-card px-3.5 text-[15px] md:text-[15px]",
                    className,
                )}
                {...inputProps}
            />
        </div>
    );
}
