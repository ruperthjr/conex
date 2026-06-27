"""
Pydantic v2 schemas for user authentication and serialisation.
Used by the auth endpoints (app/api/v1/auth.py).
"""

import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# ─── Base User Schema ────────────────────────────────────────────────────
class UserBase(BaseModel):
    email: EmailStr = Field(
        ..., examples=["user@example.com"], description="User email address"
    )
    name: str = Field(
        ..., min_length=2, max_length=150, examples=["Sarah Mitchell"]
    )


# ─── Registration ────────────────────────────────────────────────────────
class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        examples=["MySecret123!"],
        description="Account password (min 6 characters)",
    )
    confirm_password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        examples=["MySecret123!"],
        description="Must match password",
    )

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one letter and one digit")
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "UserCreate":
        if self.password != self.confirm_password:
            raise ValueError("passwords do not match")
        return self


# ─── Login ───────────────────────────────────────────────────────────────
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


# ─── Response Models ─────────────────────────────────────────────────────
class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Optional: Token payload for internal use ────────────────────────────
class TokenPayload(BaseModel):
    sub: UUID | None = None
    exp: int | None = None


# ─── Testing ───────────────────────────────
# 1. These schemas are used directly in app/api/v1/auth.py.
# 2. To test registration:
#    curl -X POST http://localhost:8000/api/v1/auth/register \
#      -H "Content-Type: application/json" \
#      -d '{"name":"Demo User","email":"demo@conexiaa.ai","password":"demo123","confirm_password":"demo123"}'
# 3. To test login:
#    curl -X POST http://localhost:8000/api/v1/auth/login \
#      -H "Content-Type: application/json" \
#      -d '{"email":"demo@conexiaa.ai","password":"demo123"}'
# 4. The response from login will include an access_token; use it in the
#    Authorization header for other endpoints.
# 5. Validators will reject weak passwords and mismatched confirmation.