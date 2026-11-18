import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { getJoinToken, type JoinConnection } from "../api/room";

type Props = {
    defaultRoom: string;
    onJoined: (conn: JoinConnection, roomName: string) => void;
};

export default function JoinForm({ defaultRoom, onJoined }: Props) {
    const [name, setName] = useState("");
    const [roomName, setRoomName] = useState(defaultRoom);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const conn = await getJoinToken(roomName.trim(), name.trim());
            onJoined(conn, roomName.trim());
        } catch (err) {
            setError(
                isAxiosError(err)
                    ? (err.response?.data?.message ?? err.message)
                    : "Something went wrong",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-6"
            >
                <h1 className="text-3xl font-bold text-yellow-600">Koel</h1>
                <p className="text-sm text-neutral-400">
                    Join a room to start a call. Share the room name with someone to
                    call them.
                </p>

                <label className="block space-y-1">
                    <span className="text-sm text-neutral-300">Your name</span>
                    <input
                        required
                        maxLength={64}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-yellow-600"
                        placeholder="Akshay"
                    />
                </label>

                <label className="block space-y-1">
                    <span className="text-sm text-neutral-300">Room</span>
                    <input
                        required
                        maxLength={128}
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-yellow-600"
                        placeholder="test-room"
                    />
                </label>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-yellow-600 py-2 font-semibold text-black hover:bg-yellow-500 disabled:opacity-50"
                >
                    {loading ? "Joining…" : "Join call"}
                </button>
            </form>
        </main>
    );
}
