import axios from "axios";

const http = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true,
});

export type JoinConnection = {
    token: string;
    url: string;
};

export async function getJoinToken(roomName: string, name: string) {
    const { data } = await http.post<JoinConnection>("/api/rooms/token", {
        roomName,
        name,
    });
    return data;
}
