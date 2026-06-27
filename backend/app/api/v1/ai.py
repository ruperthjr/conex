"""
AI endpoints for Featherless AI text generation, ElevenLabs TTS, RAG retrieval,
and unified chat (Featherless + RAG + ElevenLabs).
Used by the AI Bridge frontend pages.
"""

import time
import logging
from typing import List

from fastapi import APIRouter, HTTPException, status

from app.schemas.ai import (
    FeatherlessRequest,
    FeatherlessResponse,
    ElevenLabsRequest,
    ElevenLabsResponse,
    RAGRequest,
    RAGResponse,
    RAGContext,
    AIChatRequest,
    AIChatResponse,
)
from app.services.featherless_service import generate_featherless_response
from app.services.elevenlabs_service import generate_elevenlabs_audio
from app.services.rag_service import retrieve_rag_contexts

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Featherless AI ──────────────────────────────────────────────────────

@router.post("/featherless", response_model=FeatherlessResponse)
async def featherless_generate(request: FeatherlessRequest):
    """
    Generate a text response using a Featherless AI model.
    Optionally enhances with RAG contexts if channel is provided.
    """
    try:
        start = time.perf_counter()
        # Optionally fetch RAG contexts
        rag_contexts: List[RAGContext] = []
        if request.channel:
            try:
                rag_response = await retrieve_rag_contexts(
                    query=request.prompt,
                    top_k=3,
                    channel=request.channel,
                )
                rag_contexts = rag_response.contexts
            except Exception as e:
                logger.warning(f"RAG retrieval failed (non‑critical): {e}")

        text, tokens_used = await generate_featherless_response(
            prompt=request.prompt,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            rag_contexts=rag_contexts,
        )
        latency = (time.perf_counter() - start) * 1000

        return FeatherlessResponse(
            text=text,
            model=request.model,
            latency_ms=round(latency, 1),
            tokens_used=tokens_used,
            rag_contexts=rag_contexts if rag_contexts else None,
        )
    except Exception as e:
        logger.exception("Featherless generation failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Featherless AI error: {str(e)}",
        )


# ─── ElevenLabs TTS ──────────────────────────────────────────────────────

@router.post("/elevenlabs", response_model=ElevenLabsResponse)
async def elevenlabs_tts(request: ElevenLabsRequest):
    """
    Synthesise speech from text using ElevenLabs TTS.
    Returns the URL of the generated audio file.
    """
    try:
        audio_url, duration = await generate_elevenlabs_audio(
            text=request.text,
            voice=request.voice,
        )
        return ElevenLabsResponse(
            audio_url=audio_url,
            duration_seconds=round(duration, 2),
            voice=request.voice,
        )
    except Exception as e:
        logger.exception("ElevenLabs TTS failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ElevenLabs error: {str(e)}",
        )


# ─── RAG Retrieval ───────────────────────────────────────────────────────

@router.post("/rag", response_model=RAGResponse)
async def rag_retrieve(request: RAGRequest):
    """
    Retrieve relevant knowledge base contexts for a query using PGVector/FAISS.
    """
    try:
        contexts = await retrieve_rag_contexts(
            query=request.query,
            top_k=request.top_k,
            channel=request.channel,
        )
        return RAGResponse(contexts=contexts)
    except Exception as e:
        logger.exception("RAG retrieval failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG error: {str(e)}",
        )


# ─── Unified AI Chat (Featherless + RAG + optional ElevenLabs) ─────────

@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest):
    """
    Process a chat message through the full AI pipeline:
    RAG → Featherless generation → (optionally) ElevenLabs TTS.
    """
    try:
        start = time.perf_counter()

        # 1. Retrieve RAG contexts
        rag_contexts = []
        try:
            rag_response = await retrieve_rag_contexts(
                query=request.content,
                top_k=3,
                channel=request.channel,
            )
            rag_contexts = rag_response.contexts
        except Exception as e:
            logger.warning(f"RAG failed for chat: {e}")

        # 2. Generate AI response
        response_text, tokens_used = await generate_featherless_response(
            prompt=request.content,
            model=request.model,
            temperature=0.7,
            max_tokens=512,
            rag_contexts=rag_contexts,
        )

        latency = (time.perf_counter() - start) * 1000

        # 3. (Optional) Generate voice
        audio_url = None
        try:
            audio_result = await generate_elevenlabs_audio(
                text=response_text[:500],  # limit length
                voice="rachel",
            )
            audio_url = audio_result[0]
        except Exception as e:
            logger.warning(f"ElevenLabs TTS failed for chat: {e}")

        return AIChatResponse(
            message_id=None,  # will be set by the caller (messaging endpoint)
            response_text=response_text,
            model=request.model,
            latency_ms=round(latency, 1),
            tokens_used=tokens_used,
            rag_contexts=rag_contexts,
            audio_url=audio_url,
        )
    except Exception as e:
        logger.exception("AI chat pipeline failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI chat error: {str(e)}",
        )


# ─── Testing ───────────────────────────────
# 1. Set environment variables for Featherless API key and ElevenLabs API key.
# 2. Run the backend: uvicorn backend.main:app --reload
# 3. Test Featherless:
#    curl -X POST http://localhost:8000/api/v1/ai/featherless \
#      -H "Content-Type: application/json" \
#      -d '{"prompt":"How do I reset my password?","model":"deepseek-r1","channel":"sms"}'
# 4. Test ElevenLabs:
#    curl -X POST http://localhost:8000/api/v1/ai/elevenlabs \
#      -H "Content-Type: application/json" \
#      -d '{"text":"Hello world","voice":"rachel"}'
# 5. Test RAG:
#    curl -X POST http://localhost:8000/api/v1/ai/rag \
#      -H "Content-Type: application/json" \
#      -d '{"query":"password reset","top_k":3}'
# 6. Test unified chat:
#    curl -X POST http://localhost:8000/api/v1/ai/chat \
#      -H "Content-Type: application/json" \
#      -d '{"conversation_id":"...","content":"I have a billing issue","channel":"sms"}'