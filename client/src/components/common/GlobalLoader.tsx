import { LoaderCircle } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectIsLoading } from "@/store/slices/loaderSlice";

// Covers the whole page while any API request is in flight, with a spinner in
// the middle. The page stays mounted underneath (it made the request), but is
// hidden and can't be used until the request finishes.
export default function GlobalLoader() {
    const isLoading = useAppSelector(selectIsLoading);
    if (!isLoading) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background text-muted-foreground"
        >
            <LoaderCircle
                aria-hidden="true"
                className="size-10 text-primary motion-safe:animate-spin"
            />
            <span className="text-sm font-medium">Loading…</span>
        </div>
    );
}
