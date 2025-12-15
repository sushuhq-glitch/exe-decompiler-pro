"""
Text-Based Menus for Telegram Bot
==================================

Simple number-based text menus for the bot UI.

Author: Telegram API Checker Bot Team
Version: 2.0.0
"""

from typing import Optional


class BotKeyboards:
    """Manages all text-based menu layouts for the bot."""
    
    def __init__(self, config: Optional[object] = None):
        self.config = config
    
    def get_main_menu(self, language: str = "en") -> str:
        """Get main menu as text."""
        if language == "it":
            menu = "🤖 **TELEGRAM API CHECKER BOT**\n\n"
            menu += "📋 Menu Principale:\n"
            menu += "1️⃣  Nuovo Progetto\n"
            menu += "2️⃣  Aiuto\n"
            menu += "3️⃣  I Miei Progetti\n"
            menu += "4️⃣  Stato\n"
            menu += "5️⃣  Impostazioni\n\n"
            menu += "💬 Digita 1-5"
        else:
            menu = "🤖 **TELEGRAM API CHECKER BOT**\n\n"
            menu += "📋 Main Menu:\n"
            menu += "1️⃣  New Project\n"
            menu += "2️⃣  Help\n"
            menu += "3️⃣  My Projects\n"
            menu += "4️⃣  Status\n"
            menu += "5️⃣  Settings\n\n"
            menu += "💬 Type 1-5"
        return menu
    
    def get_project_menu(self, language: str = "en") -> str:
        """Get project menu as text."""
        if language == "it":
            menu = "🆕 **NUOVO PROGETTO**\n\n"
            menu += "Invia l'URL del sito web"
        else:
            menu = "🆕 **NEW PROJECT**\n\n"
            menu += "Send website URL"
        return menu
    
    def get_credential_prompt(self, language: str = "en") -> str:
        """Get credential input prompt."""
        if language == "it":
            menu = "🔑 **CREDENZIALI REALI**\n\n"
            menu += "Invia credenziali valide\n"
            menu += "Formato: email:password"
        else:
            menu = "🔑 **VALID CREDENTIALS**\n\n"
            menu += "Send valid credentials\n"
            menu += "Format: email:password"
        return menu
    
    def get_continue_menu(self, language: str = "en") -> str:
        """Get continuation menu."""
        if language == "it":
            menu = "1️⃣  Continua\n"
            menu += "2️⃣  Menu Principale\n\n"
            menu += "💬 Digita 1-2"
        else:
            menu = "1️⃣  Continue\n"
            menu += "2️⃣  Main Menu\n\n"
            menu += "💬 Type 1-2"
        return menu

__all__ = ["BotKeyboards"]
