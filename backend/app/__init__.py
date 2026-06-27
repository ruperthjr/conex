"""
Conexiaa Backend Application Package

Exposes the FastAPI application factory and package metadata.
"""

from pathlib import Path
import logging
import os

from dotenv import load_dotenv

# ─── Environment loading ─────────────────────────────────────────────────
# Load .env file from project root (two levels up from this file)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# ─── Package metadata ────────────────────────────────────────────────────
__version__ = "1.0.0"

# ─── Root logger configuration ───────────────────────────────────────────
logger = logging.getLogger("conexiaa")
logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

# Prevent duplicate handlers if already configured
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

logger.info("Conexiaa backend package initialised")