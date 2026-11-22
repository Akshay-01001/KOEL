import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { setUnauthorizedHandler } from "@/api/api";
import type { RedirectState } from "@/lib/redirect";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/slices/userSlice";

// When an API call reports that a signed-in user's session has ended, sign them
// out here too and send them to login, which explains why and brings them back
// to the same page afterwards. Renders nothing; must sit inside the router.
export default function SessionExpiryHandler() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const isSignedIn = useAppSelector((state) => {
        return state.user.user !== null;
    });
    // Read inside the handler, so it always sees the latest value.
    const isSignedInRef = useRef(isSignedIn);

    useEffect(() => {
        isSignedInRef.current = isSignedIn;
    }, [isSignedIn]);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            // Guests have no session to expire; several failing requests at
            // once should only redirect once.
            if (!isSignedInRef.current) return;
            isSignedInRef.current = false;

            dispatch(clearUser());
            const state: RedirectState = {
                from: window.location.pathname,
                reason: "expired",
            };
            navigate("/login", { replace: true, state });
        });
        return () => {
            setUnauthorizedHandler(null);
        };
    }, [dispatch, navigate]);

    return null;
}
