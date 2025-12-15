#!/usr/bin/env python3
"""
Telegram API Checker Bot - Main Entry Point
============================================

A comprehensive bot that analyzes websites, captures login APIs,
extracts tokens/cookies, discovers endpoints, and generates Python checkers.

Author: Telegram API Checker Bot Team
Version: 1.0.0
License: MIT
"""

import asyncio
import logging
import signal
import sys
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Import bot components
from bot.telegram_bot import TelegramAPICheckerBot
from utils.logger import setup_logging, get_logger
from utils.config import Config
from database.db_manager import DatabaseManager

# Load environment variables
load_dotenv()

# Setup logging
logger = get_logger(__name__)


class Application:
    """Main application class that manages the bot lifecycle."""

    def __init__(self):
        """Initialize the application."""
        self.bot: Optional[TelegramAPICheckerBot] = None
        self.config: Optional[Config] = None
        self.db_manager: Optional[DatabaseManager] = None
        self._shutdown_event = asyncio.Event()

    async def initialize(self) -> bool:
        """
        Initialize all application components.

        Returns:
            bool: True if initialization successful, False otherwise
        """
        try:
            logger.info("🚀 Starting Telegram API Checker Bot...")

            # Load configuration
            logger.info("📋 Loading configuration...")
            self.config = Config()
            
            if not self.config.validate():
                logger.error("❌ Configuration validation failed")
                return False

            # Initialize database
            logger.info("💾 Initializing database...")
            self.db_manager = DatabaseManager(self.config.database_url)
            await self.db_manager.initialize()
            
            # Run migrations
            logger.info("🔄 Running database migrations...")
            await self.db_manager.migrate()

            # Initialize bot
            logger.info("🤖 Initializing Telegram bot...")
            self.bot = TelegramAPICheckerBot(
                token=self.config.telegram_token,
                config=self.config,
                db_manager=self.db_manager
            )

            # Setup signal handlers
            self._setup_signal_handlers()

            logger.info("✅ Application initialized successfully")
            return True

        except Exception as e:
            logger.exception(f"❌ Failed to initialize application: {e}")
            return False

    async def start(self) -> None:
        """Start the bot and run until shutdown."""
        try:
            if not await self.initialize():
                logger.error("Failed to initialize application")
                sys.exit(1)

            logger.info("🎯 Bot is now running! Press Ctrl+C to stop.")
            
            # Start the bot
            await self.bot.start()

            # Wait for shutdown signal
            await self._shutdown_event.wait()

        except KeyboardInterrupt:
            logger.info("⚠️ Received keyboard interrupt")
        except Exception as e:
            logger.exception(f"❌ Unexpected error in main loop: {e}")
        finally:
            await self.shutdown()

    async def shutdown(self) -> None:
        """Gracefully shutdown the application."""
        logger.info("🛑 Shutting down application...")

        try:
            # Stop the bot
            if self.bot:
                logger.info("Stopping bot...")
                await self.bot.stop()

            # Close database connections
            if self.db_manager:
                logger.info("Closing database connections...")
                await self.db_manager.close()

            # Cancel pending tasks
            tasks = [
                task for task in asyncio.all_tasks()
                if task is not asyncio.current_task()
            ]
            
            if tasks:
                logger.info(f"Cancelling {len(tasks)} pending tasks...")
                for task in tasks:
                    task.cancel()
                
                await asyncio.gather(*tasks, return_exceptions=True)

            logger.info("✅ Application shutdown complete")

        except Exception as e:
            logger.exception(f"❌ Error during shutdown: {e}")

    def _setup_signal_handlers(self) -> None:
        """Setup signal handlers for graceful shutdown."""
        def signal_handler(sig, frame):
            logger.info(f"Received signal {sig}")
            self._shutdown_event.set()

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    @staticmethod
    def check_dependencies() -> bool:
        """
        Check if all required dependencies are installed.

        Returns:
            bool: True if all dependencies available, False otherwise
        """
        required_modules = [
            'telegram',
            'selenium',
            'bs4',
            'requests',
            'aiohttp',
            'yaml',
            'cryptography',
            'sqlalchemy',
            'pydantic'
        ]
        
        optional_modules = [
            'playwright'
        ]

        missing = []
        for module in required_modules:
            try:
                __import__(module)
            except ImportError:
                missing.append(module)

        if missing:
            logger.error(f"❌ Missing required modules: {', '.join(missing)}")
            logger.info("💡 Install them with: pip install -r requirements.txt or requirements-minimal.txt")
            return False

        # Check optional modules and warn if missing
        for module in optional_modules:
            try:
                __import__(module)
            except ImportError:
                logger.warning(f"⚠️  Optional module '{module}' not available (some features may be limited)")

        return True


async def main():
    """Main entry point for the application."""
    # Setup logging
    setup_logging(level=logging.INFO)
    
    logger.info("=" * 60)
    logger.info("  🤖 TELEGRAM API CHECKER BOT")
    logger.info("  Version 1.0.0")
    logger.info("=" * 60)

    # Check dependencies
    if not Application.check_dependencies():
        logger.error("Please install missing dependencies first")
        sys.exit(1)

    # Create and run application
    app = Application()
    await app.start()


def run():
    """Run the application with proper event loop handling."""
    try:
        # Check Python version
        if sys.version_info < (3, 8):
            print("❌ Python 3.8 or higher is required")
            sys.exit(1)

        # Run the async main function
        if sys.platform == 'win32':
            # Windows-specific event loop policy
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
        asyncio.run(main())

    except KeyboardInterrupt:
        logger.info("👋 Goodbye!")
    except Exception as e:
        logger.exception(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run()
