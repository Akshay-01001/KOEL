import axios from "axios";
import { useEffect } from "react";

export default function App() {
    useEffect(() => {
        const fetchIceServers = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/ice-servers`,
                );
                console.log(response);
            } catch {
                return [];
            }
        };

        fetchIceServers();
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-black">
            <h1 className="text-5xl font-bold text-yellow-600">Hello Koel</h1>
        </main>
    );
}
