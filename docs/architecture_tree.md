conexiaa/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── (main)/
│       ├── dashboard/
│       │   ├── page.tsx
│       │   └── analytics/
│       │       └── page.tsx
│       ├── chat/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── chat-thread.tsx
│       │       ├── message-bubble.tsx
│       │       ├── channel-switcher.tsx
│       │       ├── rag-context-highlight.tsx
│       │       ├── voice-reply-button.tsx
│       │       ├── typing-indicator.tsx
│       │       └── multi-channel-indicator.tsx
│       ├── channels/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── channel-list.tsx
│       │       └── zernio-connect.tsx
│       ├── ai-bridge/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── ai-suggestions.tsx
│       │       └── elevenlabs-player.tsx
│       └── auth/
│           ├── login/page.tsx
│           └── register/page.tsx
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── core/
│       │   ├── config.py
│       │   ├── database.py
│       │   └── security.py
│       ├── models/
│       │   ├── user.py
│       │   ├── conversation.py
│       │   └── message.py
│       ├── schemas/
│       │   ├── user.py
│       │   └── ai.py
│       ├── crud/
│       │   └── conversation.py
│       ├── api/
│       │   ├── v1/
│       │   │   ├── auth.py
│       │   │   ├── conversations.py
│       │   │   ├── messages.py
│       │   │   └── ai.py
│       │   └── websocket.py
│       ├── services/
│       │   ├── zernio_integration.py
│       │   ├── elevenlabs_service.py
│       │   ├── featherless_service.py
│       │   └── rag_service.py
│       └── rag/
│           ├── vector_store.py
│           └── retriever.py
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── tooltip.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── avatar.tsx
│       └── badge.tsx
├── lib/
│   └── utils.ts
├── public/
│   └── image.png
├── data/
│   ├── raw/
│   │   ├── customer_support_conversations/
│   │   │   ├── dataset.csv
│   │   │   └── metadata.json
│   │   ├── direct_messaging_multichannel/
│   │   │   ├── sms_messages.csv
│   │   │   ├── social_threads.json
│   │   │   └── voice_transcripts.csv
│   │   ├── customer_support_on_twitter/
│   │   │   ├── tweets.csv
│   │   │   └── replies.csv
│   │   └── multi_platform_dialogues/
│   │       └── dialogues.jsonl
│   ├── processed/
│   │   ├── cleaned_conversations.parquet
│   │   ├── unified_messages.csv
│   │   └── channel_mappings.json
│   └── embeddings/
│       └── faiss_index.bin
├── scripts/
│   ├── ingest_datasets.py
│   └── generate_demo_data.py
├── types/
│   ├── cache-life.d.ts
│   ├── routes.d.ts
│   └── validator.ts
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── pyproject.toml
├── README.md
├── tsconfig.json
├── LICENSE
└── uv.lock