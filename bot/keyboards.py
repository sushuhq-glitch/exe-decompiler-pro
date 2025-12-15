"""
Text-Based Menus for Telegram Bot
==================================

Simple number-based text menus for the bot UI.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

from typing import List, Dict, Any, Optional
from utils.config import Config

class BotKeyboards:
    """Manages all text-based menu layouts for the bot."""
    
    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
    
    def get_main_menu(self, language: str = "en") -> str:
        """Get main menu as text."""
        if language == "it":
            menu = "📋 **Menu Principale**\n\n"
            menu += "1️⃣ 🆕 Nuovo Progetto\n"
            menu += "2️⃣ 📁 I Miei Progetti\n"
            menu += "3️⃣ ⚙️ Impostazioni\n"
            menu += "4️⃣ ❓ Aiuto\n"
            menu += "5️⃣ 📊 Statistiche\n\n"
            menu += "Digita un numero (1-5) per selezionare:"
        else:
            menu = "📋 **Main Menu**\n\n"
            menu += "1️⃣ 🆕 New Project\n"
            menu += "2️⃣ 📁 My Projects\n"
            menu += "3️⃣ ⚙️ Settings\n"
            menu += "4️⃣ ❓ Help\n"
            menu += "5️⃣ 📊 Statistics\n\n"
            menu += "Type a number (1-5) to select:"
        return menu
    
    def get_analysis_options(self, language: str = "en") -> str:
        """Get analysis options as text."""
        if language == "it":
            menu = "🔍 **Analisi Completata**\n\n"
            menu += "1️⃣ ✅ Continua\n"
            menu += "2️⃣ 🔄 Ri-analizza\n"
            menu += "3️⃣ ❌ Annulla\n\n"
            menu += "Digita un numero (1-3) per selezionare:"
        else:
            menu = "🔍 **Analysis Complete**\n\n"
            menu += "1️⃣ ✅ Continue\n"
            menu += "2️⃣ 🔄 Re-analyze\n"
            menu += "3️⃣ ❌ Cancel\n\n"
            menu += "Type a number (1-3) to select:"
        return menu
    
    def get_discovery_options(self, language: str = "en") -> str:
        """Get API discovery options as text."""
        if language == "it":
            menu = "📡 **Scoperta API**\n\n"
            menu += "1️⃣ 🔍 Scopri API\n"
            menu += "2️⃣ ✅ Completa\n\n"
            menu += "Digita un numero (1-2) per selezionare:"
        else:
            menu = "📡 **API Discovery**\n\n"
            menu += "1️⃣ 🔍 Discover APIs\n"
            menu += "2️⃣ ✅ Complete\n\n"
            menu += "Type a number (1-2) to select:"
        return menu
    
    def get_generation_options(self, language: str = "en") -> str:
        """Get checker generation options as text."""
        if language == "it":
            menu = "⚙️ **Generazione Checker**\n\n"
            menu += "1️⃣ ⚙️ Genera Checker\n"
            menu += "2️⃣ ❌ Annulla\n\n"
            menu += "Digita un numero (1-2) per selezionare:"
        else:
            menu = "⚙️ **Checker Generation**\n\n"
            menu += "1️⃣ ⚙️ Generate Checker\n"
            menu += "2️⃣ ❌ Cancel\n\n"
            menu += "Type a number (1-2) to select:"
        return menu

__all__ = ["BotKeyboards"]
