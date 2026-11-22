import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
} from "react-router";
import { getMe } from "@/api/apiFunctions";
import Layout from "@/components/common/Layout";
import SessionExpiryHandler from "@/components/common/SessionExpiryHandler";
import Home from "@/components/Home/Home";
import MeetingPage from "@/components/Meeting/MeetingRoom";
import ScheduleMeeting from "@/components/Schedule/ScheduleMeeting";
import Login from "@/components/Login/Login";
import Register from "@/components/Register/Register";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser, setUser } from "@/store/slices/userSlice";
import { getRedirectTarget } from "@/lib/redirect";
import { useThemeSync } from "@/lib/useThemeSync";

// Pages that need a logged-in user. Anyone else is sent to /login.
function ProtectedRoute({ isLoggedIn }: { isLoggedIn: boolean }) {
    const location = useLocation();
    return isLoggedIn ? (
        <Outlet />
    ) : (
        <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
}

// Login/register pages. A logged-in user is sent to the home page instead.
function PublicRoute({ isLoggedIn }: { isLoggedIn: boolean }) {
    const location = useLocation();
    return isLoggedIn ? (
        <Navigate to={getRedirectTarget(location.state)} replace />
    ) : (
        <Outlet />
    );
}

export default function App() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.user.user);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    useThemeSync();

    // Ask the server who we are; the auth cookie is sent automatically.
    useEffect(() => {
        const controller = new AbortController();

        getMe(controller.signal)
            .then((me) => dispatch(setUser(me)))
            .catch((error) => {
                if (controller.signal.aborted) return;
                // 401/403 (no or expired cookie) — or any other failure — means logged out.
                console.warn("Auth check failed:", error?.response?.status);
                dispatch(clearUser());
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsCheckingAuth(false);
            });

        return () => controller.abort();
    }, [dispatch]);

    // Don't render routes until we know, so protected pages never flash.
    if (isCheckingAuth) {
        return <div className="min-h-svh bg-background" />;
    }

    const isLoggedIn = user !== null;

    return (
        <BrowserRouter>
            <SessionExpiryHandler />
            <Routes>
                {/* Open to everyone. Guests see a join-only home page and can
                    join meetings that allow guests. */}
                <Route
                    path="/"
                    element={
                        <Layout>
                            <Home />
                        </Layout>
                    }
                />
                <Route path="/meet/:meetingCode" element={<MeetingPage />} />

                <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
                    <Route
                        path="/schedule"
                        element={
                            <Layout>
                                <ScheduleMeeting />
                            </Layout>
                        }
                    />
                </Route>

                <Route element={<PublicRoute isLoggedIn={isLoggedIn} />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
