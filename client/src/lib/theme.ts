export type Theme = "light" | "dark";

// Also read by the inline script in index.html; keep the two in sync.
const STORAGE_KEY = "koel-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

// The theme the inline script in index.html already applied to <html>.
export function getAppliedTheme(): Theme {
    return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
}

export function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
}

export function getSavedTheme(): Theme | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === "light" || saved === "dark" ? saved : null;
    } catch {
        return null;
    }
}

export function saveTheme(theme: Theme) {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Storage blocked: the choice just won't survive a reload.
    }
}

// Calls back with the system theme whenever it changes. Returns an unsubscribe.
export function watchSystemTheme(onChange: (theme: Theme) => void) {
    const query = window.matchMedia(DARK_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
        onChange(event.matches ? "dark" : "light");
    };
    query.addEventListener("change", handleChange);
    return () => {
        query.removeEventListener("change", handleChange);
    };
}
