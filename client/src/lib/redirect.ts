// Pages that send a guest to sign in pass `{ from: "/meet/abc-defg-hij" }` as
// router state, so login/register can bring them back afterwards.
export type RedirectState = { from?: string } | null;

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
