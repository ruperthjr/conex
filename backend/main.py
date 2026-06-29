from dotenv import load_dotenv; load_dotenv()
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import json, random, asyncio, os, httpx, pathlib

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ELEVENLABS_KEY = os.getenv("ELEVENLABS_API_KEY", "")
FEATHERLESS_URL = os.getenv("FEATHERLESS_API_URL", "https://api.featherless.ai/v1")
FEATHERLESS_KEY = os.getenv("FEATHERLESS_API_KEY", "")

DEMO_DIR = pathlib.Path("public")
DEMO_DIR.mkdir(exist_ok=True)
AUDIO_FILES = {
    "voice-reply-james.mp3": "James, thank you for three years of loyalty! I have upgraded your plan to Enterprise Pro. Have a wonderful day.",
    "voice-summary.mp3": "Your account issue has been resolved across SMS and social channels. A refund and credit have been applied. Your personalised voice update is ready."
}

async def generate_tts(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> bytes | None:
    if not ELEVENLABS_KEY:
        return None
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {"xi-api-key": ELEVENLABS_KEY, "Content-Type": "application/json", "accept": "audio/mpeg"}
    payload = {"text": text, "model_id": "eleven_turbo_v2_5", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                return resp.content
    except Exception:
        pass
    return None

@app.on_event("startup")
async def prepare_audio():
    for filename, text in AUDIO_FILES.items():
        filepath = DEMO_DIR / filename
        if not filepath.exists():
            audio = await generate_tts(text)
            if audio:
                filepath.write_bytes(audio)
            else:
                filepath.write_bytes(b'\xff\xfb\x90\x00')

@app.get("/demo/voice-reply-james.mp3")
async def serve_james():
    file = DEMO_DIR / "voice-reply-james.mp3"
    return FileResponse(str(file), media_type="audio/mpeg") if file.exists() else FileResponse(status_code=404)

@app.get("/demo/voice-summary.mp3")
async def serve_summary():
    file = DEMO_DIR / "voice-summary.mp3"
    return FileResponse(str(file), media_type="audio/mpeg") if file.exists() else FileResponse(status_code=404)

@app.get("/api/v1/services/status")
async def services_status():
    return {"featherless": bool(FEATHERLESS_KEY), "elevenlabs": bool(ELEVENLABS_KEY)}

@app.get("/api/v1/conversations")
def conversations():
    return [
        {"id": "conv-1", "title": "Sarah Mitchell", "lastMessage": "Reset password help", "channel": "sms", "unreadCount": 2},
        {"id": "conv-2", "title": "Alex Torres", "lastMessage": "Order #45892 still not here", "channel": "social", "unreadCount": 0},
        {"id": "conv-3", "title": "James Patel", "lastMessage": "Upgrade to enterprise", "channel": "voice", "unreadCount": 1},
    ]

welcomed_convos: set = set()
DEMO_CONTEXTS = ["Password reset flow requires identity verification.", "Orders >10 days qualify for escalation.", "Long-term customers get 20% loyalty discount."]

@app.websocket("/ws/chat/{conversation_id}")
async def ws_endpoint(websocket: WebSocket, conversation_id: str):
    await websocket.accept()
    try:
        if conversation_id not in welcomed_convos:
            welcomed_convos.add(conversation_id)
            await websocket.send_json({
                "event": "message",
                "data": {
                    "id": f"welcome-{random.randint(1000,9999)}",
                    "role": "assistant",
                    "content": "👋 I'm Conexiaa AI. Connected across SMS, social & voice.",
                    "channel": "sms",
                    "timestamp": "2026-06-27T12:00:00",
                    "isVoiceReady": False
                }
            })
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            content = msg.get("data", {}).get("content", "")
            await asyncio.sleep(0.6)
            await websocket.send_json({
                "event": "message",
                "data": {
                    "id": f"reply-{random.randint(1000,9999)}",
                    "role": "assistant",
                    "content": f"Echo: {content[:70]}" + ("…" if len(content)>70 else ""),
                    "channel": msg.get("data", {}).get("channel", "sms"),
                    "timestamp": "2026-06-27T12:00:00",
                    "ragContexts": [{"id": f"rc-{random.randint(1,99)}", "content": random.choice(DEMO_CONTEXTS), "similarity": 0.9}]
                }
            })
    except WebSocketDisconnect:
        pass
