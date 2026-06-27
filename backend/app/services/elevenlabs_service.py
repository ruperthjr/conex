"""
ElevenLabs Text‑to‑Speech Service

Generates MP3 audio from text using the ElevenLabs API.
Falls back to a simulated demo voice when no API key is configured,
so the entire pipeline works seamlessly for hackathon demos.

Expected usage:
    audio_url, duration = await generate_elevenlabs_audio(text="Hello world", voice="rachel")
"""

import logging
import uuid
from pathlib import Path
from typing import Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Set API key if available ────────────────────────────────────────────
if settings.ELEVENLABS_API_KEY:
    try:
        from elevenlabs import set_api_key
        set_api_key(settings.ELEVENLABS_API_KEY)
        logger.info("ElevenLabs API key configured")
    except Exception as e:
        logger.warning(f"Failed to set ElevenLabs API key: {e}")

# ─── Where to store generated audio (served by FastAPI as static) ────────
# The directory is relative to the backend package root.
# In main.py you should mount: app.mount("/audio", StaticFiles(directory="backend/static/audio"), name="audio")
AUDIO_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "static" / "audio"
AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Duration used for simulated audio (seconds)
SIMULATED_DURATION = 4.2


async def generate_elevenlabs_audio(
    text: str,
    voice: str = "rachel",
) -> Tuple[str, float]:
    """
    Synthesise speech from text.

    Args:
        text: The text to convert to speech (max 5000 characters).
        voice: The voice ID or name (e.g., "rachel", "adam").

    Returns:
        A tuple of (audio_url, duration_seconds).
        The audio_url is relative to the backend server root (e.g. /audio/abc.mp3).
    """
    # ── Simulated mode (no API key) ──────────────────────────────────
    if not settings.ELEVENLABS_API_KEY:
        logger.info("ElevenLabs running in simulated mode")
        return _simulate_audio(text, voice)

    # ── Real API call ────────────────────────────────────────────────
    try:
        from elevenlabs import generate
    except ImportError:
        logger.exception("ElevenLabs SDK not installed")
        return _simulate_audio(text, voice)

    try:
        # Generate audio bytes using the turbo model for low latency
        audio_bytes = generate(
            text=text,
            voice=voice,
            model="eleven_turbo_v2",
        )
    except Exception as e:
        logger.error(f"ElevenLabs generation failed: {e}")
        return _simulate_audio(text, voice)

    # Save to the audio output directory
    filename = f"{uuid.uuid4().hex}.mp3"
    file_path = AUDIO_OUTPUT_DIR / filename
    try:
        with open(file_path, "wb") as f:
            f.write(audio_bytes)
    except Exception as e:
        logger.error(f"Failed to save audio file: {e}")
        return _simulate_audio(text, voice)

    # Approximate duration – in a real app you'd parse the MP3 or API returns it
    duration = _estimate_duration(len(audio_bytes))

    audio_url = f"/audio/{filename}"
    logger.info(f"Generated audio: {audio_url}")
    return audio_url, duration


def _simulate_audio(text: str, voice: str) -> Tuple[str, float]:
    """
    Return a pre‑recorded demo audio file for hackathon testing.
    This file must exist in the static/audio directory.
    """
    demo_filename = "demo-voice-summary.mp3"
    # Ensure the demo file exists – if not, create a dummy placeholder
    demo_file = AUDIO_OUTPUT_DIR / demo_filename
    if not demo_file.exists():
        # Write a minimal valid MP3 (silence) so the app doesn't break completely
        _create_minimal_mp3(demo_file)
    return f"/audio/{demo_filename}", SIMULATED_DURATION


def _estimate_duration(bytes_count: int) -> float:
    """
    Rough estimation: MP3 at ~128 kbps → bytes ≈ duration * 16000.
    """
    return round(bytes_count / 16000, 1)


def _create_minimal_mp3(filepath: Path) -> None:
    """Write a tiny, valid MP3 file (silence) to prevent 404s."""
    # Minimal MP3 frame (silence)
    mp3_header = bytes.fromhex("fffb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000")
    filepath.write_bytes(mp3_header)
    logger.warning("Created minimal placeholder MP3 for demo")


# ─── Testing ───────────────────────────────
# 1. Without a real ELEVENLABS_API_KEY, the service returns a demo file.
#    Place a file named "demo-voice-summary.mp3" in backend/static/audio/.
# 2. In backend/main.py, mount the static directory:
#    from fastapi.staticfiles import StaticFiles
#    app.mount("/audio", StaticFiles(directory="backend/static/audio"), name="audio")
# 3. Test the endpoint:
#    POST /api/v1/ai/elevenlabs  body: {"text": "Hello", "voice": "rachel"}
#    Response includes an audio_url like /audio/demo-voice-summary.mp3.
# 4. For the real API, set ELEVENLABS_API_KEY in .env and restart.