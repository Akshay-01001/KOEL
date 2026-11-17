type Message<Events> = {
    [K in keyof Events]: { type: K; payload: Events[K] };
}[keyof Events];

export type Peer = { userId: string; name: string };

export type ClientToServerEvents = {
    create_room: { userId: string; username: string };
    join_room: { roomId: string; userId: string; username: string };
    leave_room: { userId: string };
};

export type ClientMessage = Message<ClientToServerEvents>;
export type ClientEventType = keyof ClientToServerEvents;

export type ServerToClientEvents = {
    joined: { roomId: string; userId: string; peers: Peer[] };
    peer_joined: Peer;
    peer_left: { userId: string };
    room_not_found: { message: string };
    already_joined: { message: string };
    error: { message: string };
};

export type ServerMessage = Message<ServerToClientEvents>;
export type ServerEventType = keyof ServerToClientEvents;
