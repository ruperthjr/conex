"""
FAISS vector store wrapper for Conexiaa RAG.

Loads a pre‑built FAISS index and associated metadata (texts, mapping) from disk.
Provides async search and lookup methods used by the retriever.

In demo / first‑run scenarios where files are missing, it gracefully returns empty
results rather than throwing exceptions.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import faiss
import numpy as np
import pickle

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Paths (relative to project root) ────────────────────────────────────
# The ingest script writes faiss_index.bin directly into data/embeddings/
INDEX_PATH = Path("data/embeddings/faiss_index.bin")
# Metadata (texts + shape) is stored inside data/embeddings/conversation_vectors/
METADATA_PATH = Path("data/embeddings/conversation_vectors/metadata.pkl")


class VectorStore:
    """
    FAISS vector store for similarity search.
    Loads the index and metadata once on initialisation.
    """

    def __init__(self):
        self.index: Optional[faiss.Index] = None
        self.texts: List[str] = []
        self.dimension: int = 0
        self._loaded = False

    def load(self) -> None:
        """
        Load the FAISS index and metadata from disk.
        If files are missing, store remains empty (no exception).
        """
        if self._loaded:
            return

        if not INDEX_PATH.exists():
            logger.warning(
                f"FAISS index not found at {INDEX_PATH}. "
                "Run scripts/ingest_datasets.py to build it. "
                "RAG will use simulated contexts."
            )
            self._loaded = True
            return

        try:
            self.index = faiss.read_index(str(INDEX_PATH))
            self.dimension = self.index.d
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}")
            self.index = None
            self._loaded = True
            return

        # Load metadata (texts)
        if METADATA_PATH.exists():
            try:
                with open(METADATA_PATH, "rb") as f:
                    meta = pickle.load(f)
                self.texts = meta.get("texts", [])
            except Exception as e:
                logger.error(f"Failed to load metadata: {e}")
                self.texts = []

        self._loaded = True
        logger.info(
            f"Vector store loaded: {self.index.ntotal} vectors, "
            f"dimension={self.dimension}, texts={len(self.texts)}"
        )

    def _ensure_loaded(self) -> bool:
        """Ensure store is loaded and valid; returns True if ready."""
        if not self._loaded:
            self.load()
        return self.index is not None and self.index.ntotal > 0

    async def search(
        self,
        query_vector: np.ndarray,
        k: int = 5,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Perform approximate nearest neighbour search.

        Args:
            query_vector: A 2‑D numpy array of shape (1, dimension).
            k: Number of nearest neighbours to retrieve.

        Returns:
            Tuple of (distances, indices) arrays, each of shape (1, k).
            If the store is unavailable, returns empty arrays.
        """
        if not self._ensure_loaded():
            return np.array([[]], dtype=np.float32), np.array([[]], dtype=np.int64)

        distances, indices = self.index.search(query_vector, k)
        return distances, indices

    async def get_texts(self, indices: List[int]) -> List[str]:
        """
        Return the original texts for the given indices.
        If an index is out of range, returns an empty string.
        """
        if not self.texts:
            return [""] * len(indices)
        return [self.texts[i] if 0 <= i < len(self.texts) else "" for i in indices]


# Singleton instance (can be imported and used directly)
vector_store = VectorStore()


# ─── Convenience function ──────────────────────────────────────────────────

async def get_vector_store() -> VectorStore:
    """Return the singleton vector store (ensuring it's loaded)."""
    vector_store._ensure_loaded()
    return vector_store


# ─── Testing ─────────────────────────────────
# 1. Build the FAISS index by running:
#    python scripts/ingest_datasets.py
# 2. The index will be created at data/embeddings/faiss_index.bin.
# 3. This module is imported by the retriever (retriever.py) to perform searches.
# 4. If the index file is missing, the store logs a warning and returns empty
#    results – the RAG service will then fall back to simulated contexts.
# 5. To test search manually, embed a query with SentenceTransformer and call
#    vector_store.search(query_vector, k=3).