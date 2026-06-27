"""
WebSocket endpoint for real-time chat events.
Manages connections per conversation and broadcasts events
(messages, typing, AI status, RAG contexts, channel switches).
"""

import asyncio
import json
import logging
from typing import Dict, Set, Optional
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError, jwt

from app.core.config import settings
from app.core.security import decode_token  # reuses JWT verification
from app.models.user import User
from app.schemas.ai import RAGContext

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Connection Manager ────────────────────────────────────────────────────

class ConnectionManager:
    """
    Manages active WebSocket connections grouped by conversation_id.
    Provides broadcast to all clients in a conversation and global broadcasts.
    """

    def __init__(self):
        # conversation_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, conversation_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(conversation_id, set()).add(websocket)
        logger.info(f"WebSocket connected to conversation {conversation_id}")

    async def disconnect(self, conversation_id: str, websocket: WebSocket):
        self.active_connections.get(conversation_id, set()).discard(websocket)
        if not self.active_connections.get(conversation_id):
            del self.active_connections[conversation_id]
        logger.info(f"WebSocket disconnected from conversation {conversation_id}")

    async def broadcast(
        self,
        conversation_id: str,
        event: str,
        data: dict,
        sender: Optional[WebSocket] = None,
    ):
        """
        Send a JSON message to every connection in the conversation.
        If `sender` is provided, it will be excluded (optional).
        """
        payload = json.dumps({"event": event, "data": data, "conversation_id": conversation_id})
        stale = set()
        for ws in self.active_connections.get(conversation_id, set()):
            if ws == sender:
                continue
            try:
                await ws.send_text(payload)
            except Exception:
                stale.add(ws)
        # Clean up stale connections
        for ws in stale:
            self.active_connections[conversation_id].discard(ws)

    async def send_personal(self, websocket: WebSocket, event: str, data: dict, conversation_id: str):
        """Send a message to a specific WebSocket client."""
        payload = json.dumps({"event": event, "data": data, "conversation_id": conversation_id})
        try:
            await websocket.send_text(payload)
        except Exception:
            await self.disconnect(conversation_id, websocket)


# Singleton manager
manager = ConnectionManager()


# ─── WebSocket Token Verification ─────────────────────────────────────────

async def get_user_from_ws_token(token: str) -> User:
    """
    Decode the JWT from the WebSocket query parameter and return the User.
    Raises an exception if token is invalid.
    """
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Missing sub claim")
        # In a full implementation we would fetch the user from DB.
        # For hackathon speed, we return a minimal user object.
        return User(id=user_id)  # minimal; actual code would query DB
    except Exception as e:
        raise ValueError("Invalid token") from e


# ─── WebSocket Endpoint ────────────────────────────────────────────────────

@router.websocket("/chat/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: UUID,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for a specific conversation.
    Requires a valid JWT token as query parameter (?token=...).
    Listens for events and broadcasts them to the conversation group.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
        return

    try:
        user = await get_user_from_ws_token(token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return

    conv_id_str = str(conversation_id)
    await manager.connect(conv_id_str, websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                event = msg.get("event")
                data = msg.get("data", {})

                if event == "message":
                    # When a user sends a message, broadcast to all others in conversation
                    await manager.broadcast(conv_id_str, "message", data, sender=websocket)

                elif event == "typing":
                    await manager.broadcast(conv_id_str, "typing", data, sender=websocket)

                elif event == "rag_context":
                    # Typically server sends this, but if client pushes we broadcast
                    await manager.broadcast(conv_id_str, "rag_context", data, sender=websocket)

                elif event == "ai_status":
                    await manager.broadcast(conv_id_str, "ai_status", data, sender=websocket)

                elif event == "channel_switch":
                    await manager.broadcast(conv_id_str, "channel_switch", data, sender=websocket)

                elif event == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))

                else:
                    logger.warning(f"Unknown WebSocket event: {event}")

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"event": "error", "data": {"detail": "Invalid JSON"}}))

    except WebSocketDisconnect:
        await manager.disconnect(conv_id_str, websocket)
    except Exception as e:
        logger.exception(f"WebSocket error for conversation {conversation_id}")
        await manager.disconnect(conv_id_str, websocket)
        if not websocket.client_state == "DISCONNECTED":
            await websocket.close()


# ─── Helper to push server‑side events (used by AI services) ──────────────

async def push_event_to_conversation(conversation_id: str, event: str, data: dict):
    """
    Send an event to all WebSocket clients in a conversation.
    Can be imported and called from AI endpoints, e.g. when AI streaming or voice is ready.
    """
    await manager.broadcast(conversation_id, event, data)


# ─── Testing  ───────────────────────────────
# 1. Obtain a JWT token by logging in (POST /api/v1/auth/login).
# 2. Open a WebSocket connection to:
#    ws://localhost:8000/ws/chat/<conversation_id>?token=<your_token>
# 3. Send a message event:
#    {"event":"message","data":{"content":"Hello","role":"user","channel":"sms"}}
# 4. Other clients connected to the same conversation will receive the broadcast.
# 5. Send typing: {"event":"typing","data":{"isTyping":true}}
# 6. The server may push ai_status or rag_context events via the helper.