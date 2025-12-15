#!/bin/bash
# Docker entrypoint script

set -e

echo "Starting Telegram API Checker Bot..."

# Wait for database if needed
if [ -n "$DATABASE_HOST" ]; then
    echo "Waiting for database..."
    while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
        sleep 1
    done
    echo "Database is ready"
fi

# Run migrations
echo "Running migrations..."
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

asyncio.run(main())
"

# Start the bot
echo "Starting bot..."
exec python3 main.py
