#!/bin/bash
set -euo pipefail

echo "🚀 Downloading exact datasets for Conexiaa architecture..."

mkdir -p data/raw/customer_support_conversations \
         data/raw/direct_messaging_multichannel \
         data/raw/customer_support_on_twitter \
         data/raw/multi_platform_dialogues

echo "🔽 Tech Support Conversations..."
kaggle datasets download steve1215rogg/tech-support-conversations-dataset -p data/raw/customer_support_conversations --unzip --quiet
mv data/raw/customer_support_conversations/*.csv data/raw/customer_support_conversations/dataset.csv 2>/dev/null || true

echo "🔽 Twitter Customer Support..."
kaggle datasets download thoughtvector/customer-support-on-twitter -p data/raw/customer_support_on_twitter --unzip --quiet

echo "🔽 Multi-channel Direct Messaging..."
kaggle datasets download mkechinov/direct-messaging -p data/raw/direct_messaging_multichannel --unzip --quiet

echo "🔽 Multi-platform Dialogues (reliable alternative)..."
kaggle datasets download abhayayare/multi-turn-chatbot-conversation-dataset -p data/raw/multi_platform_dialogues --unzip --quiet

echo "✅ All datasets downloaded and placed exactly as per tree!"
ls -R data/raw/