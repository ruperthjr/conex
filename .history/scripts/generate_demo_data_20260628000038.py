
#!/usr/bin/env python3
"""
Conexiaa Demo Data Generator

Creates realistic-looking sample datasets in data/raw so that
the ingestion pipeline (ingest_datasets.py) and the RAG system
have content to work with during hackathon demos.

Run this script before ingest_datasets.py when no real Kaggle
data is available.
"""

import csv
import json
import logging
import os
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent  # project root
RAW_DIR = BASE_DIR / "data" / "raw"

# ─── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("generate_demo")

# ─── Demo content generators ─────────────────────────────────────────────
SMS_MESSAGES = [
    ("+15551234567", "I need to reset my password. Can you help?"),
    ("+15559876543", "My recent order hasn't arrived yet. Order #4567."),
    ("+15552345678", "Thanks for the quick reply! That solved my issue."),
    ("+15553456789", "How do I upgrade my plan to enterprise?"),
    ("+15554567890", "Please send the refund confirmation to my email."),
]

SOCIAL_THREADS = [
    {
        "thread_id": "t1",
        "platform": "twitter",
        "messages": [
            {"sender": "@customer_jane", "text": "@ConexiaaSupport Hey, my package is delayed. Can you check? #help"},
            {"sender": "@ConexiaaSupport", "text": "@customer_jane Sorry for the delay! We've escalated your case. Expect an update in 2 hours."},
        ],
    },
    {
        "thread_id": "t2",
        "platform": "facebook",
        "messages": [
            {"sender": "Alex Rivera", "text": "I love the new feature! AI responses are super fast."},
            {"sender": "Conexiaa", "text": "Thanks, Alex! We're glad you're enjoying it."},
        ],
    },
]

VOICE_TRANSCRIPTS = [
    ("+15551112233", "I'm having trouble with the billing statement. I see a duplicate charge for last month."),
    ("+15552223344", "Your voice reply feature is awesome. Can I change the voice to a male one?"),
    ("+15553334455", "I'd like to cancel my subscription but keep my data. Is that possible?"),
]

TWITTER_DATA = [
    ("tweet_id_001", "@ConexiaaSupport I'm locked out of my account after resetting password. Help please!"),
    ("tweet_id_002", "@ConexiaaSupport Your new AI bridge is magic! SMS to voice in seconds."),
    ("tweet_id_003", "@ConexiaaSupport I need to integrate Zernio with my CRM. Do you have an API?"),
    ("tweet_id_004", "@ConexiaaSupport My refund hasn't processed after 5 days. Case #7890."),
]

DIALOGUES = [
    {"conversation_id": "conv-1", "utterance": "Hi, I need help with my account", "speaker": "customer", "channel": "voice"},
    {"conversation_id": "conv-1", "utterance": "Sure, I can help you with that. Could you verify your email?", "speaker": "agent", "channel": "voice"},
    {"conversation_id": "conv-2", "utterance": "My delivery is late", "speaker": "customer", "channel": "sms"},
    {"conversation_id": "conv-2", "utterance": "We apologize. Your package will arrive tomorrow.", "speaker": "agent", "channel": "sms"},
    {"conversation_id": "conv-3", "utterance": "Hey @support, the app crashes when I try to open settings", "speaker": "customer", "channel": "social"},
    {"conversation_id": "conv-3", "utterance": "@user We're aware of the bug and a fix is rolling out in the next update.", "speaker": "agent", "channel": "social"},
]

# ─── File generation functions ────────────────────────────────────────────
def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def write_csv(filepath: Path, headers: list[str], rows: list[tuple]):
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    log.info("Created %s (%d rows)", filepath.name, len(rows))

def write_json(filepath: Path, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    log.info("Created %s", filepath.name)

def write_jsonl(filepath: Path, data: list[dict]):
    with open(filepath, "w", encoding="utf-8") as f:
        for item in data:
            f.write(json.dumps(item) + "\n")
    log.info("Created %s (%d lines)", filepath.name, len(data))

# ─── Main ────────────────────────────────────────────────────────────────
def main():
    log.info("🚀 Generating Conexiaa demo datasets...")

    # 1. customer_support_conversations
    support_dir = RAW_DIR / "customer_support_conversations"
    ensure_dir(support_dir)
    write_csv(
        support_dir / "dataset.csv",
        ["conversation_id", "conversation"],
        [(f"conv-{i}", msg[1]) for i, msg in enumerate(SMS_MESSAGES)],
    )
    # Also write a metadata.json (optional)
    write_json(support_dir / "metadata.json", {
        "description": "Simulated customer support conversations for hackathon demo.",
        "source": "Conexiaa Demo Generator",
    })

    # 2. direct_messaging_multichannel
    dm_dir = RAW_DIR / "direct_messaging_multichannel"
    ensure_dir(dm_dir)
    write_csv(
        dm_dir / "sms_messages.csv",
        ["phone_number", "message"],
        SMS_MESSAGES,
    )
    write_json(dm_dir / "social_threads.json", SOCIAL_THREADS)
    write_csv(
        dm_dir / "voice_transcripts.csv",
        ["caller_id", "transcript"],
        VOICE_TRANSCRIPTS,
    )

    # 3. customer_support_on_twitter
    twitter_dir = RAW_DIR / "customer_support_on_twitter"
    ensure_dir(twitter_dir)
    write_csv(
        twitter_dir / "tweets.csv",
        ["tweet_id", "tweet"],
        TWITTER_DATA,
    )
    # replies: just duplicate some tweets as replies
    replies = [(f"reply_{i}", f"@user {row[1][:50]} – We're on it!") for i, row in enumerate(TWITTER_DATA)]
    write_csv(
        twitter_dir / "replies.csv",
        ["reply_id", "reply"],
        replies,
    )
    # (Optional) sample.csv from the tree
    sample_tweets = [TWITTER_DATA[0], TWITTER_DATA[2]]
    write_csv(
        twitter_dir / "sample.csv",
        ["tweet_id", "tweet"],
        sample_tweets,
    )

    # 4. multi_platform_dialogues
    dialogues_dir = RAW_DIR / "multi_platform_dialogues"
    ensure_dir(dialogues_dir)
    write_jsonl(dialogues_dir / "dialogues.jsonl", DIALOGUES)

    log.info("✅ All demo datasets generated successfully.")
    log.info("Next step: run 'python scripts/ingest_datasets.py' to build FAISS index.")

if __name__ == "__main__":
    main()