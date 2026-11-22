// Pages that send someone to sign in pass router state like
// `{ from: "/meet/abc-defg-hij", reason: "expired" }`, so login/register can
// explain why and bring them back afterwards.
export type RedirectState = {
    from?: string;
    // Set when the session ran out mid-use, so the login page can say so.
    reason?: "expired";
} | null;

// Where to go after signing in: the page they came from, or home.
// Only same-site paths are allowed ("/x", not "//evil.com").
export function getRedirectTarget(state: unknown) {
    const from = (state as RedirectState)?.from;
    if (
        typeof from === "string" &&
        from.startsWith("/") &&
        !from.startsWith("//")
    ) {
        return from;
    }
    return "/";
}

export function isSessionExpired(state: unknown) {
    return (state as RedirectState)?.reason === "expired";
}
