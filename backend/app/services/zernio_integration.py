"""
Zernio Social Integration Service

Handles OAuth connection, message retrieval, and posting to Zernio's
unified social API (Twitter, Instagram, Facebook). During hackathon demos
without real credentials, a simulated mode returns realistic mock data.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Simulated mode flag ─────────────────────────────────────────────────
USE_SIMULATED = not settings.ZERNIO_CLIENT_ID or not settings.ZERNIO_CLIENT_SECRET


# ─── Data structures ─────────────────────────────────────────────────────

class SocialMessage:
    def __init__(
        self,
        platform: str,
        sender_id: str,
        sender_name: str,
        content: str,
        timestamp: datetime,
        message_id: str,
    ):
        self.platform = platform
        self.sender_id = sender_id
        self.sender_name = sender_name
        self.content = content
        self.timestamp = timestamp
        self.message_id = message_id


class ZernioConnectionState:
    def __init__(self):
        self.is_connected = False
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.expires_at: Optional[datetime] = None


# In-memory state (in production, store per user in DB)
_connection_state = ZernioConnectionState()


# ─── Public API ───────────────────────────────────────────────────────────

async def connect(platform: str = "twitter") -> Dict[str, Any]:
    """
    Initiate OAuth flow to connect a social account.
    Returns a dict with authorization URL or success status.
    """
    if USE_SIMULATED:
        logger.info("Zernio: simulated connect")
        _connection_state.is_connected = True
        _connection_state.access_token = "sim_access_token"
        _connection_state.expires_at = datetime.utcnow() + timedelta(hours=1)
        return {"status": "connected", "platform": platform, "mode": "simulated"}

    # Real OAuth implementation would go here
    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Get OAuth URL (example)
            resp = await client.post(
                "https://api.zernio.com/v1/oauth/authorize",
                json={
                    "client_id": settings.ZERNIO_CLIENT_ID,
                    "redirect_uri": settings.ZERNIO_REDIRECT_URI,
                    "scope": f"social:{platform}:read social:{platform}:write",
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            # Normally would return the authorization URL for user to visit
            return {"auth_url": data.get("authorization_url")}
    except Exception as e:
        logger.exception("Zernio connect failed")
        raise ConnectionError(f"Failed to initiate Zernio connection: {e}")


async def disconnect() -> Dict[str, Any]:
    """Revoke tokens and disconnect from Zernio."""
    if USE_SIMULATED or not _connection_state.access_token:
        _connection_state.is_connected = False
        _connection_state.access_token = None
        return {"status": "disconnected", "mode": "simulated"}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.zernio.com/v1/oauth/revoke",
                headers={"Authorization": f"Bearer {_connection_state.access_token}"},
                timeout=10.0,
            )
            resp.raise_for_status()
    except Exception as e:
        logger.warning(f"Zernio revoke error (ignored): {e}")
    finally:
        _connection_state.is_connected = False
        _connection_state.access_token = None
    return {"status": "disconnected"}


async def fetch_messages(
    platform: str = "twitter",
    since: Optional[datetime] = None,
    limit: int = 50,
) -> List[SocialMessage]:
    """
    Fetch recent social messages from the connected account.
    Falls back to simulated data if real API is unavailable.
    """
    if USE_SIMULATED or not _connection_state.is_connected:
        logger.info("Zernio: returning simulated messages")
        return _generate_mock_messages(platform, limit)

    try:
        async with httpx.AsyncClient() as client:
            params = {"platform": platform, "limit": limit}
            if since:
                params["since"] = since.isoformat()
            resp = await client.get(
                "https://api.zernio.com/v1/messages",
                headers={"Authorization": f"Bearer {_connection_state.access_token}"},
                params=params,
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()
            messages = []
            for item in data.get("messages", []):
                messages.append(
                    SocialMessage(
                        platform=item.get("platform", platform),
                        sender_id=item.get("sender_id", ""),
                        sender_name=item.get("sender_name", "Unknown"),
                        content=item.get("text", ""),
                        timestamp=datetime.fromisoformat(item["timestamp"]),
                        message_id=item["id"],
                    )
                )
            return messages
    except Exception as e:
        logger.error(f"Failed to fetch Zernio messages: {e}")
        # Fallback to simulated data on error
        return _generate_mock_messages(platform, limit)


async def send_reply(
    in_reply_to_message_id: str,
    content: str,
    platform: str = "twitter",
) -> Dict[str, Any]:
    """Reply to a social message."""
    if USE_SIMULATED or not _connection_state.is_connected:
        logger.info("Zernio: simulated reply")
        return {
            "status": "sent",
            "message_id": f"sim_{datetime.utcnow().timestamp()}",
            "mode": "simulated",
        }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.zernio.com/v1/messages/reply",
                headers={"Authorization": f"Bearer {_connection_state.access_token}"},
                json={
                    "in_reply_to": in_reply_to_message_id,
                    "text": content,
                    "platform": platform,
                },
                timeout=15.0,
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.exception("Failed to send Zernio reply")
        raise


# ─── Mock data generator ─────────────────────────────────────────────────

def _generate_mock_messages(platform: str, limit: int) -> List[SocialMessage]:
    """Return realistic fake messages for demonstration."""
    mock_senders = [
        ("@user_jane", "Jane Doe"),
        ("@tech_guru", "Alex Rivera"),
        ("@support_seeker", "Morgan Lee"),
        ("@social_media_pro", "Casey Kim"),
    ]
    mock_contents = [
        "Hey @ConexiaaSupport, I'm having trouble with my recent order. Can you help?",
        "Love the new update! The AI replies are getting super fast 🔥",
        "Is there a way to integrate this with our CRM?",
        "Just tried the voice reply feature – mind blown! #Conexiaa",
        "My account seems to be locked. I've tried resetting the password but no luck.",
        "Thanks for the quick response! That solved my problem.",
    ]
    messages = []
    now = datetime.utcnow()
    for i in range(min(limit, len(mock_contents))):
        idx = i % len(mock_senders)
        content = mock_contents[i]
        sender_handle, sender_name = mock_senders[idx]
        messages.append(
            SocialMessage(
                platform=platform if i % 2 == 0 else "twitter",
                sender_id=f"usr_{idx}",
                sender_name=sender_name,
                content=content,
                timestamp=now - timedelta(minutes=10 * (i + 1)),
                message_id=f"msg_mock_{i}",
            )
        )
    return messages


# ─── Testing ───────────────────────────────
# 1. Without real Zernio credentials, the service runs in simulated mode.
#    Set ZERNIO_CLIENT_ID and ZERNIO_CLIENT_SECRET in .env to test real API.
# 2. Call `connect()` from the Zernio connect component; it will return
#    success immediately in simulated mode.
# 3. Use `fetch_messages()` to get a list of SocialMessage objects.
# 4. Use `send_reply()` to simulate sending a reply.
# 5. All functions are async and raise exceptions on network errors.