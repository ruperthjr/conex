"""
Centralised configuration using pydantic-settings.
Loads values from environment variables / .env file.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # ─── Application metadata ────────────────────────────────────────────
    APP_NAME: str = "Conexiaa AI Bridge"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ─── Database ────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/conexiaa",
        description="Async database connection string for SQLAlchemy.",
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_ECHO: bool = False

    # ─── JWT Authentication ──────────────────────────────────────────────
    JWT_SECRET: str = Field(
        default="super-secret-key-change-in-production",
        description="Secret key used to sign JWT tokens.",
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── Partner Integrations ────────────────────────────────────────────
    ELEVENLABS_API_KEY: str = Field(default="", description="ElevenLabs API key for TTS.")
    FEATHERLESS_API_URL: str = Field(
        default="https://api.featherless.ai/v1",
        description="Base URL for Featherless AI API.",
    )
    ZERNIO_CLIENT_ID: str = Field(default="", description="Zernio OAuth client ID.")
    ZERNIO_CLIENT_SECRET: str = Field(default="", description="Zernio OAuth client secret.")
    ZERNIO_REDIRECT_URI: str = Field(
        default="http://localhost:3000/channels/callback",
        description="OAuth redirect URI for Zernio.",
    )

    # ─── Redis (optional) ────────────────────────────────────────────────
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for caching / background tasks.",
    )

    # ─── WebSocket ───────────────────────────────────────────────────────
    WS_PING_INTERVAL_SECONDS: int = 30
    WS_PING_TIMEOUT_SECONDS: int = 10

    # ─── Logging ─────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",  # allow extra env vars for future use
    )


# Singleton instance
settings = Settings()


# ─── Testing ──────────────────────────────────
# 1. Copy the .env.example file to .env in the project root and fill in real keys.
# 2. All config values are accessible via `from app.core.config import settings`.
# 3. To override via command line: DATABASE_URL=postgresql://... uvicorn ...
# 4. Validate that settings.DATABASE_URL is correct before starting the app.