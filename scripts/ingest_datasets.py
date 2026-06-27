#!/usr/bin/env python3
"""
Conexiaa Data Ingestion & Embedding Script

Reads raw Kaggle datasets from data/raw, cleans and unifies them,
builds FAISS vector embeddings, and writes processed files.
Run once (or after updating raw data) before starting the backend.
"""

import json
import logging
import pickle
import sys
from pathlib import Path

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

# ─── Paths ────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent  # project root
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
EMBEDDINGS_DIR = BASE_DIR / "data" / "embeddings"
VECTORS_DIR = EMBEDDINGS_DIR / "conversation_vectors"

# Ensure output directories exist
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
VECTORS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("ingest")

# ─── Column name mapping candidates for text field ───────────────────────
TEXT_COLUMNS = ["text", "conversation", "tweet", "message", "utterance", "body", "content"]

def find_text_column(df: pd.DataFrame) -> str:
    """Return the name of the first column that likely contains text."""
    for col in TEXT_COLUMNS:
        if col in df.columns:
            return col
    # Fallback: use first string column
    str_cols = df.select_dtypes(include="object").columns
    if len(str_cols) > 0:
        return str_cols[0]
    raise ValueError("No suitable text column found")

# ─── Load & standardise a dataset ────────────────────────────────────────
def load_dataset(filepath: Path, source_label: str, platform_label: str, dataset_name: str) -> pd.DataFrame:
    """Load CSV or JSON and return a DataFrame with columns: text, channel, source, dataset."""
    if not filepath.exists():
        log.warning("File not found, skipping: %s", filepath)
        return pd.DataFrame()

    suffix = filepath.suffix.lower()
    try:
        if suffix == ".csv":
            df = pd.read_csv(filepath)
        elif suffix == ".json":
            df = pd.read_json(filepath)
        elif suffix == ".jsonl":
            df = pd.read_json(filepath, lines=True)
        else:
            log.error("Unsupported file type: %s", suffix)
            return pd.DataFrame()

        if df.empty:
            return pd.DataFrame()

        text_col = find_text_column(df)
        df = df.rename(columns={text_col: "text"})
        df["text"] = df["text"].astype(str).str.strip()
        df = df[df["text"] != ""]  # remove empty strings

        df["channel"] = platform_label
        df["source"] = source_label
        df["dataset"] = dataset_name
        return df[["text", "channel", "source", "dataset"]]
    except Exception as e:
        log.error("Failed to process %s: %s", filepath.name, e)
        return pd.DataFrame()

