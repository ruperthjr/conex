"""
Async RAG retriever that embeds a query, searches the FAISS index,
and returns the most relevant knowledge‑base contexts with full metadata.

Connects to:
- vector_store.py for FAISS search
- data/processed/unified_messages.csv for per‑message metadata
- rag_service.py uses retrieve_contexts()
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

from app.rag.vector_store import vector_store as vs

logger = logging.getLogger(__name__)

# ─── Paths ──────────────────────────────────────────────────────────────
UNIFIED_CSV_PATH = Path("data/processed/unified_messages.csv")

# ─── Embedding model (same as used during ingestion) ────────────────────
_EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
_embed_model: Optional[SentenceTransformer] = None


def _get_embed_model() -> SentenceTransformer:
    """Lazy‑load the sentence transformer model (cached after first call)."""
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer(_EMBEDDING_MODEL_NAME)
    return _embed_model


# ─── Metadata cache ─────────────────────────────────────────────────────
_metadata_df: Optional[pd.DataFrame] = None


def _load_metadata_df() -> pd.DataFrame:
    """
    Load the processed unified messages CSV containing columns:
    text, platform, source, ... as produced by ingest_datasets.py.
    """
    global _metadata_df
    if _metadata_df is None:
        if UNIFIED_CSV_PATH.exists():
            try:
                df = pd.read_csv(UNIFIED_CSV_PATH)
                # Ensure required columns exist
                for col in ("text", "source", "platform"):
                    if col not in df.columns:
                        # Map platform to channel if only 'platform' exists
                        if col == "channel" and "platform" in df.columns:
                            df["channel"] = df["platform"]
                        else:
                            raise KeyError(f"Missing column {col}")
                _metadata_df = df
                logger.info(f"Loaded metadata for {len(df)} messages")
            except Exception as e:
                logger.error(f"Failed to load metadata CSV: {e}")
                _metadata_df = pd.DataFrame()
        else:
            logger.warning("unified_messages.csv not found – metadata will be empty")
            _metadata_df = pd.DataFrame()
    return _metadata_df


# ─── Public API ─────────────────────────────────────────────────────────

async def retrieve_contexts(
    query: str,
    top_k: int = 5,
    channel: Optional[str] = None,
) -> List[Dict]:
    """
    Retrieve the top‑k most similar knowledge base entries for a query.

    Args:
        query: The user's search string.
        top_k: Number of contexts to return.
        channel: Optional channel filter ("sms", "social", "voice").
                 If provided, only contexts from that channel are returned.

    Returns:
        List of dicts with keys:
            id, content, similarity, source, channel, dataset
    """
    # Ensure vector store is loaded (returns empty results if no index)
    if not vs._ensure_loaded():
        logger.warning("Vector store not available – returning empty results")
        return []

    # Embed the query
    model = _get_embed_model()
    try:
        query_embedding = model.encode([query], convert_to_numpy=True)
    except Exception as e:
        logger.error(f"Failed to embed query: {e}")
        return []

    # Search the FAISS index
    distances, indices = await vs.search(query_embedding, k=top_k * 2)  # fetch more to allow filtering
    if indices.size == 0 or distances.size == 0:
        return []

    # Flatten (only one query vector)
    scores = distances[0]
    idxs = indices[0]

    # Load metadata for mapping index → source/channel/dataset
    df = _load_metadata_df()

    # Build a simple mapping: index in the FAISS index corresponds to row in the DataFrame
    # (the ingest script built embeddings in the order of the DataFrame rows)
    results = []
    for i, score in zip(idxs, scores):
        if i < 0 or i >= len(df):
            continue
        row = df.iloc[i]
        row_channel = row.get("channel", "unknown")
        if channel and row_channel != channel:
            continue
        content = vs.texts[i] if i < len(vs.texts) else str(row.get("text", ""))
        similarity = float(1 - score) if score < 1 else float(score)  # FAISS returns L2 distance; convert to similarity 0‑1
        results.append({
            "id": f"idx-{i}",
            "content": content[:500],  # truncate for payload size
            "similarity": round(similarity, 4),
            "source": str(row.get("source", "unknown")),
            "channel": row_channel,
            "dataset": str(row.get("dataset", "Kaggle")),
        })
        if len(results) >= top_k:
            break

    return results


# ─── Testing ───────────────────────────────
# 1. Ensure the FAISS index and processed CSV exist:
#    - data/embeddings/faiss_index.bin
#    - data/processed/unified_messages.csv
#    Run scripts/ingest_datasets.py to generate them.
# 2. The retriever is called by rag_service.py via:
#    from app.rag.retriever import retrieve_contexts
#    contexts = await retrieve_contexts("password reset", top_k=3)
# 3. The returned dicts contain all fields needed for the frontend RAG panels.
# 4. If the index or CSV is missing, empty results are returned gracefully.