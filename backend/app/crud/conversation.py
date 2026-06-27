"""
Async CRUD operations for the Conversation model.
Used by the conversations API endpoints (app/api/v1/conversations.py).
"""

import uuid
from typing import List, Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy import select, update, delete, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message


# ─── Helpers ─────────────────────────────────────────────────────────────

async def _get_conv_and_verify_owner(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Conversation:
    """Fetch a conversation by ID and verify the requesting user owns it."""
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


# ─── Create ──────────────────────────────────────────────────────────────

async def create_conversation(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    channel: str = "sms",
    contact_name: Optional[str] = None,
    contact_phone: Optional[str] = None,
    contact_social_handle: Optional[str] = None,
    contact_email: Optional[str] = None,
) -> Conversation:
    """Create a new conversation for a user."""
    conv = Conversation(
        user_id=user_id,
        title=title,
        channel=channel,
        contact_name=contact_name,
        contact_phone=contact_phone,
        contact_social_handle=contact_social_handle,
        contact_email=contact_email,
    )
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return conv


# ─── Read ────────────────────────────────────────────────────────────────

async def get_conversation(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Conversation:
    """Return a single conversation owned by the user."""
    return await _get_conv_and_verify_owner(db, conversation_id, user_id)


async def get_conversations(
    db: AsyncSession,
    user_id: uuid.UUID,
    channel_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Sequence[Conversation]:
    """List conversations for a user, optionally filtered by channel."""
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
    )
    if channel_filter:
        stmt = stmt.where(Conversation.channel == channel_filter)
    stmt = stmt.order_by(desc(Conversation.updated_at))
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


# ─── Update ──────────────────────────────────────────────────────────────

async def update_conversation(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
    **kwargs,
) -> Conversation:
    """Partially update a conversation's fields."""
    conv = await _get_conv_and_verify_owner(db, conversation_id, user_id)

    # Only update allowed fields
    allowed_fields = {
        "title",
        "channel",
        "contact_name",
        "contact_phone",
        "contact_social_handle",
        "contact_email",
        "is_active",
    }
    for key, value in kwargs.items():
        if key in allowed_fields and value is not None:
            setattr(conv, key, value)

    await db.flush()
    await db.refresh(conv)
    return conv


async def update_last_message(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    last_message: str,
) -> None:
    """Update the last_message preview and bump updated_at."""
    stmt = (
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(last_message=last_message, updated_at=func.now())
    )
    await db.execute(stmt)


async def increment_unread_count(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    amount: int = 1,
) -> None:
    """Increment the unread count for a conversation."""
    stmt = (
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(unread_count=Conversation.unread_count + amount)
    )
    await db.execute(stmt)


async def mark_as_read(
    db: AsyncSession,
    conversation_id: uuid.UUID,
) -> None:
    """Reset the unread count to zero."""
    stmt = (
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(unread_count=0)
    )
    await db.execute(stmt)


# ─── Delete ──────────────────────────────────────────────────────────────

async def delete_conversation(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Delete a conversation (and cascade its messages)."""
    conv = await _get_conv_and_verify_owner(db, conversation_id, user_id)
    await db.delete(conv)
    await db.flush()


# ─── Testing ────────────────────────────────
# 1. These functions are used in the conversations endpoint.
# 2. Example usage in api/v1/conversations.py:
#    conv = await create_conversation(db, current_user.id, title="Support chat", channel="sms")
# 3. The helper `_get_conv_and_verify_owner` ensures only the owner can access.
# 4. `update_last_message` and `increment_unread_count` should be called after creating a new message.