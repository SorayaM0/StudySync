from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.core.websocket_manager import manager
from app.models.membership import Membership
from app.models.user import User


router = APIRouter(
    tags=["WebSockets"],
)


@router.websocket("/ws/spaces/{space_id}")
async def study_space_websocket(
    websocket: WebSocket,
    space_id: int,
) -> None:
    token = websocket.query_params.get("token")

    if token is None:
        await websocket.close(
            code=1008,
            reason="Authentication required.",
        )
        return

    user_id = decode_access_token(token)

    if user_id is None:
        await websocket.close(
            code=1008,
            reason="Invalid or expired authentication token.",
        )
        return

    with SessionLocal() as db:
        user = db.get(User, user_id)

        if user is None:
            await websocket.close(
                code=1008,
                reason="User not found.",
            )
            return

        membership = db.scalar(
            select(Membership).where(
                Membership.space_id == space_id,
                Membership.user_id == user_id,
            )
        )

        if membership is None:
            await websocket.close(
                code=1008,
                reason="Study space access denied.",
            )
            return

    await manager.connect(
        space_id=space_id,
        websocket=websocket,
    )

    try:
        await manager.broadcast(
            space_id=space_id,
            message={
                "type": "presence.joined",
                "space_id": space_id,
                "user_id": user_id,
            },
        )

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(
            space_id=space_id,
            websocket=websocket,
        )

        await manager.broadcast(
            space_id=space_id,
            message={
                "type": "presence.left",
                "space_id": space_id,
                "user_id": user_id,
            },
        )