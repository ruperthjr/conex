"""
Conexiaa Backend – FastAPI application entry point.

World-class AI Communication Bridge unifying SMS, social (Zernio),
voice (ElevenLabs) with Featherless AI, RAG, SFT, and real-time WebSocket.

Run with:
    uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ─── Internal modules ─────────────────────────────────────────────────────
from app.core.config import settings
from app.core.database import engine, Base, get_session
from app.api.v1 import auth, conversations, messages, ai
from app.api import websocket

# ─── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("conexiaa")

# ─── Application lifespan ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: create database tables, initialise connections.
    Shutdown: dispose connection pool.
    """
    logger.info("🚀 Conexiaa backend starting up...")
    # In a full production setup you'd run Alembic migrations here,
    # but for hackathon speed we auto‑create tables for convenience.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables ready")
    yield
    # Shutdown
    await engine.dispose()
    logger.info("🛑 Database connections closed")

# ─── FastAPI application ──────────────────────────────────────────────────
app = FastAPI(
    title="Conexiaa AI Communication Bridge",
    version="1.0.0",
    description="API for multi‑channel AI messaging with Featherless, ElevenLabs, and RAG.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────
# Allow the Next.js frontend (localhost:3000) and any demo origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://conexiaa.vercel.app",  # production example
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global exception handlers ────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )

# ─── Health check ─────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def root():
    return {
        "status": "ok",
        "service": "Conexiaa API",
        "version": app.version,
        "docs": "/docs",
    }

@app.get("/health", tags=["health"])
async def health():
    return {"status": "healthy"}

# ─── API Routers ──────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["Conversations"])
app.include_router(messages.router, prefix="/api/v1/messages", tags=["Messages"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])

# If running directly (optional for local development)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )


# ─── Testing ──────────────────────────────────
"""
1. Ensure all required packages are installed:
   pip install -r backend/requirements.txt

2. Start the backend:
   uvicorn backend.main:app --reload --port 8000

3. Test health endpoint:
   curl http://localhost:8000/health
   → {"status":"healthy"}

4. Interactive API docs:
   Open http://localhost:8000/docs

5. WebSocket test:
   Connect to ws://localhost:8000/ws/chat/<conversation_id> from the frontend.

6. Authentication endpoints:
   POST /api/v1/auth/register   body: { "name": "Test", "email": "test@example.com", "password": "123456" }
   POST /api/v1/auth/login      body: { "email": "test@example.com", "password": "123456" }

7. Conversations:
   GET /api/v1/conversations   (requires Authorization header with Bearer token)
   POST /api/v1/conversations  body: { "title": "...", "channel": "sms", "contact_name": "..." }

8. Messages:
   POST /api/v1/messages       body: { "conversation_id": "...", "content": "...", "channel": "sms" }
   GET /api/v1/messages?conversation_id=...

9. AI generation:
   POST /api/v1/ai/featherless body: { "prompt": "...", "model": "deepseek-r1" }
   POST /api/v1/ai/elevenlabs   body: { "text": "Hello world", "voice": "rachel" }
"""