import { useEffect } from "react";
import { applyTheme, getSavedTheme, watchSystemTheme } from "@/lib/theme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme } from "@/store/slices/themeSlice";

// Keeps <html class="dark"> in step with the theme in the store, and follows the
// system theme until the user picks one with the toggle.
export function useThemeSync() {
    const dispatch = useAppDispatch();
    const theme = useAppSelector((state) => {
        return state.theme.theme;
    });

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        return watchSystemTheme((systemTheme) => {
            if (getSavedTheme()) return;
            dispatch(setTheme(systemTheme));
        });
    }, [dispatch]);
}
