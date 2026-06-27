"""
Message endpoints for reading and writing messages within a conversation.
"""

from typing import List, Optional
from uuid import UUID
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.crud.conversation import (
    update_last_message,
    increment_unread_count,
)

router = APIRouter()


# ─── Request Schemas ─────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    conversation_id: UUID
    role: str = Field("user", pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=5000)
    channel: str = Field("sms", pattern="^(sms|social|voice)$")
    audio_url: Optional[str] = None
    is_voice_ready: bool = False
    metadata: Optional[dict] = None  # model, latency, tokens, etc.


class MessageUpdate(BaseModel):
    content: Optional[str] = None
    is_voice_ready: Optional[bool] = None
    audio_url: Optional[str] = None
    is_streaming: Optional[bool] = None
    is_error: Optional[bool] = None
    metadata: Optional[dict] = None


# ─── Response Schema ─────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    channel: str
    audio_url: Optional[str]
    is_voice_ready: bool
    metadata: Optional[dict] = Field(None, alias="metadata_")
    is_streaming: bool
    is_error: bool
    created_at: str

    model_config = {"from_attributes": True, "populate_by_name": True}

    @classmethod
    def from_orm(cls, msg: Message) -> "MessageResponse":
        return cls(
            id=msg.id,
            conversation_id=msg.conversation_id,
            role=msg.role,
            content=msg.content,
            channel=msg.channel,
            audio_url=msg.audio_url,
            is_voice_ready=msg.is_voice_ready,
            metadata=msg.metadata_,
            is_streaming=msg.is_streaming,
            is_error=msg.is_error,
            created_at=msg.created_at.isoformat(),
        )


# ─── Helper: verify conversation ownership ───────────────────────────────

async def _verify_conversation_ownership(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID,
) -> Conversation:
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id,
    )
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conv


# ─── Endpoints ───────────────────────────────────────────────────────────

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new message in a conversation (user owns the conversation)."""
    await _verify_conversation_ownership(db, payload.conversation_id, current_user.id)

    msg = Message(
        conversation_id=payload.conversation_id,
        role=payload.role,
        content=payload.content,
        channel=payload.channel,
        audio_url=payload.audio_url,
        is_voice_ready=payload.is_voice_ready,
        metadata_=payload.metadata,
    )
    db.add(msg)
    await db.flush()

    # Update conversation preview and unread (if message is from user, increment unread)
    await update_last_message(db, payload.conversation_id, payload.content[:100])
    if payload.role == "user":
        await increment_unread_count(db, payload.conversation_id)

    await db.refresh(msg)
    return MessageResponse.from_orm(msg)


@router.get("/", response_model=List[MessageResponse])
async def list_messages(
    conversation_id: UUID = Query(..., description="Conversation UUID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List messages for a given conversation (oldest first)."""
    await _verify_conversation_ownership(db, conversation_id, current_user.id)

    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    msgs = result.scalars().all()
    return [MessageResponse.from_orm(m) for m in msgs]


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Retrieve a single message (must own the parent conversation)."""
    stmt = select(Message).where(Message.id == message_id)
    result = await db.execute(stmt)
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # Ensure parent conversation belongs to user
    await _verify_conversation_ownership(db, msg.conversation_id, current_user.id)

    return MessageResponse.from_orm(msg)


@router.patch("/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: UUID,
    payload: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update a message (e.g., mark as voice ready, update content)."""
    stmt = select(Message).where(Message.id == message_id)
    result = await db.execute(stmt)
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    await _verify_conversation_ownership(db, msg.conversation_id, current_user.id)

    # Apply updates
    update_dict = payload.dict(exclude_unset=True)
    for field, value in update_dict.items():
        if field == "metadata":
            msg.metadata_ = value
        else:
            setattr(msg, field, value)

    await db.flush()
    await db.refresh(msg)
    return MessageResponse.from_orm(msg)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Delete a message."""
    stmt = select(Message).where(Message.id == message_id)
    result = await db.execute(stmt)
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    await _verify_conversation_ownership(db, msg.conversation_id, current_user.id)

    await db.delete(msg)
    await db.flush()
    return None


# ─── Testing ───────────────────────────────
# 1. Get a JWT token from /api/v1/auth/login.
# 2. Create a conversation first (POST /api/v1/conversations).
# 3. Create a message: POST /api/v1/messages/ with body:
#    {"conversation_id": "...", "role": "user", "content": "Hello", "channel": "sms"}
# 4. List messages: GET /api/v1/messages/?conversation_id=...
# 5. Update a message: PATCH /api/v1/messages/<uuid> with {"is_voice_ready": true}
# 6. Delete: DELETE /api/v1/messages/<uuid>