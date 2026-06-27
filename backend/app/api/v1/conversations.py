"""
Conversation management endpoints.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.crud.conversation import (
    create_conversation,
    get_conversation,
    get_conversations,
    update_conversation,
    delete_conversation,
    mark_as_read,
    update_last_message,
    increment_unread_count,
)

router = APIRouter()


# ─── Request Schemas ─────────────────────────────────────────────────────

class ConversationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    channel: str = Field(
        default="sms",
        pattern="^(sms|social|voice)$",
        description="Channel type: sms, social, voice",
    )
    contact_name: Optional[str] = Field(None, max_length=150)
    contact_phone: Optional[str] = Field(None, max_length=30)
    contact_social_handle: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[str] = Field(None, max_length=255)


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    channel: Optional[str] = Field(None, pattern="^(sms|social|voice)$")
    contact_name: Optional[str] = Field(None, max_length=150)
    contact_phone: Optional[str] = Field(None, max_length=30)
    contact_social_handle: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


# ─── Response Schemas ────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    channel: str
    audio_url: Optional[str] = None
    is_voice_ready: bool = False
    metadata: Optional[dict] = Field(None, alias="metadata_")
    is_streaming: bool = False
    is_error: bool = False
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, obj: Message) -> "MessageResponse":
        return cls(
            id=obj.id,
            role=obj.role,
            content=obj.content,
            channel=obj.channel,
            audio_url=obj.audio_url,
            is_voice_ready=obj.is_voice_ready,
            metadata=obj.metadata_,
            is_streaming=obj.is_streaming,
            is_error=obj.is_error,
            created_at=obj.created_at.isoformat(),
        )


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    channel: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_social_handle: Optional[str] = None
    contact_email: Optional[str] = None
    last_message: Optional[str] = None
    unread_count: int
    is_active: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, obj: Conversation) -> "ConversationResponse":
        return cls(
            id=obj.id,
            title=obj.title,
            channel=obj.channel,
            contact_name=obj.contact_name,
            contact_phone=obj.contact_phone,
            contact_social_handle=obj.contact_social_handle,
            contact_email=obj.contact_email,
            last_message=obj.last_message,
            unread_count=obj.unread_count,
            is_active=obj.is_active,
            created_at=obj.created_at.isoformat(),
            updated_at=obj.updated_at.isoformat(),
        )


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []


# ─── Endpoints ───────────────────────────────────────────────────────────

@router.post("/", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation_endpoint(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new conversation."""
    conv = await create_conversation(
        db,
        user_id=current_user.id,
        title=payload.title,
        channel=payload.channel,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        contact_social_handle=payload.contact_social_handle,
        contact_email=payload.contact_email,
    )
    return ConversationResponse.from_orm(conv)


@router.get("/", response_model=List[ConversationResponse])
async def list_conversations(
    channel: Optional[str] = Query(None, pattern="^(sms|social|voice)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List conversations for the authenticated user."""
    convs = await get_conversations(
        db,
        user_id=current_user.id,
        channel_filter=channel,
        skip=skip,
        limit=limit,
    )
    return [ConversationResponse.from_orm(c) for c in convs]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Get a single conversation with its messages."""
    conv = await get_conversation(db, conversation_id, current_user.id)
    # Eagerly load messages? Not needed with async; messages will be loaded via relationship.
    # We need to ensure messages are loaded. Since relationship is lazy, we can access it.
    # But to avoid lazy loading issues, we can load them manually.
    from sqlalchemy import select as sa_select
    from app.models.message import Message as MessageModel
    stmt = (
        sa_select(MessageModel)
        .where(MessageModel.conversation_id == conversation_id)
        .order_by(MessageModel.created_at)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()
    response = ConversationDetailResponse.from_orm(conv)
    response.messages = [MessageResponse.from_orm(m) for m in messages]
    return response


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation_endpoint(
    conversation_id: UUID,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update conversation fields."""
    conv = await update_conversation(
        db,
        conversation_id,
        current_user.id,
        **payload.dict(exclude_unset=True),
    )
    return ConversationResponse.from_orm(conv)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation_endpoint(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Delete a conversation and its messages."""
    await delete_conversation(db, conversation_id, current_user.id)
    return None


@router.post("/{conversation_id}/read", status_code=status.HTTP_200_OK)
async def mark_conversation_read(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Mark conversation as read (unread_count = 0)."""
    await get_conversation(db, conversation_id, current_user.id)  # existence check
    await mark_as_read(db, conversation_id)
    return {"detail": "Conversation marked as read"}


# ─── Testing ───────────────────────────────
# 1. Obtain a JWT token via /api/v1/auth/login.
# 2. Create a conversation: POST /api/v1/conversations/ with body {"title": "Support chat", "channel": "sms"}
# 3. List conversations: GET /api/v1/conversations/ (Authorization: Bearer <token>)
# 4. Get single: GET /api/v1/conversations/<uuid>
# 5. Update: PATCH /api/v1/conversations/<uuid> with {"title": "New title"}
# 6. Delete: DELETE /api/v1/conversations/<uuid>
# 7. Mark read: POST /api/v1/conversations/<uuid>/read