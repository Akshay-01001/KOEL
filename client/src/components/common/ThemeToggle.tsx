import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme } from "@/store/slices/themeSlice";

type ThemeToggleProps = {
    className?: string;
};

// Sun/moon button that flips between the light and dark theme and remembers the choice.
// It shows the theme you'd switch to: a moon in light mode, a sun in dark mode.
export default function ThemeToggle({ className }: ThemeToggleProps) {
    const dispatch = useAppDispatch();
    const theme = useAppSelector((state) => {
        return state.theme.theme;
    });
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = `Switch to ${nextTheme} theme`;

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            onClick={() => {
                saveTheme(nextTheme);
                dispatch(setTheme(nextTheme));
            }}
            className={cn("size-11 text-muted-foreground", className)}
        >
            {theme === "dark" ? (
                <Sun className="size-5" />
            ) : (
                <Moon className="size-5" />
            )}
        </Button>
    );
}
