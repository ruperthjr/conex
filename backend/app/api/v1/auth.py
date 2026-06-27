"""
Auth endpoints for Conexiaa: user registration and login.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_session),
):
    """
    Register a new user.
    Returns the created user object (without password).
    """
    # Check if email already registered
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    # Create user
    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_session),
):
    """
    Authenticate user and return a JWT access token.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token)


# ─── Testing ───────────────────────────────
# 1. Ensure the database is running and user table exists.
# 2. Test registration:
#    curl -X POST http://localhost:8000/api/v1/auth/register \
#      -H "Content-Type: application/json" \
#      -d '{"name":"Demo User","email":"demo@conexiaa.ai","password":"demo123","confirm_password":"demo123"}'
# 3. Test login:
#    curl -X POST http://localhost:8000/api/v1/auth/login \
#      -H "Content-Type: application/json" \
#      -d '{"email":"demo@conexiaa.ai","password":"demo123"}'
# 4. Use the returned access_token in subsequent requests as Authorization: Bearer <token>.