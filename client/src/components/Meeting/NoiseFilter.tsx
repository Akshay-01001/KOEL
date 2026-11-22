import { useEffect } from "react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";

// Turns on LiveKit's Krisp noise cancellation for this user's microphone as soon
// as they're in the call; there's no on/off control. It cleans up their audio
// before others hear it. Must be inside LiveKitRoom. Renders nothing.
//
// Krisp only runs on LiveKit Cloud and in supported browsers. Anywhere else the
// hook logs a warning and the browser's built-in noise suppression (on by
// default in livekit-client) keeps working as before.
export default function NoiseFilter() {
    const { setNoiseFilterEnabled } = useKrispNoiseFilter();

    // The hook waits for the mic to be published, so this can run right away.
    useEffect(() => {
        void setNoiseFilterEnabled(true);
    }, [setNoiseFilterEnabled]);

    return null;
}