# ─── Main ingestion routine ──────────────────────────────────────────────
def ingest_datasets() -> pd.DataFrame:
    """Load and unify all raw datasets, returns a combined DataFrame."""
    frames = []

    # 1. Customer support conversations
    frames.append(
        load_dataset(
            RAW_DIR / "customer_support_conversations" / "dataset.csv",
            source_label="tech_support",
            platform_label="support",
            dataset_name="Kaggle: Customer Support Conversations",
        )
    )

    # 2. Twitter customer support (try multiple possible locations)
    twitter_csv = RAW_DIR / "customer_support_on_twitter" / "twcs" / "twcs.csv"
    if twitter_csv.exists():
        frames.append(
            load_dataset(
                twitter_csv,
                source_label="twitter",
                platform_label="twitter",
                dataset_name="Kaggle: Customer Support on Twitter",
            )
        )
    else:
        # fallback to tweets.csv in the directory itself
        tweets_csv = RAW_DIR / "customer_support_on_twitter" / "tweets.csv"
        if tweets_csv.exists():
            frames.append(
                load_dataset(
                    tweets_csv,
                    source_label="twitter",
                    platform_label="twitter",
                    dataset_name="Kaggle: Customer Support on Twitter (tweets)",
                )
            )
        replies_csv = RAW_DIR / "customer_support_on_twitter" / "replies.csv"
        if replies_csv.exists():
            frames.append(
                load_dataset(
                    replies_csv,
                    source_label="twitter",
                    platform_label="twitter",
                    dataset_name="Kaggle: Customer Support on Twitter (replies)",
                )
            )
        sample_csv = RAW_DIR / "customer_support_on_twitter" / "sample.csv"
        if sample_csv.exists():
            frames.append(
                load_dataset(
                    sample_csv,
                    source_label="twitter",
                    platform_label="twitter",
                    dataset_name="Kaggle: Customer Support on Twitter (sample)",
                )
            )

    # 3. Direct messaging multi-channel
    demo_msg_csv = RAW_DIR / "direct_messaging_multichannel" / "messages-demo.csv"
    if demo_msg_csv.exists():
        frames.append(
            load_dataset(
                demo_msg_csv,
                source_label="sms",
                platform_label="sms",
                dataset_name="Direct Messaging Multichannel Demo",
            )
        )
    # Also try campaigns.csv
    campaigns_csv = RAW_DIR / "direct_messaging_multichannel" / "campaigns.csv"
    if campaigns_csv.exists():
        frames.append(
            load_dataset(
                campaigns_csv,
                source_label="sms",
                platform_label="sms",
                dataset_name="Direct Messaging Campaigns",
            )
        )

    # 4. Multi-platform dialogues
    chatbot_csv = RAW_DIR / "multi_platform_dialogues" / "chatbot_conversations.csv"
    if chatbot_csv.exists():
        frames.append(
            load_dataset(
                chatbot_csv,
                source_label="multi_platform",
                platform_label="mixed",
                dataset_name="Multi-Platform Dialogues",
            )
        )
    chatbot_json = RAW_DIR / "multi_platform_dialogues" / "chatbot_conversations.json"
    if chatbot_json.exists():
        frames.append(
            load_dataset(
                chatbot_json,
                source_label="multi_platform",
                platform_label="mixed",
                dataset_name="Multi-Platform Dialogues (JSON)",
            )
        )

    # Combine and deduplicate
    if not frames:
        log.warning("No raw data found. Creating minimal demo dataset.")
        return pd.DataFrame({
            "text": ["Welcome to Conexiaa AI Bridge. How can I assist you today?"],
            "channel": ["sms"],
            "source": ["demo"],
            "dataset": ["Demo"],
        })

    combined = pd.concat(frames, ignore_index=True)
    combined = combined.drop_duplicates(subset=["text"]).reset_index(drop=True)
    combined["message_id"] = range(len(combined))
    log.info("Ingested %d messages from %d files.", len(combined), len(frames))
    return combined

# ─── Build embeddings and FAISS index ────────────────────────────────────
def build_embeddings(df: pd.DataFrame):
    """Create sentence embeddings, FAISS index, and save artifacts."""
    model = SentenceTransformer("all-MiniLM-L6-v2")
    texts = df["text"].astype(str).tolist()
    log.info("Encoding %d texts ...", len(texts))
    embeddings = model.encode(texts, batch_size=64, show_progress_bar=True)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings.astype(np.float32))

    # Write index
    index_path = EMBEDDINGS_DIR / "faiss_index.bin"
    faiss.write_index(index, str(index_path))
    log.info("FAISS index written to %s (%d vectors)", index_path, index.ntotal)

    # Write metadata (texts and shape)
    meta_path = VECTORS_DIR / "metadata.pkl"
    with open(meta_path, "wb") as f:
        pickle.dump({"texts": texts, "shape": embeddings.shape}, f)
    log.info("Metadata written to %s", meta_path)

# ─── Write processed data ────────────────────────────────────────────────
def write_processed(df: pd.DataFrame):
    """Save cleaned conversations as CSV and Parquet, and channel mappings."""
    df.to_csv(PROCESSED_DIR / "unified_messages.csv", index=False)
    df.to_parquet(PROCESSED_DIR / "cleaned_conversations.parquet", index=False)

    channel_map = {
        "sms": "SMS",
        "twitter": "Social (X)",
        "social": "Social",
        "support": "Voice/Support",
        "mixed": "Multi-Channel",
        "voice": "Voice",
    }
    with open(PROCESSED_DIR / "channel_mappings.json", "w") as f:
        json.dump(channel_map, f, indent=2)
    log.info("Processed data written to %s", PROCESSED_DIR)

# ─── Main ────────────────────────────────────────────────────────────────
def main():
    log.info("🚀 Conexiaa Data Ingestion Starting")
    try:
        df = ingest_datasets()
        if df.empty:
            log.error("DataFrame empty after ingestion. Exiting.")
            sys.exit(1)
        write_processed(df)
        build_embeddings(df)
        log.info("✅ Ingestion and embedding complete")
    except Exception as e:
        log.exception("Fatal error during ingestion")
        sys.exit(1)

if __name__ == "__main__":
    main()