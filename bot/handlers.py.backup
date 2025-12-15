"""
Bot Command and Callback Handlers
==================================

Comprehensive handlers for all bot commands, messages, and callbacks.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler
from .states import ConversationStates
from .keyboards import BotKeyboards
from .messages import BotMessages
from utils.logger import get_logger
from utils.config import Config
from database.db_manager import DatabaseManager
from analyzer.website_analyzer import WebsiteAnalyzer
from validator.credential_validator import CredentialValidator
from discovery.api_discovery import APIDiscovery
from generator.checker_generator import CheckerGenerator

logger = get_logger(__name__)


class BotHandlers:
    """Handles all bot commands, messages, and callbacks."""
    
    def __init__(
        self,
        config: Config,
        db: DatabaseManager,
        keyboards: BotKeyboards,
        messages: BotMessages
    ):
        self.config = config
        self.db = db
        self.keyboards = keyboards
        self.messages = messages
        self.analyzer = WebsiteAnalyzer()
        self.validator = CredentialValidator()
        self.discovery = APIDiscovery()
        self.generator = CheckerGenerator()
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle /start command."""
        user = update.effective_user
        language = context.user_data.get("language", "en")
        
        # Register user in database
        # await self.db.register_user(user.id, user.username, user.first_name)
        logger.info(f"👤 User {user.id} ({user.first_name}) started the bot")
        
        # Send welcome message
        message = self.messages.get_start_message(language, user.first_name)
        menu = self.keyboards.get_main_menu(language)
        
        await update.message.reply_text(
            f"{message}\n\n{menu}",
            parse_mode="Markdown"
        )
        
        return ConversationStates.MAIN_MENU
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle number-based menu selections."""
        text = update.message.text.strip()
        user_id = update.effective_user.id
        language = context.user_data.get("language", "en")
        
        # Get current state
        current_state = context.user_data.get("state", ConversationStates.MAIN_MENU)
        
        if current_state == ConversationStates.MAIN_MENU:
            # Main menu options
            if text == "1":
                # New Project
                message = self.messages.get_url_prompt(language)
                await update.message.reply_text(message, parse_mode="Markdown")
                return ConversationStates.WAITING_URL
            elif text == "2":
                # My Projects
                await self.projects_command(update, context)
                return ConversationStates.MAIN_MENU
            elif text == "3":
                # Settings
                await self.settings_command(update, context)
                return ConversationStates.MAIN_MENU
            elif text == "4":
                # Help
                await self.help_command(update, context)
                return ConversationStates.MAIN_MENU
            elif text == "5":
                # Statistics
                await self.stats_command(update, context)
                return ConversationStates.MAIN_MENU
            else:
                menu = self.keyboards.get_main_menu(language)
                await update.message.reply_text(
                    f"❌ Invalid option. Please select 1-5.\n\n{menu}",
                    parse_mode="Markdown"
                )
                return ConversationStates.MAIN_MENU
        
        return ConversationStates.MAIN_MENU
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /help command."""
        language = context.user_data.get("language", "en")
        message = self.messages.get_help_message(language)
        
        await update.message.reply_text(
            message,
            parse_mode="Markdown"
        )
    
    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /status command."""
        user_id = update.effective_user.id
        session = context.bot_data.get(f"session_{user_id}")
        
        if session:
            state = session.get("state", "unknown")
            progress = session.get("progress", 0)
            
            status_msg = f"📊 **Current Status**\n\n"
            status_msg += f"State: {state}\n"
            status_msg += f"Progress: {progress}%\n"
            
            if "project_data" in session:
                project = session["project_data"]
                status_msg += f"\nProject: {project.get('name', 'Unnamed')}\n"
                status_msg += f"URL: {project.get('url', 'N/A')}"
        else:
            status_msg = "ℹ️ No active session. Use /start to begin!"
        
        await update.message.reply_text(status_msg, parse_mode="Markdown")
    
    async def projects_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /myprojects command."""
        user_id = update.effective_user.id
        language = context.user_data.get("language", "en")
        
        # Temporarily return empty list - get_user_projects not implemented yet
        projects = []
        
        if projects:
            msg = f"📁 **Your Projects** ({len(projects)})\n\nSelect a project to view details:"
        else:
            msg = "📁 **Your Projects**\n\nYou don't have any projects yet.\nUse /start to create one!"
        
        await update.message.reply_text(
            msg,
            parse_mode="Markdown"
        )
    
    async def settings_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /settings command."""
        language = context.user_data.get("language", "en")
        
        msg = "⚙️ **Settings**\n\nSettings feature coming soon!"
        await update.message.reply_text(
            msg,
            parse_mode="Markdown"
        )
    
    async def stats_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /stats command."""
        language = context.user_data.get("language", "en")
        stats = await self.db.get_bot_stats()
        
        message = self.messages.get_stats_message(stats, language)
        await update.message.reply_text(message, parse_mode="Markdown")
    
    async def cancel_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle /cancel command."""
        user_id = update.effective_user.id
        language = context.user_data.get("language", "en")
        
        # Clean up session
        if f"session_{user_id}" in context.bot_data:
            del context.bot_data[f"session_{user_id}"]
        
        message = self.messages.get_cancel_message(language)
        await update.message.reply_text(message, parse_mode="Markdown")
        
        return ConversationHandler.END
    
    async def handle_url_input(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle URL input from user."""
        url = update.message.text.strip()
        user_id = update.effective_user.id
        language = context.user_data.get("language", "en")
        
        # Validate URL
        if not self._is_valid_url(url):
            error_msg = self.messages.get_error_message("invalid_url", language)
            await update.message.reply_text(error_msg, parse_mode="Markdown")
            return ConversationStates.WAITING_URL
        
        # Start analysis
        analyzing_msg = self.messages.get_analyzing_message(url, language)
        status_message = await update.message.reply_text(analyzing_msg, parse_mode="Markdown")
        
        # Perform website analysis
        try:
            results = await self.analyzer.analyze(url)
            
            # Store results in session
            context.bot_data[f"session_{user_id}"] = {
                "url": url,
                "analysis_results": results,
                "state": "analyzed",
                "progress": 30
            }
            
            # Show results
            result_msg = self.messages.get_analysis_complete_message(results, language)
            menu = self.keyboards.get_analysis_options(language)
            
            await status_message.edit_text(
                f"{result_msg}\n\n{menu}",
                parse_mode="Markdown"
            )
            
            return ConversationStates.ANALYZING_WEBSITE
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            error_msg = self.messages.get_error_message("analysis_failed", language)
            await status_message.edit_text(error_msg, parse_mode="Markdown")
            return ConversationStates.WAITING_URL
    
    async def handle_analysis_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle analysis menu selections."""
        text = update.message.text.strip()
        language = context.user_data.get("language", "en")
        
        if text == "1":  # Continue
            message = self.messages.get_credentials_prompt(language)
            await update.message.reply_text(message, parse_mode="Markdown")
            return ConversationStates.WAITING_CREDENTIALS
        
        elif text == "2":  # Retry
            message = self.messages.get_url_prompt(language)
            await update.message.reply_text(message, parse_mode="Markdown")
            return ConversationStates.WAITING_URL
        
        elif text == "3":  # Cancel
            message = self.messages.get_cancel_message(language)
            await update.message.reply_text(message, parse_mode="Markdown")
            return ConversationHandler.END
        
        else:
            menu = self.keyboards.get_analysis_options(language)
            await update.message.reply_text(
                f"❌ Invalid option. Please select 1-3.\n\n{menu}",
                parse_mode="Markdown"
            )
            return ConversationStates.ANALYZING_WEBSITE
    
    async def handle_credentials_input(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle credentials input."""
        credentials = update.message.text.strip()
        user_id = update.effective_user.id
        language = context.user_data.get("language", "en")
        
        # Validate format
        if ":" not in credentials:
            error_msg = self.messages.get_error_message("invalid_credentials", language)
            await update.message.reply_text(error_msg, parse_mode="Markdown")
            return ConversationStates.WAITING_CREDENTIALS
        
        email, password = credentials.split(":", 1)
        
        # Start validation
        validating_msg = self.messages.get_validating_message(language)
        status_message = await update.message.reply_text(validating_msg, parse_mode="Markdown")
        
        # Validate credentials
        try:
            session = context.bot_data.get(f"session_{user_id}", {})
            analysis_results = session.get("analysis_results", {})
            
            validation_result = await self.validator.validate(
                url=session.get("url"),
                email=email,
                password=password,
                login_endpoint=analysis_results.get("login_url")
            )
            
            if validation_result.get("success"):
                # Store tokens
                session["tokens"] = validation_result.get("tokens", {})
                session["state"] = "validated"
                session["progress"] = 50
                context.bot_data[f"session_{user_id}"] = session
                
                # Show success
                success_msg = self.messages.get_validation_success_message(
                    validation_result.get("tokens", {}),
                    language
                )
                menu = self.keyboards.get_discovery_options(language)
                
                await status_message.edit_text(
                    f"{success_msg}\n\n{menu}",
                    parse_mode="Markdown"
                )
                
                return ConversationStates.DISCOVERING_APIS
            else:
                error_msg = self.messages.get_error_message("validation_failed", language)
                await status_message.edit_text(
                    error_msg,
                    parse_mode="Markdown"
                )
                return ConversationStates.WAITING_CREDENTIALS
                
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            error_msg = self.messages.get_error_message("validation_failed", language)
            await status_message.edit_text(error_msg, parse_mode="Markdown")
            return ConversationStates.WAITING_CREDENTIALS
    

    
    async def handle_discovery_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle API discovery menu selections."""
        text = update.message.text.strip()
        user_id = update.effective_user.id
        language = context.user_data.get("language", "en")
        
        if text == "1":  # Discover APIs
            # Start API discovery
            discovering_msg = self.messages.get_discovering_message(language)
            status_message = await update.message.reply_text(discovering_msg, parse_mode="Markdown")
            
            try:
                session = context.bot_data.get(f"session_{user_id}", {})
                tokens = session.get("tokens", {})
                
                endpoints = await self.discovery.discover_endpoints(
                    base_url=session.get("url"),
                    tokens=tokens
                )
                
                # Store endpoints
                session["endpoints"] = endpoints
                session["state"] = "discovered"
                session["progress"] = 70
                context.bot_data[f"session_{user_id}"] = session
                
                # Show results
                result_msg = self.messages.get_discovery_complete_message(endpoints, language)
                menu = self.keyboards.get_generation_options(language)
                
                await status_message.edit_text(
                    f"{result_msg}\n\n{menu}",
                    parse_mode="Markdown"
                )
                
                return ConversationStates.GENERATING_CHECKER
                
            except Exception as e:
                logger.error(f"Discovery failed: {e}")
                error_msg = self.messages.get_error_message("discovery_failed", language)
                await status_message.edit_text(error_msg, parse_mode="Markdown")
                return ConversationStates.DISCOVERING_APIS
        
        elif text == "2":  # Complete
            menu = self.keyboards.get_generation_options(language)
            await update.message.reply_text(menu, parse_mode="Markdown")
            return ConversationStates.GENERATING_CHECKER
        
        else:
            menu = self.keyboards.get_discovery_options(language)
            await update.message.reply_text(
                f"❌ Invalid option. Please select 1-2.\n\n{menu}",
                parse_mode="Markdown"
            )
            return ConversationStates.DISCOVERING_APIS
    
    async def handle_generation_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle checker generation menu selections."""
        text = update.message.text.strip()
        user_id = update.effective_user.id
        language = context.user_data.get("language", "en")
        
        if text == "1":  # Generate Checker
            # Start checker generation
            generating_msg = self.messages.get_generating_message(language)
            status_message = await update.message.reply_text(generating_msg, parse_mode="Markdown")
            
            try:
                session = context.bot_data.get(f"session_{user_id}", {})
                
                files = await self.generator.generate_checker(
                    url=session.get("url"),
                    endpoints=session.get("endpoints", []),
                    tokens=session.get("tokens", {})
                )
                
                # Store files
                session["files"] = files
                session["state"] = "complete"
                session["progress"] = 100
                context.bot_data[f"session_{user_id}"] = session
                
                # Show success
                success_msg = self.messages.get_generation_complete_message(files, language)
                await status_message.edit_text(success_msg, parse_mode="Markdown")
                
                # Send files
                for file_info in files:
                    with open(file_info["path"], "rb") as f:
                        await update.message.reply_document(
                            document=f,
                            filename=file_info["name"],
                            caption=f"✅ {file_info['name']}"
                        )
                
                # Show main menu again
                menu = self.keyboards.get_main_menu(language)
                await update.message.reply_text(
                    f"🎉 All done! What's next?\n\n{menu}"
                )
                
                return ConversationStates.COMPLETE
                
            except Exception as e:
                logger.error(f"Generation failed: {e}")
                error_msg = self.messages.get_error_message("generation_failed", language)
                await status_message.edit_text(error_msg, parse_mode="Markdown")
                return ConversationStates.GENERATING_CHECKER
        
        elif text == "2":  # Cancel
            message = self.messages.get_cancel_message(language)
            await update.message.reply_text(message, parse_mode="Markdown")
            return ConversationHandler.END
        
        else:
            menu = self.keyboards.get_generation_options(language)
            await update.message.reply_text(
                f"❌ Invalid option. Please select 1-2.\n\n{menu}",
                parse_mode="Markdown"
            )
            return ConversationStates.GENERATING_CHECKER
    

    
    def _is_valid_url(self, url: str) -> bool:
        """Validate URL format."""
        import re
        url_pattern = re.compile(
            r'^(?:http|https)://|^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}',
            re.IGNORECASE
        )
        return bool(url_pattern.match(url))


__all__ = ["BotHandlers"]
