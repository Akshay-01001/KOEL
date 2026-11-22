import { useEffect, useRef, useState } from "react";
import { getUpcomingMeetings } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import type { UpcomingMeeting } from "@/api/types/response.types";

export type UpcomingMeetingsState =
    | { status: "loading" }
    | { status: "error"; message: string }
    | {
          status: "ready";
          meetings: UpcomingMeeting[];
          total: number;
          page: number;
          hasMore: boolean;
          isLoadingMore: boolean;
          loadMoreError?: string;
      };

// Adds a new page to the list, skipping meetings already shown (offset pages can
// overlap if a meeting was added or removed in between).
function appendPage(existing: UpcomingMeeting[], next: UpcomingMeeting[]) {
    const seen = new Set(
        existing.map((meeting) => {
            return meeting._id;
        }),
    );
    return [
        ...existing,
        ...next.filter((meeting) => {
            return !seen.has(meeting._id);
        }),
    ];
}

// Loads the user's upcoming meetings a page at a time.
// `loadMore` adds the next page; `reload` starts over from the first page.
export function useUpcomingMeetings() {
    const [state, setState] = useState<UpcomingMeetingsState>({
        status: "loading",
    });
    const [attempt, setAttempt] = useState(0);
    // Cancels an in-flight "load more" when the list is reloaded or unmounted.
    const loadMoreController = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        getUpcomingMeetings(1, controller.signal)
            .then((data) => {
                setState({
                    status: "ready",
                    meetings: data.meetings,
                    total: data.total,
                    page: data.page,
                    hasMore: data.has_more,
                    isLoadingMore: false,
                });
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setState({
                    status: "error",
                    message: getApiErrorMessage(error),
                });
            });

        return () => {
            controller.abort();
            loadMoreController.current?.abort();
        };
    }, [attempt]);

    const reload = () => {
        setState({ status: "loading" });
        setAttempt((current) => {
            return current + 1;
        });
    };

    const loadMore = async () => {
        if (state.status !== "ready" || state.isLoadingMore || !state.hasMore) {
            return;
        }
        const nextPage = state.page + 1;
        const controller = new AbortController();
        loadMoreController.current = controller;

        setState({ ...state, isLoadingMore: true, loadMoreError: undefined });
        try {
            const data = await getUpcomingMeetings(nextPage, controller.signal);
            setState((current) => {
                if (current.status !== "ready") return current;
                return {
                    ...current,
                    meetings: appendPage(current.meetings, data.meetings),
                    total: data.total,
                    page: data.page,
                    hasMore: data.has_more,
                    isLoadingMore: false,
                };
            });
        } catch (error) {
            if (controller.signal.aborted) return;
            setState((current) => {
                if (current.status !== "ready") return current;
                return {
                    ...current,
                    isLoadingMore: false,
                    loadMoreError: getApiErrorMessage(error),
                };
            });
        }
    };

    return { state, reload, loadMore };
}
