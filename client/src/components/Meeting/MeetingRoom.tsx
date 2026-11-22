import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import axios from "axios";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionError, DisconnectReason } from "livekit-client";
import {
    CalendarClock,
    CircleAlert,
    LoaderCircle,
    LogOut,
    PhoneOff,
} from "lucide-react";
import { joinMeeting, leaveMeeting, startMeeting } from "@/api/apiFunctions";
import { getApiErrorMessage } from "@/api/api";
import type {
    ErrorResponse,
    JoinMeetingData,
} from "@/api/types/response.types";
import GuestPreJoin from "@/components/Meeting/GuestPreJoin";
import MeetingHeader from "@/components/Meeting/MeetingHeader";
import MeetingStatusScreen from "@/components/Meeting/MeetingStatusScreen";
import NoiseFilter from "@/components/Meeting/NoiseFilter";
import { Button } from "@/components/ui/button";
import { getMeetingPath, parseMeetingCode } from "@/lib/meetingCode";
import { useAppSelector } from "@/store/hooks";

type RoomState =
    | { status: "joining" }
    // Scheduled meeting the host hasn't started; we keep checking until they do.
    | { status: "waiting-for-host" }
    // The user is the host of a scheduled meeting that isn't running yet.
    | {
          status: "host-not-started";
          meetingId: string;
          isStarting: boolean;
          error?: string;
      }
    | { status: "connected"; connection: JoinMeetingData }
    | { status: "left" }
    | { status: "ended-by-you" }
    | { status: "ended-by-host" }
    | { status: "error"; message: string };

const WAITING_POLL_MS = 5000;

const BUTTON_CLASS = "h-11 px-[18px] text-[15px]";

// The server answers 409 with the meeting id and whether we're the host when the
// meeting is scheduled but not started yet.
function getNotStartedDetails(error: unknown) {
    if (!axios.isAxiosError<ErrorResponse>(error)) return null;
    if (error.response?.status !== 409) return null;
    const data = error.response.data?.data;
    if (!data?.meeting_id || typeof data.is_host !== "boolean") return null;
    return { meetingId: data.meeting_id, isHost: data.is_host };
}
const OUTLINE_BUTTON_CLASS = `${BUTTON_CLASS} border-input bg-card`;

function BackHomeButton() {
    return (
        <Button asChild variant="outline" className={OUTLINE_BUTTON_CLASS}>
            <Link to="/">Back to home</Link>
        </Button>
    );
}

// For guests: sign in, then come back to this meeting.
function SignInButton() {
    const location = useLocation();
    return (
        <Button asChild variant="outline" className={OUTLINE_BUTTON_CLASS}>
            <Link to="/login" state={{ from: location.pathname }}>
                Sign in
            </Link>
        </Button>
    );
}

type MeetingRoomProps = {
    meetingCode: string;
    // Set for guests (the name others will see); undefined for signed-in users.
    guestName?: string;
};

