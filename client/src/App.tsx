import { useState } from "react";
import JoinForm from "./components/JoinForm";
import CallRoom from "./components/CallRoom";
import type { JoinConnection } from "./api/room";

// The room name lives in the URL (?room=...) so a call link can be shared.
const roomFromUrl = () =>
    new URLSearchParams(window.location.search).get("room") ?? "test-room";

export default function App() {
    const [connection, setConnection] = useState<JoinConnection | null>(null);

    if (!connection) {
        return (
            <JoinForm
                defaultRoom={roomFromUrl()}
                onJoined={(conn, roomName) => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("room", roomName);
                    window.history.replaceState(null, "", url);
                    setConnection(conn);
                }}
            />
        );
    }

    return (
        <CallRoom connection={connection} onLeave={() => setConnection(null)} />
    );
}
