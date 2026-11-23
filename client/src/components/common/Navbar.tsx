import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronDown, LoaderCircle, LogOut } from "lucide-react";
import { logout } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import KoelLogo from "@/components/common/KoelLogo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/slices/userSlice";

// "Riya Sharma" -> "RS"; a single name gives one letter.
function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => {
            return part.charAt(0).toUpperCase();
        })
        .join("");
}

// Top bar: Koel logo on the left; on the right the theme toggle, then the account
// menu for signed-in users or Sign in / Create account for guests.
export default function Navbar() {
    const user = useAppSelector((state) => {
        return state.user.user;
    });
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [signOutError, setSignOutError] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Only signs out locally once the server has dropped the session; otherwise
    // the cookie would still be there and a reload would sign them back in.
    const handleSignOut = async () => {
        setIsSigningOut(true);
        setSignOutError(null);
        try {
            await logout();
        } catch (error) {
            setSignOutError(getApiErrorMessage(error));
            setIsSigningOut(false);
            return;
        }
        setIsMenuOpen(false);
        setIsSigningOut(false);
        dispatch(clearUser());
        navigate("/login", { replace: true });
    };

    // Close the account menu on an outside click or Escape.
    useEffect(() => {
        if (!isMenuOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsMenuOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen]);

    return (
        <header className="border-b border-border">
            <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-4 py-3.5 sm:px-10">
                <Link
                    to="/"
                    aria-label="Koel home"
                    className="flex items-center gap-2 text-foreground"
                >
                    <KoelLogo />
                    <span className="font-display text-xl font-semibold tracking-tight">
                        Koel
                    </span>
                </Link>

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    {user && (
                        <div ref={menuRef} className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                aria-label={`Account menu for ${user.name}`}
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                                onClick={() => {
                                    setIsMenuOpen((open) => {
                                        return !open;
                                    });
                                }}
                                className="h-11 gap-2.5 pr-2.5 pl-1.5"
                            >
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt=""
                                        className="size-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="flex size-8 items-center justify-center rounded-full bg-(--figure-riya) font-display text-[13px] font-semibold text-[oklch(0.956_0.005_264)]">
                                        {getInitials(user.name)}
                                    </span>
                                )}
                                <span className="hidden text-sm sm:inline">
                                    {user.name}
                                </span>
                                <ChevronDown className="text-muted-foreground" />
                            </Button>

                            {isMenuOpen && (
                                <div
                                    role="menu"
                                    aria-label="Account"
                                    className="absolute top-full right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
                                >
                                    <div className="px-3 py-2">
                                        <p className="truncate text-sm font-semibold">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div
                                        role="separator"
                                        className="my-1 h-px bg-border"
                                    />
                                    <button
                                        type="button"
                                        role="menuitem"
                                        autoFocus
                                        disabled={isSigningOut}
                                        onClick={() => {
                                            void handleSignOut();
                                        }}
                                        className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium outline-none hover:bg-muted focus-visible:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSigningOut ? (
                                            <LoaderCircle className="size-4 text-muted-foreground motion-safe:animate-spin" />
                                        ) : (
                                            <LogOut className="size-4 text-muted-foreground" />
                                        )}
                                        {isSigningOut
                                            ? "Signing out…"
                                            : "Sign out"}
                                    </button>
                                    {signOutError && (
                                        <p
                                            role="alert"
                                            className="px-3 pt-1 pb-2 text-[13px] text-destructive"
                                        >
                                            {signOutError}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {!user && (
                        <>
                            <Button
                                asChild
                                variant="ghost"
                                className="h-11 px-3.5 text-sm"
                            >
                                <Link to="/login">Sign in</Link>
                            </Button>
                            <Button
                                asChild
                                className="hidden h-11 px-3.5 text-sm sm:inline-flex"
                            >
                                <Link to="/register">Create account</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
