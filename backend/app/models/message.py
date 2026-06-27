"""
SQLAlchemy Message model for storing individual messages within a conversation.
Supports multi-channel roles (user/assistant/system) and AI metadata.
"""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(
        String(15), nullable=False
    )  # "user", "assistant", "system"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # "sms", "social", "voice"

    # Voice / audio
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_voice_ready: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # AI metadata (model, latency, tokens, rag_hits, etc.)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    # Streaming / partial states
    is_streaming: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_error: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<Message {self.id} [{self.role}] in conv {self.conversation_id}>"