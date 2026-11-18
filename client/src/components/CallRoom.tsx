import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import type { JoinConnection } from "../api/room";

type Props = {
    connection: JoinConnection;
    onLeave: () => void;
};

// LiveKitRoom connects to the room and publishes mic + camera.
// VideoConference is LiveKit's prebuilt UI: participant grid, mute/camera/
// screen-share controls, chat, and a Leave button.
export default function CallRoom({ connection, onLeave }: Props) {
    return (
        <LiveKitRoom
            serverUrl={connection.url}
            token={connection.token}
            connect
            audio
            video
            onDisconnected={onLeave}
            onError={(err) => console.error("LiveKit error:", err)}
            data-lk-theme="default"
            style={{ height: "100dvh" }}
        >
            <VideoConference />
        </LiveKitRoom>
    );
}
