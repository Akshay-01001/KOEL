import { configureStore } from "@reduxjs/toolkit";
import calendarReducer from "@/store/slices/calendarSlice";
import loaderReducer from "@/store/slices/loaderSlice";
import themeReducer from "@/store/slices/themeSlice";
import upcomingReducer from "@/store/slices/upcomingSlice";
import userReducer from "@/store/slices/userSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        theme: themeReducer,
        upcoming: upcomingReducer,
        calendar: calendarReducer,
        loader: loaderReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
