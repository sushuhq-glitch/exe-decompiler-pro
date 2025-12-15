"""
Telegram API Checker Bot - Main Bot Implementation
===================================================

This is the main bot class that handles all Telegram bot operations,
including message handling, conversation management, and coordination
with analyzer, interceptor, and generator modules.

Features:
---------
- Beautiful UI with emojis
- Multi-language support (IT/EN)
- Real-time progress updates
- Async/await optimized
- Error handling and recovery
- Session management
- Database integration

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path

from telegram import Update, BotCommand, Bot
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ConversationHandler,
    filters,
    ContextTypes,
    Defaults
)
from telegram.error import TelegramError, NetworkError, TimedOut

from .handlers import BotHandlers
from .keyboards import BotKeyboards
from .messages import BotMessages
from .states import ConversationStates
from .middleware import BotMiddleware

from utils.logger import get_logger
from utils.config import Config
from database.db_manager import DatabaseManager

logger = get_logger(__name__)


class TelegramAPICheckerBot:
    """
    Main Telegram bot class for the API Checker Bot.
    
    This class manages the bot's lifecycle, handles updates, coordinates
    with backend services, and provides a beautiful user interface.
    
    Attributes:
        token (str): Telegram bot token
        config (Config): Configuration object
        db_manager (DatabaseManager): Database manager instance
        application (Application): python-telegram-bot application
        handlers (BotHandlers): Command handlers
        keyboards (BotKeyboards): Keyboard layouts
        messages (BotMessages): Message templates
    """

    # Bot token is pre-configured
    DEFAULT_TOKEN = "8440573724:AAGFEW0MSo2G7kPrDtvQRBi2E-bWrRiOSXU"

    def __init__(
        self,
        token: Optional[str] = None,
        config: Optional[Config] = None,
        db_manager: Optional[DatabaseManager] = None
    ):
        """
        Initialize the Telegram bot.
        
        Args:
            token: Telegram bot token (uses default if not provided)
            config: Configuration object
            db_manager: Database manager instance
        """
        self.token = token or self.DEFAULT_TOKEN
        self.config = config or Config()
        self.db_manager = db_manager
        
        # Initialize components
        self.application: Optional[Application] = None
        self.handlers: Optional[BotHandlers] = None
        self.keyboards: Optional[BotKeyboards] = None
        self.messages: Optional[BotMessages] = None
        self.middleware: Optional[BotMiddleware] = None
        
        # Session management
        self.active_sessions: Dict[int, Dict[str, Any]] = {}
        
        # Statistics
        self.stats = {
            "total_users": 0,
            "total_projects": 0,
            "total_checkers_generated": 0,
            "start_time": datetime.now()
        }
        
        logger.info(f"🤖 Telegram bot initialized with token: {self.token[:10]}...")

    async def initialize(self) -> None:
        """
        Initialize the bot application and all components.
        
        This method sets up:
        - Application builder
        - Command handlers
        - Callback query handlers
        - Message handlers
        - Conversation handlers
        - Error handlers
        """
        try:
            logger.info("🔧 Initializing bot components...")
            
            # Python 3.14 fix: Build application without triggering Updater __slots__ bug
            # Build application with updater=None to avoid __slots__ bug
            self.application = (
                Application.builder()
                .token(self.token)
                .concurrent_updates(True)
                .updater(None)  # KEY FIX: Disable Updater to avoid Python 3.14 __slots__ bug
                .build()
            )
            
            # Manually create a custom polling mechanism
            self._running = False
            
            # Initialize sub-components
            self.keyboards = BotKeyboards(self.config)
            self.messages = BotMessages(self.config)
            self.middleware = BotMiddleware(self.db_manager)
            self.handlers = BotHandlers(
                config=self.config,
                db_manager=self.db_manager,
                keyboards=self.keyboards,
                messages=self.messages
            )
            
            # Setup handlers
            await self._setup_handlers()
            
            # Setup bot commands
            await self._setup_commands()
            
            # Register error handler
            self.application.add_error_handler(self._error_handler)
            
            logger.info("✅ Application initialized successfully")
            logger.info("✅ Bot initialization complete")
            
        except Exception as e:
            logger.exception(f"❌ Failed to initialize bot: {e}")
            raise

    async def _setup_handlers(self) -> None:
        """Setup all command, message, and callback handlers."""
        app = self.application
        
        # Main conversation handler for project creation
        conversation_handler = ConversationHandler(
            entry_points=[
                CommandHandler("start", self.handlers.start_command),
                CallbackQueryHandler(
                    self.handlers.new_project_callback,
                    pattern="^new_project$"
                )
            ],
            states={
                ConversationStates.WAITING_URL: [
                    MessageHandler(
                        filters.TEXT & ~filters.COMMAND,
                        self.handlers.handle_url_input
                    )
                ],
                ConversationStates.ANALYZING_WEBSITE: [
                    CallbackQueryHandler(
                        self.handlers.handle_analysis_callback,
                        pattern="^analysis_"
                    )
                ],
                ConversationStates.WAITING_CREDENTIALS: [
                    MessageHandler(
                        filters.TEXT & ~filters.COMMAND,
                        self.handlers.handle_credentials_input
                    )
                ],
                ConversationStates.VALIDATING_CREDENTIALS: [
                    CallbackQueryHandler(
                        self.handlers.handle_validation_callback,
                        pattern="^validation_"
                    )
                ],
                ConversationStates.DISCOVERING_APIS: [
                    CallbackQueryHandler(
                        self.handlers.handle_discovery_callback,
                        pattern="^discovery_"
                    )
                ],
                ConversationStates.GENERATING_CHECKER: [
                    CallbackQueryHandler(
                        self.handlers.handle_generation_callback,
                        pattern="^generation_"
                    )
                ]
            },
            fallbacks=[
                CommandHandler("cancel", self.handlers.cancel_command),
                CommandHandler("start", self.handlers.start_command)
            ],
            name="main_conversation",
            persistent=True
        )
        
        app.add_handler(conversation_handler)
        
        # Additional command handlers
        app.add_handler(CommandHandler("help", self.handlers.help_command))
        app.add_handler(CommandHandler("status", self.handlers.status_command))
        app.add_handler(CommandHandler("myprojects", self.handlers.projects_command))
        app.add_handler(CommandHandler("settings", self.handlers.settings_command))
        app.add_handler(CommandHandler("stats", self.handlers.stats_command))
        
        # Callback query handlers
        app.add_handler(
            CallbackQueryHandler(
                self.handlers.handle_language_callback,
                pattern="^lang_"
            )
        )
        app.add_handler(
            CallbackQueryHandler(
                self.handlers.handle_menu_callback,
                pattern="^menu_"
            )
        )
        app.add_handler(
            CallbackQueryHandler(
                self.handlers.handle_project_callback,
                pattern="^project_"
            )
        )
        
        # Inline query handler for search
        if self.config.enable_inline_mode:
            from telegram.ext import InlineQueryHandler
            app.add_handler(
                InlineQueryHandler(self.handlers.handle_inline_query)
            )
        
        logger.info("✅ All handlers registered")

    async def _setup_commands(self) -> None:
        """Setup bot commands visible in Telegram menu."""
        commands = [
            BotCommand("start", "🚀 Start the bot / Main menu"),
            BotCommand("help", "❓ Show help and documentation"),
            BotCommand("myprojects", "📁 View your projects"),
            BotCommand("status", "📊 Check current status"),
            BotCommand("settings", "⚙️ Bot settings"),
            BotCommand("stats", "📈 View statistics"),
            BotCommand("cancel", "❌ Cancel current operation")
        ]
        
        try:
            await self.application.bot.set_my_commands(commands)
            logger.info("✅ Bot commands registered")
        except TelegramError as e:
            logger.error(f"❌ Failed to register commands: {e}")

    async def start(self) -> None:
        """Start the bot (Python 3.14 compatible)."""
        try:
            logger.info("🚀 Starting Telegram bot...")
            
            # Initialize if not already done
            if not self.application:
                await self.initialize()
            
            # Start the bot
            await self.application.initialize()
            await self.application.start()
            
            # Get bot info
            bot_info = await self.application.bot.get_me()
            logger.info(f"✅ Bot started successfully (Python 3.14 compatible mode)")
            logger.info(f"   Username: @{bot_info.username}")
            logger.info(f"   Name: {bot_info.first_name}")
            logger.info(f"   ID: {bot_info.id}")
            
            # Python 3.14 fix: Manual polling without Updater
            self._running = True
            logger.info("🎯 Bot is now running! Press Ctrl+C to stop.")
            
            # Start manual update fetching loop
            await self._poll_updates()
            
        except Exception as e:
            logger.exception(f"❌ Failed to start bot: {e}")
            raise

    async def _poll_updates(self) -> None:
        """
        Manual polling loop for Python 3.14 compatibility.
        Replaces the broken Updater.start_polling().
        """
        offset = 0
        timeout = 30
        
        logger.info("📡 Starting manual polling loop (Python 3.14 mode)...")
        
        while self._running:
            try:
                # Get updates from Telegram
                updates = await self.application.bot.get_updates(
                    offset=offset,
                    timeout=timeout,
                    allowed_updates=Update.ALL_TYPES
                )
                
                # Process each update
                for update in updates:
                    offset = update.update_id + 1
                    
                    # Process update through application
                    await self.application.process_update(update)
                
                # Small delay to avoid hammering the API when no updates
                if not updates:
                    await asyncio.sleep(0.5)
                    
            except (NetworkError, TimedOut) as e:
                logger.warning(f"⚠️  Network error in polling: {e}")
                await asyncio.sleep(5)  # Wait before retry
                
            except TelegramError as e:
                # Catch other TelegramError types not already handled above
                logger.error(f"❌ Telegram error in polling: {e}")
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"❌ Unexpected error in polling: {e}")
                await asyncio.sleep(5)
        
        logger.info("🛑 Manual polling loop stopped")

    async def stop(self) -> None:
        """Stop the bot gracefully."""
        try:
            logger.info("🛑 Stopping bot...")
            
            self._running = False
            
            if self.application:
                # Python 3.14 fix: No updater to stop
                await self.application.stop()
                await self.application.shutdown()
            
            # Clean up active sessions
            self.active_sessions.clear()
            
            logger.info("✅ Bot stopped successfully")
            
        except Exception as e:
            logger.exception(f"❌ Error stopping bot: {e}")

    async def _error_handler(
        self,
        update: Optional[Update],
        context: ContextTypes.DEFAULT_TYPE
    ) -> None:
        """
        Handle errors that occur during update processing.
        
        Args:
            update: The update that caused the error
            context: The context with error information
        """
        logger.error(f"❌ Error handling update {update}:", exc_info=context.error)
        
        # Try to notify the user
        if update and update.effective_user:
            try:
                error_message = self.messages.get_error_message(
                    error_type="general",
                    language=context.user_data.get("language", "en")
                )
                
                if update.effective_message:
                    await update.effective_message.reply_text(
                        error_message,
                        parse_mode="Markdown"
                    )
            except Exception as e:
                logger.error(f"Failed to send error message to user: {e}")

    def get_session(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get active session for a user.
        
        Args:
            user_id: Telegram user ID
            
        Returns:
            Session data dictionary or None
        """
        return self.active_sessions.get(user_id)

    def create_session(
        self,
        user_id: int,
        project_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new session for a user.
        
        Args:
            user_id: Telegram user ID
            project_data: Initial project data
            
        Returns:
            Created session data
        """
        session = {
            "user_id": user_id,
            "created_at": datetime.now(),
            "project_data": project_data,
            "state": "initialized",
            "analysis_results": {},
            "discovered_apis": [],
            "generated_files": []
        }
        
        self.active_sessions[user_id] = session
        logger.info(f"✅ Created session for user {user_id}")
        
        return session

    def update_session(
        self,
        user_id: int,
        updates: Dict[str, Any]
    ) -> None:
        """
        Update session data for a user.
        
        Args:
            user_id: Telegram user ID
            updates: Dictionary of updates to apply
        """
        if user_id in self.active_sessions:
            self.active_sessions[user_id].update(updates)
            logger.debug(f"Updated session for user {user_id}")

    def close_session(self, user_id: int) -> None:
        """
        Close and clean up session for a user.
        
        Args:
            user_id: Telegram user ID
        """
        if user_id in self.active_sessions:
            del self.active_sessions[user_id]
            logger.info(f"✅ Closed session for user {user_id}")

    async def send_progress_update(
        self,
        user_id: int,
        message: str,
        progress: int = 0
    ) -> None:
        """
        Send a progress update to a user.
        
        Args:
            user_id: Telegram user ID
            message: Progress message
            progress: Progress percentage (0-100)
        """
        try:
            # Generate progress bar
            progress_bar = self._generate_progress_bar(progress)
            
            full_message = f"{message}\n\n{progress_bar}"
            
            await self.application.bot.send_message(
                chat_id=user_id,
                text=full_message,
                parse_mode="Markdown"
            )
        except Exception as e:
            logger.error(f"Failed to send progress update: {e}")

    def _generate_progress_bar(self, progress: int) -> str:
        """
        Generate a visual progress bar.
        
        Args:
            progress: Progress percentage (0-100)
            
        Returns:
            Progress bar string with emojis
        """
        filled = int(progress / 10)
        empty = 10 - filled
        
        bar = "🟦" * filled + "⬜" * empty
        return f"{bar} {progress}%"

    def get_stats(self) -> Dict[str, Any]:
        """
        Get bot statistics.
        
        Returns:
            Dictionary with bot statistics
        """
        uptime = datetime.now() - self.stats["start_time"]
        
        return {
            **self.stats,
            "uptime": str(uptime),
            "active_sessions": len(self.active_sessions)
        }

    async def broadcast_message(
        self,
        message: str,
        user_ids: Optional[List[int]] = None
    ) -> Dict[str, int]:
        """
        Broadcast a message to multiple users.
        
        Args:
            message: Message to broadcast
            user_ids: List of user IDs (None for all users)
            
        Returns:
            Dictionary with success and failure counts
        """
        if user_ids is None and self.db_manager:
            # Get all users from database
            user_ids = await self.db_manager.get_all_user_ids()
        
        success = 0
        failed = 0
        
        for user_id in user_ids:
            try:
                await self.application.bot.send_message(
                    chat_id=user_id,
                    text=message,
                    parse_mode="Markdown"
                )
                success += 1
                await asyncio.sleep(0.05)  # Rate limiting
            except Exception as e:
                logger.error(f"Failed to send to user {user_id}: {e}")
                failed += 1
        
        logger.info(f"📢 Broadcast complete: {success} sent, {failed} failed")
        
        return {"success": success, "failed": failed}


# Convenience function for quick bot startup
async def run_bot(token: Optional[str] = None):
    """
    Convenience function to quickly run the bot.
    
    Args:
        token: Bot token (uses default if not provided)
    """
    bot = TelegramAPICheckerBot(token=token)
    await bot.start()


if __name__ == "__main__":
    # For direct execution during development
    import sys
    asyncio.run(run_bot())