// Joins the meeting on the server, then connects to its LiveKit room with mic and
// camera on. LiveKit's prebuilt VideoConference gives the grid, controls, chat,
// screen share, and the Leave button.
function MeetingRoom({ meetingCode, guestName }: MeetingRoomProps) {
    const isGuest = guestName !== undefined;
    const [roomState, setRoomState] = useState<RoomState>({
        status: "joining",
    });
    // Bumped by "Rejoin" / "Try again" to run the join again.
    const [joinAttempt, setJoinAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        joinMeeting(meetingCode, guestName, controller.signal)
            .then((connection) => {
                setRoomState({ status: "connected", connection });
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                const notStarted = getNotStartedDetails(error);
                if (notStarted) {
                    setRoomState(
                        notStarted.isHost
                            ? {
                                  status: "host-not-started",
                                  meetingId: notStarted.meetingId,
                                  isStarting: false,
                              }
                            : { status: "waiting-for-host" },
                    );
                    return;
                }
                setRoomState({
                    status: "error",
                    message: getApiErrorMessage(error),
                });
            });

        return () => {
            controller.abort();
        };
    }, [meetingCode, guestName, joinAttempt]);

    // While waiting for the host, try joining again every few seconds. Each failed
    // try sets a fresh "waiting-for-host" state, which schedules the next one.
    useEffect(() => {
        if (roomState.status !== "waiting-for-host") return;
        const timer = setTimeout(() => {
            setJoinAttempt((attempt) => {
                return attempt + 1;
            });
        }, WAITING_POLL_MS);
        return () => {
            clearTimeout(timer);
        };
    }, [roomState]);

    const rejoin = () => {
        setRoomState({ status: "joining" });
        setJoinAttempt((attempt) => {
            return attempt + 1;
        });
    };

    if (roomState.status === "joining") {
        return (
            <MeetingStatusScreen
                icon={
                    <LoaderCircle className="size-8 motion-safe:animate-spin" />
                }
                title="Joining meeting…"
            />
        );
    }

    if (roomState.status === "waiting-for-host") {
        return (
            <MeetingStatusScreen
                icon={
                    <LoaderCircle className="size-8 motion-safe:animate-spin" />
                }
                title="Waiting for the host"
                description="The meeting hasn’t started yet. You’ll join automatically when the host starts it."
                actions={<BackHomeButton />}
            />
        );
    }

    if (roomState.status === "host-not-started") {
        const { meetingId, isStarting } = roomState;

        const handleStartMeeting = async () => {
            setRoomState({ ...roomState, isStarting: true, error: undefined });
            try {
                await startMeeting(meetingId);
                rejoin();
            } catch (error) {
                setRoomState({
                    status: "host-not-started",
                    meetingId,
                    isStarting: false,
                    error: getApiErrorMessage(error),
                });
            }
        };

        return (
            <MeetingStatusScreen
                icon={<CalendarClock className="size-8" strokeWidth={1.75} />}
                title="This meeting hasn’t started"
                description={
                    roomState.error ??
                    "You’re the host. Start it so people can join."
                }
                actions={
                    <>
                        <Button
                            type="button"
                            disabled={isStarting}
                            onClick={() => {
                                void handleStartMeeting();
                            }}
                            className={BUTTON_CLASS}
                        >
                            {isStarting && (
                                <LoaderCircle className="motion-safe:animate-spin" />
                            )}
                            {isStarting ? "Starting…" : "Start meeting"}
                        </Button>
                        <BackHomeButton />
                    </>
                }
            />
        );
    }

    if (roomState.status === "left") {
        return (
            <MeetingStatusScreen
                icon={<LogOut className="size-8" strokeWidth={1.75} />}
                title="You left the meeting"
                actions={
                    <>
                        <Button
                            type="button"
                            onClick={rejoin}
                            className={BUTTON_CLASS}
                        >
                            Rejoin
                        </Button>
                        <BackHomeButton />
                    </>
                }
            />
        );
    }

    if (roomState.status === "ended-by-you") {
        return (
            <MeetingStatusScreen
                icon={<PhoneOff className="size-8" strokeWidth={1.75} />}
                title="You ended the meeting"
                description="Everyone has been removed from the call."
                actions={<BackHomeButton />}
            />
        );
    }

    if (roomState.status === "ended-by-host") {
        return (
            <MeetingStatusScreen
                icon={<PhoneOff className="size-8" strokeWidth={1.75} />}
                title="The host ended the meeting"
                actions={<BackHomeButton />}
            />
        );
    }

    if (roomState.status === "error") {
        return (
            <MeetingStatusScreen
                icon={<CircleAlert className="size-8" strokeWidth={1.75} />}
                title="Couldn’t join the meeting"
                description={roomState.message}
                actions={
                    <>
                        <Button
                            type="button"
                            onClick={rejoin}
                            className={BUTTON_CLASS}
                        >
                            Try again
                        </Button>
                        {isGuest && <SignInButton />}
                        <BackHomeButton />
                    </>
                }
            />
        );
    }

    const { connection } = roomState;
    const isHost = connection.role === "host";

    const handleDisconnected = (reason?: DisconnectReason) => {
        if (reason === DisconnectReason.CLIENT_INITIATED) {
            // The user pressed Leave. For the host the server ends the meeting for everyone.
            leaveMeeting(connection.meeting._id, connection.guest_id).catch(
                (error) => {
                    console.warn(
                        "Failed to record leaving the meeting:",
                        error,
                    );
                },
            );
            setRoomState({ status: isHost ? "ended-by-you" : "left" });
            return;
        }
        if (reason === DisconnectReason.ROOM_DELETED) {
            setRoomState({ status: "ended-by-host" });
            return;
        }
        if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
            setRoomState({
                status: "error",
                message:
                    "You joined this meeting from another tab or device, so this one was disconnected.",
            });
            return;
        }
        setRoomState({
            status: "error",
            message: "You were disconnected from the meeting.",
        });
    };

    // onError also fires when the camera or mic can't be turned on; the call still
    // works then, so only a failed connection ends it.
    const handleError = (error: Error) => {
        console.error("LiveKit error:", error);
        if (error instanceof ConnectionError) {
            setRoomState({
                status: "error",
                message: "Couldn’t connect to the call. Check your connection.",
            });
        }
    };

    return (
        <div className="dark flex h-dvh flex-col bg-background">
            <LiveKitRoom
                serverUrl={connection.url}
                token={connection.token}
                connect
                audio
                video
                onDisconnected={handleDisconnected}
                onError={handleError}
                onMediaDeviceFailure={(failure, kind) => {
                    console.warn("Media device failure:", kind, failure);
                }}
                data-lk-theme="default"
                className="flex min-h-0 flex-1 flex-col"
            >
                {/* Krisp noise cancellation, always on; renders nothing. */}
                <NoiseFilter />
                <MeetingHeader
                    title={connection.meeting.title}
                    meetingCode={connection.meeting.meeting_code}
                />
                <div className="min-h-0 flex-1">
                    <VideoConference />
                </div>
            </LiveKitRoom>
        </div>
    );
}

// Route element for /meet/:meetingCode, open to everyone. Guests pick a name
// first; signed-in users join straight away. Keyed by the code so moving to
// another meeting starts fresh.
export default function MeetingPage() {
    const params = useParams();
    const meetingCode = parseMeetingCode(params.meetingCode ?? "");
    const isSignedIn = useAppSelector((state) => {
        return state.user.user !== null;
    });
    const [guestName, setGuestName] = useState<string | null>(null);

    if (!meetingCode) {
        return (
            <MeetingStatusScreen
                icon={<CircleAlert className="size-8" strokeWidth={1.75} />}
                title="That meeting link isn’t valid"
                description="Check the code and try again. Codes look like abc-defg-hij."
                actions={<BackHomeButton />}
            />
        );
    }

    if (isSignedIn) {
        return <MeetingRoom key={meetingCode} meetingCode={meetingCode} />;
    }

    if (guestName === null) {
        return (
            <GuestPreJoin
                meetingCode={meetingCode}
                signInFrom={getMeetingPath(meetingCode)}
                onJoin={setGuestName}
            />
        );
    }

    return (
        <MeetingRoom
            key={meetingCode}
            meetingCode={meetingCode}
            guestName={guestName}
        />
    );
}
