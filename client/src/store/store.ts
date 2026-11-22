import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "@/store/slices/themeSlice";
import userReducer from "@/store/slices/userSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        theme: themeReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
