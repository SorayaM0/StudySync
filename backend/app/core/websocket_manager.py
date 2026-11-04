from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[
            int,
            list[WebSocket],
        ] = {}

    async def connect(
        self,
        space_id: int,
        websocket: WebSocket,
    ) -> None:
        await websocket.accept()

        if space_id not in self.active_connections:
            self.active_connections[space_id] = []

        self.active_connections[space_id].append(websocket)

    def disconnect(
        self,
        space_id: int,
        websocket: WebSocket,
    ) -> None:
        connections = self.active_connections.get(space_id)

        if connections is None:
            return

        if websocket in connections:
            connections.remove(websocket)

        if not connections:
            del self.active_connections[space_id]

    async def broadcast(
        self,
        space_id: int,
        message: dict,
    ) -> None:
        connections = self.active_connections.get(
            space_id,
            [],
        )

        disconnected: list[WebSocket] = []

        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(
                space_id=space_id,
                websocket=connection,
            )


manager = ConnectionManager()