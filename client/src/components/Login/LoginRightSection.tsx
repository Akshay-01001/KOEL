import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { getApiErrorMessage } from "@/api/api";
import { getRedirectTarget, isSessionExpired } from "@/lib/redirect";
import { login } from "@/api/apiFunctions";
import AuthFormLayout from "@/components/common/AuthFormLayout";
import FormField from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";

export default function LoginRightSection() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const user = await login({ email, password });
            dispatch(setUser(user));
            // Back to where a guest came from (e.g. a meeting link), else home.
            navigate(getRedirectTarget(location.state), { replace: true });
        } catch (err) {
            setError(getApiErrorMessage(err));
            setIsSubmitting(false);
        }
    };

    return (
        <AuthFormLayout
            title="Welcome back"
            subtitle="Sign in to pick up where you left off."
            googleLabel="Sign in with Google"
            notice={
                isSessionExpired(location.state)
                    ? "Your session expired. Sign in again to continue where you left off."
                    : undefined
            }
        >
            <form onSubmit={handleSubmit} className="grid gap-5">
                <FormField
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="grid gap-3">
                    <FormField
                        id="password"
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="justify-self-end text-sm font-medium text-foreground hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>

                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-1 h-12 w-full rounded-lg text-base font-semibold hover:bg-primary/90"
                >
                    {isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </AuthFormLayout>
    );
}
