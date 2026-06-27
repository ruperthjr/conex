"""
SQLAlchemy User model for Conexiaa authentication.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
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

    def __repr__(self) -> str:
        return f"<User {self.email!r}>"

    @property
    def display_name(self) -> str:
        return self.name or self.email.split("@")[0]


# ─── Testing  ───────────────────────────────
# 1. This model is auto‑created by the lifespan hook in main.py.
# 2. To test manually, insert a user via a script or the register endpoint.
# 3. The auth endpoint (app/api/v1/auth.py) uses this model to create/query users.
# 4. Ensure the database is running and the connection string is correct.
# 5. Example query using the async session:
#    from app.models.user import User
#    from sqlalchemy import select
#    stmt = select(User).where(User.email == "demo@conexiaa.ai")
#    result = await db.execute(stmt)
#    user = result.scalar_one_or_none()