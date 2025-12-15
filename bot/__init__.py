"""
Telegram Bot Module
===================

This module contains all Telegram bot-related functionality including:
- Bot initialization and configuration
- Command handlers
- Inline keyboards
- Message templates
- Conversation state management
- Middleware for request processing

The bot provides a beautiful user interface with emojis and supports
both Italian and English languages.

Components:
-----------
- telegram_bot: Main bot class
- handlers: Command and callback handlers
- keyboards: Inline keyboard layouts
- messages: Message templates for both languages
- states: Conversation state definitions
- middleware: Request/response middleware

Usage:
------
    from bot import TelegramAPICheckerBot
    
    bot = TelegramAPICheckerBot(token="YOUR_TOKEN")
    await bot.start()

Author: Telegram API Checker Bot Team
Version: 1.0.0
License: MIT
"""

__version__ = "1.0.0"
__author__ = "Telegram API Checker Bot Team"
__all__ = [
    "TelegramAPICheckerBot",
    "BotHandlers",
    "BotKeyboards",
    "BotMessages",
    "ConversationStates",
    "BotMiddleware"
]

from .telegram_bot import TelegramAPICheckerBot
from .handlers import BotHandlers
from .keyboards import BotKeyboards
from .messages import BotMessages
from .states import ConversationStates
from .middleware import BotMiddleware
