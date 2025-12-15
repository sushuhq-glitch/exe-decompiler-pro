#!/bin/bash
# Setup script for Telegram API Checker Bot

set -e

echo "============================================"
echo "  Telegram API Checker Bot - Setup"
echo "============================================"
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version || { echo "Error: Python 3.8+ required"; exit 1; }

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created with pre-configured bot token"
fi

# Create data directory
echo "Creating data directory..."
mkdir -p data

# Run database migrations
echo "Running database migrations..."
python3 -c "
import asyncio
from database.db_manager import DatabaseManager
from utils.config import Config

async def main():
    config = Config()
    db = DatabaseManager(config.database_url)
    await db.initialize()
    await db.migrate()
    await db.close()
    print('✅ Database migrations complete')

asyncio.run(main())
"

echo ""
echo "============================================"
echo "  ✅ Setup complete!"
echo "============================================"
echo ""
echo "To start the bot, run:"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
