"""
SQLAlchemy Conversation model for multi-channel messaging.
Represents a unified conversation thread across SMS, social, and voice.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    # The user who owns this conversation
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[str] = mapped_column(
        String(20), nullable=False, default="sms"
    )  # "sms", "social", "voice"
    contact_name: Mapped[str] = mapped_column(String(150), nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(30), nullable=True)
    contact_social_handle: Mapped[str] = mapped_column(String(100), nullable=True)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=True)

    last_message: Mapped[str] = mapped_column(Text, nullable=True)
    unread_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

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
    user = relationship("User", backref="conversations")
    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Conversation {self.id} [{self.channel}]>"


# Import Message at the bottom to avoid circular imports
from app.models.message import Message


# ─── Testing ───────────────────────────────
# 1. This model is created in the database by the lifespan startup in main.py.
# 2. Use the Conversation CRUD (app/crud/conversation.py) to create/read/update.
# 3. Endpoints that use this model:
#    - POST /api/v1/conversations (create a new conversation)
#    - GET /api/v1/conversations (list user's conversations)
#    - GET /api/v1/conversations/{id} (get single conversation with messages)
# 4. WebSocket (api/websocket.py) references conversation_id.
# 5. The channel field aligns with front-end Channel type ("sms", "social", "voice").