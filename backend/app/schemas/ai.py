"""
Pydantic v2 schemas for AI endpoints: Featherless AI, ElevenLabs TTS, and RAG.
Used by app/api/v1/ai.py and the corresponding services.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, validator


# ─── Common Types ────────────────────────────────────────────────────────
Channel = Literal["sms", "social", "voice"]


# ─── Featherless AI ──────────────────────────────────────────────────────
class FeatherlessRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000, description="User input text")
    model: str = Field(
        default="deepseek-r1",
        description="Model ID (e.g., deepseek-r1, qwen2.5-7b)",
        max_length=100,
    )
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=512, ge=1, le=4096)
    channel: Optional[Channel] = Field(default="sms", description="Source channel")


class FeatherlessResponse(BaseModel):
    text: str = Field(..., description="Generated response text")
    model: str
    latency_ms: float = Field(..., description="Response time in milliseconds")
    tokens_used: int
    rag_contexts: Optional[List["RAGContext"]] = Field(
        default=None, description="Retrieved contexts (if RAG was used)"
    )


# ─── ElevenLabs TTS ──────────────────────────────────────────────────────
class ElevenLabsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice: str = Field(
        default="rachel",
        description="Voice ID or name (e.g., 'rachel', 'adam')",
        max_length=100,
    )


class ElevenLabsResponse(BaseModel):
    audio_url: str = Field(..., description="URL to the generated MP3")
    duration_seconds: float
    voice: str


# ─── RAG (Retrieval-Augmented Generation) ────────────────────────────────
class RAGContext(BaseModel):
    id: str
    content: str
    similarity: float = Field(..., ge=0.0, le=1.0)
    source: str
    channel: Channel
    dataset: str


class RAGRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    top_k: int = Field(default=5, ge=1, le=20)
    channel: Optional[Channel] = None  # optional filter


class RAGResponse(BaseModel):
    contexts: List[RAGContext]


# ─── Unified AI Chat (used by the chat page) ─────────────────────────────
class AIChatRequest(BaseModel):
    conversation_id: str = Field(..., description="UUID of the conversation")
    content: str = Field(..., min_length=1, max_length=4000)
    channel: Channel = "sms"
    model: str = Field(default="deepseek-r1", max_length=100)


class AIChatResponse(BaseModel):
    message_id: str
    response_text: str
    model: str
    latency_ms: float
    tokens_used: int
    rag_contexts: List[RAGContext] = []
    audio_url: Optional[str] = None  # ElevenLabs voice if generated