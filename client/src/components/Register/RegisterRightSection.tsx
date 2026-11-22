import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { getApiErrorMessage } from "@/api/api";
import { getRedirectTarget } from "@/lib/redirect";
import { register } from "@/api/apiFunctions";
import AuthFormLayout from "@/components/common/AuthFormLayout";
import FormField from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterRightSection() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const user = await register({ name, email, password });
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
            title="Create your account"
            subtitle="Make room for more good conversations."
            googleLabel="Sign up with Google"
        >
            <form onSubmit={handleSubmit} className="grid gap-5">
                <FormField
                    id="name"
                    label="Name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
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
                <FormField
                    id="password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

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
                    {isSubmitting ? "Creating account…" : "Create account"}
                </Button>
            </form>
        </AuthFormLayout>
    );
}
