import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getAppliedTheme, type Theme } from "@/lib/theme";

type ThemeState = {
    theme: Theme;
};

// Start from whatever index.html already put on <html>, so state and page agree.
const initialState: ThemeState = {
    theme: getAppliedTheme(),
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setTheme(state, action: PayloadAction<Theme>) {
            state.theme = action.payload;
        },
    },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
