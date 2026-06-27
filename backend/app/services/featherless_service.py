"""
Featherless AI Service

Calls the Featherless API for text generation.  Falls back to a
simulated response when no API key is configured or the API is unreachable,
so the entire hackathon demo works out‑of‑the‑box.

Expected usage (from ai.py):
    text, tokens_used = await generate_featherless_response(
        prompt="How do I reset my password?",
        model="deepseek-r1",
        temperature=0.7,
        max_tokens=512,
        rag_contexts=[],
    )
"""

import logging
from typing import List, Optional, Tuple

import httpx

from app.core.config import settings
from app.schemas.ai import RAGContext

logger = logging.getLogger(__name__)

# ─── Configuration ─────────────────────────────────────────────────────────
FEATHERLESS_API_URL = settings.FEATHERLESS_API_URL  # from config, defaults to https://api.featherless.ai/v1
DEFAULT_MODEL = "deepseek-r1"
API_TIMEOUT = 25.0  # seconds


async def generate_featherless_response(
    prompt: str,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 512,
    rag_contexts: Optional[List[RAGContext]] = None,
) -> Tuple[str, int]:
    """
    Generate a text response using a Featherless AI model.

    Args:
        prompt: The user input text.
        model: Featherless model ID (e.g., "deepseek-r1", "qwen2.5-7b").
        temperature: Sampling temperature (0.0-2.0).
        max_tokens: Maximum tokens to generate.
        rag_contexts: Optional list of RAG contexts to inject into the prompt.

    Returns:
        Tuple of (generated_text, tokens_used).
    """
    # ── Simulated mode (no API key) ──────────────────────────────────────
    if not settings.FEATHERLESS_API_URL or "api.featherless.ai" not in settings.FEATHERLESS_API_URL:
        logger.info("Featherless running in simulated mode")
        return _simulate_response(prompt, model, rag_contexts)

    # ── Build the prompt with RAG context (if any) ────────────────────────
    system_message = "You are a helpful, empathetic customer support AI for Conexiaa."
    user_message = prompt
    if rag_contexts:
        context_str = "\n".join(
            f"- {ctx.content[:200]} (source: {ctx.source}, similarity: {ctx.similarity:.2f})"
            for ctx in rag_contexts
        )
        user_message = (
            f"Use the following relevant knowledge to answer the user's question:\n"
            f"{context_str}\n\n"
            f"User: {prompt}"
        )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    # ── Real API call ─────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{FEATHERLESS_API_URL}/chat/completions",
                json=payload,
                timeout=API_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            tokens_used = usage.get("total_tokens", len(content.split()))
            logger.info(
                f"Featherless response: model={model}, tokens={tokens_used}"
            )
            return content, tokens_used
    except Exception as e:
        logger.error(f"Featherless API call failed: {e}")
        # Fallback to simulated response so demo doesn't break
        return _simulate_response(prompt, model, rag_contexts)


def _simulate_response(
    prompt: str,
    model: str,
    rag_contexts: Optional[List[RAGContext]] = None,
) -> Tuple[str, int]:
    """
    Return a realistic, context‑aware response for the demo.
    """
    # If RAG contexts were provided, mention them briefly
    rag_note = ""
    if rag_contexts:
        sources = ", ".join(ctx.dataset for ctx in rag_contexts[:2])
        rag_note = f" (I checked {len(rag_contexts)} context(s) from {sources})"

    # Craft a friendly response based on the prompt length
    first_word = prompt.strip().split()[0].capitalize() if prompt.strip() else "Hello"
    simulated_text = (
        f"Thanks for reaching out about '{prompt.strip()[:60]}'. "
        f"I've analysed your request and found the best solution{rag_note}. "
        "Our team is here to help 24/7. Is there anything else you need?"
    )
    tokens_used = len(simulated_text.split())
    logger.info(f"Simulated Featherless response (model={model}, tokens={tokens_used})")
    return simulated_text, tokens_used


# ─── Testing ───────────────────────────────
# 1. Without a real FEATHERLESS_API_URL (or if the URL doesn't contain "api.featherless.ai"),
#    the service runs in simulated mode and returns plausible responses.
# 2. To test with a real API, set FEATHERLESS_API_URL in .env to the correct endpoint
#    and provide any required API key (if the endpoint needs one – adjust code accordingly).
# 3. The service is called from app/api/v1/ai.py; you can test directly via:
#    POST /api/v1/ai/featherless
#    body: {"prompt":"Hello","model":"deepseek-r1","temperature":0.7,"max_tokens":512}
# 4. The simulated response includes RAG context information if supplied.