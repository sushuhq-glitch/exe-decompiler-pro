#!/bin/bash
# Deployment script for production

set -e

echo "Deploying Telegram API Checker Bot..."

# Pull latest changes
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt --upgrade

# Run migrations
python3 -m database.migrations

# Restart service
sudo systemctl restart telegram-bot

echo "✅ Deployment complete"
