"""
Inline Keyboards for Telegram Bot
==================================

Beautiful inline keyboard layouts with emojis for the bot UI.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

from typing import List, Dict, Any, Optional
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from utils.config import Config

class BotKeyboards:
    """Manages all inline keyboard layouts for the bot."""
    
    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
    
    def get_main_menu(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get main menu keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("🆕 Nuovo Progetto", callback_data="new_project")],
                [InlineKeyboardButton("📁 I Miei Progetti", callback_data="menu_my_projects")],
                [InlineKeyboardButton("⚙️ Impostazioni", callback_data="menu_settings")],
                [InlineKeyboardButton("❓ Aiuto", callback_data="menu_help")],
                [InlineKeyboardButton("📊 Statistiche", callback_data="menu_stats")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("🆕 New Project", callback_data="new_project")],
                [InlineKeyboardButton("📁 My Projects", callback_data="menu_my_projects")],
                [InlineKeyboardButton("⚙️ Settings", callback_data="menu_settings")],
                [InlineKeyboardButton("❓ Help", callback_data="menu_help")],
                [InlineKeyboardButton("📊 Statistics", callback_data="menu_stats")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_language_selection(self) -> InlineKeyboardMarkup:
        """Get language selection keyboard."""
        keyboard = [
            [InlineKeyboardButton("🇬🇧 English", callback_data="lang_en")],
            [InlineKeyboardButton("🇮🇹 Italiano", callback_data="lang_it")],
            [InlineKeyboardButton("🔙 Back", callback_data="menu_back")]
        ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_analysis_options(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get analysis options keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("✅ Continua", callback_data="analysis_continue")],
                [InlineKeyboardButton("🔄 Ri-analizza", callback_data="analysis_retry")],
                [InlineKeyboardButton("❌ Annulla", callback_data="analysis_cancel")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("✅ Continue", callback_data="analysis_continue")],
                [InlineKeyboardButton("🔄 Re-analyze", callback_data="analysis_retry")],
                [InlineKeyboardButton("❌ Cancel", callback_data="analysis_cancel")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_validation_options(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get validation options keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("✅ Credenziali OK", callback_data="validation_success")],
                [InlineKeyboardButton("🔄 Riprova", callback_data="validation_retry")],
                [InlineKeyboardButton("❌ Annulla", callback_data="validation_cancel")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("✅ Credentials OK", callback_data="validation_success")],
                [InlineKeyboardButton("🔄 Retry", callback_data="validation_retry")],
                [InlineKeyboardButton("❌ Cancel", callback_data="validation_cancel")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_discovery_options(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get API discovery options keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("🔍 Scopri API", callback_data="discovery_start")],
                [InlineKeyboardButton("➕ Aggiungi Manualmente", callback_data="discovery_manual")],
                [InlineKeyboardButton("✅ Completa", callback_data="discovery_complete")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("🔍 Discover APIs", callback_data="discovery_start")],
                [InlineKeyboardButton("➕ Add Manually", callback_data="discovery_manual")],
                [InlineKeyboardButton("✅ Complete", callback_data="discovery_complete")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_generation_options(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get checker generation options keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("⚙️ Genera Checker", callback_data="generation_start")],
                [InlineKeyboardButton("🎨 Personalizza", callback_data="generation_customize")],
                [InlineKeyboardButton("❌ Annulla", callback_data="generation_cancel")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("⚙️ Generate Checker", callback_data="generation_start")],
                [InlineKeyboardButton("🎨 Customize", callback_data="generation_customize")],
                [InlineKeyboardButton("❌ Cancel", callback_data="generation_cancel")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_project_list_keyboard(self, projects: List[Dict], language: str = "en") -> InlineKeyboardMarkup:
        """Get project list keyboard."""
        keyboard = []
        for project in projects[:10]:
            button_text = f"📁 {project.get('name', 'Unnamed')}"
            callback_data = f"project_{project.get('id')}"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=callback_data)])
        
        back_text = "🔙 Indietro" if language == "it" else "🔙 Back"
        keyboard.append([InlineKeyboardButton(back_text, callback_data="menu_main")])
        
        return InlineKeyboardMarkup(keyboard)
    
    def get_project_actions_keyboard(self, project_id: int, language: str = "en") -> InlineKeyboardMarkup:
        """Get project actions keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("👁️ Visualizza", callback_data=f"project_view_{project_id}")],
                [InlineKeyboardButton("⬇️ Scarica", callback_data=f"project_download_{project_id}")],
                [InlineKeyboardButton("✏️ Modifica", callback_data=f"project_edit_{project_id}")],
                [InlineKeyboardButton("🗑️ Elimina", callback_data=f"project_delete_{project_id}")],
                [InlineKeyboardButton("🔙 Indietro", callback_data="menu_my_projects")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("👁️ View", callback_data=f"project_view_{project_id}")],
                [InlineKeyboardButton("⬇️ Download", callback_data=f"project_download_{project_id}")],
                [InlineKeyboardButton("✏️ Edit", callback_data=f"project_edit_{project_id}")],
                [InlineKeyboardButton("🗑️ Delete", callback_data=f"project_delete_{project_id}")],
                [InlineKeyboardButton("🔙 Back", callback_data="menu_my_projects")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_confirmation_keyboard(self, action: str, language: str = "en") -> InlineKeyboardMarkup:
        """Get confirmation keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("✅ Sì", callback_data=f"confirm_{action}")],
                [InlineKeyboardButton("❌ No", callback_data=f"cancel_{action}")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("✅ Yes", callback_data=f"confirm_{action}")],
                [InlineKeyboardButton("❌ No", callback_data=f"cancel_{action}")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_settings_keyboard(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get settings keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("🌐 Lingua", callback_data="settings_language")],
                [InlineKeyboardButton("🔐 Proxy", callback_data="settings_proxy")],
                [InlineKeyboardButton("🔔 Notifiche", callback_data="settings_notifications")],
                [InlineKeyboardButton("⚡ Prestazioni", callback_data="settings_performance")],
                [InlineKeyboardButton("🔙 Menu Principale", callback_data="menu_main")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("🌐 Language", callback_data="settings_language")],
                [InlineKeyboardButton("🔐 Proxy", callback_data="settings_proxy")],
                [InlineKeyboardButton("🔔 Notifications", callback_data="settings_notifications")],
                [InlineKeyboardButton("⚡ Performance", callback_data="settings_performance")],
                [InlineKeyboardButton("🔙 Main Menu", callback_data="menu_main")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_endpoint_type_keyboard(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get endpoint type selection keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("👤 Profilo", callback_data="endpoint_profile")],
                [InlineKeyboardButton("💳 Pagamento", callback_data="endpoint_payment")],
                [InlineKeyboardButton("📦 Ordini", callback_data="endpoint_orders")],
                [InlineKeyboardButton("📍 Indirizzi", callback_data="endpoint_addresses")],
                [InlineKeyboardButton("💰 Wallet", callback_data="endpoint_wallet")],
                [InlineKeyboardButton("🔙 Indietro", callback_data="discovery_main")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("👤 Profile", callback_data="endpoint_profile")],
                [InlineKeyboardButton("💳 Payment", callback_data="endpoint_payment")],
                [InlineKeyboardButton("📦 Orders", callback_data="endpoint_orders")],
                [InlineKeyboardButton("📍 Addresses", callback_data="endpoint_addresses")],
                [InlineKeyboardButton("💰 Wallet", callback_data="endpoint_wallet")],
                [InlineKeyboardButton("🔙 Back", callback_data="discovery_main")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_checker_options_keyboard(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get checker generation options keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("🔄 Multi-threading: ON", callback_data="checker_toggle_threading")],
                [InlineKeyboardButton("🌐 Proxy: ON", callback_data="checker_toggle_proxy")],
                [InlineKeyboardButton("⚡ Rate Limiting: ON", callback_data="checker_toggle_ratelimit")],
                [InlineKeyboardButton("📊 Progress Bar: ON", callback_data="checker_toggle_progress")],
                [InlineKeyboardButton("✅ Genera", callback_data="checker_generate")],
                [InlineKeyboardButton("🔙 Indietro", callback_data="menu_main")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("🔄 Multi-threading: ON", callback_data="checker_toggle_threading")],
                [InlineKeyboardButton("🌐 Proxy: ON", callback_data="checker_toggle_proxy")],
                [InlineKeyboardButton("⚡ Rate Limiting: ON", callback_data="checker_toggle_ratelimit")],
                [InlineKeyboardButton("📊 Progress Bar: ON", callback_data="checker_toggle_progress")],
                [InlineKeyboardButton("✅ Generate", callback_data="checker_generate")],
                [InlineKeyboardButton("🔙 Back", callback_data="menu_main")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_export_format_keyboard(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get export format selection keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("📦 ZIP Archive", callback_data="export_zip")],
                [InlineKeyboardButton("📄 File Separati", callback_data="export_separate")],
                [InlineKeyboardButton("🐙 GitHub Repo", callback_data="export_github")],
                [InlineKeyboardButton("🔙 Indietro", callback_data="menu_main")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("📦 ZIP Archive", callback_data="export_zip")],
                [InlineKeyboardButton("📄 Separate Files", callback_data="export_separate")],
                [InlineKeyboardButton("🐙 GitHub Repo", callback_data="export_github")],
                [InlineKeyboardButton("🔙 Back", callback_data="menu_main")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_help_topics_keyboard(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get help topics keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("🚀 Come Iniziare", callback_data="help_getting_started")],
                [InlineKeyboardButton("🔍 Analisi Sito", callback_data="help_analysis")],
                [InlineKeyboardButton("🔐 Validazione", callback_data="help_validation")],
                [InlineKeyboardButton("📡 Discovery API", callback_data="help_discovery")],
                [InlineKeyboardButton("⚙️ Generazione Checker", callback_data="help_generation")],
                [InlineKeyboardButton("❓ FAQ", callback_data="help_faq")],
                [InlineKeyboardButton("🔙 Menu Principale", callback_data="menu_main")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("🚀 Getting Started", callback_data="help_getting_started")],
                [InlineKeyboardButton("🔍 Site Analysis", callback_data="help_analysis")],
                [InlineKeyboardButton("🔐 Validation", callback_data="help_validation")],
                [InlineKeyboardButton("📡 API Discovery", callback_data="help_discovery")],
                [InlineKeyboardButton("⚙️ Checker Generation", callback_data="help_generation")],
                [InlineKeyboardButton("❓ FAQ", callback_data="help_faq")],
                [InlineKeyboardButton("🔙 Main Menu", callback_data="menu_main")]
            ]
        return InlineKeyboardMarkup(keyboard)
    
    def get_pagination_keyboard(
        self,
        current_page: int,
        total_pages: int,
        callback_prefix: str,
        language: str = "en"
    ) -> InlineKeyboardMarkup:
        """Get pagination keyboard."""
        keyboard = []
        nav_row = []
        
        if current_page > 1:
            nav_row.append(InlineKeyboardButton("⬅️ Prev", callback_data=f"{callback_prefix}_page_{current_page-1}"))
        
        nav_row.append(InlineKeyboardButton(f"{current_page}/{total_pages}", callback_data="page_info"))
        
        if current_page < total_pages:
            nav_row.append(InlineKeyboardButton("Next ➡️", callback_data=f"{callback_prefix}_page_{current_page+1}"))
        
        keyboard.append(nav_row)
        
        back_text = "🔙 Indietro" if language == "it" else "🔙 Back"
        keyboard.append([InlineKeyboardButton(back_text, callback_data="menu_main")])
        
        return InlineKeyboardMarkup(keyboard)
    
    def get_api_method_keyboard(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get API method selection keyboard."""
        keyboard = [
            [InlineKeyboardButton("GET", callback_data="method_get")],
            [InlineKeyboardButton("POST", callback_data="method_post")],
            [InlineKeyboardButton("PUT", callback_data="method_put")],
            [InlineKeyboardButton("DELETE", callback_data="method_delete")],
            [InlineKeyboardButton("PATCH", callback_data="method_patch")]
        ]
        
        back_text = "🔙 Indietro" if language == "it" else "🔙 Back"
        keyboard.append([InlineKeyboardButton(back_text, callback_data="endpoint_back")])
        
        return InlineKeyboardMarkup(keyboard)
    
    def get_auth_type_keyboard(self, language: str = "en") -> InlineKeyboardMarkup:
        """Get authentication type selection keyboard."""
        if language == "it":
            keyboard = [
                [InlineKeyboardButton("🔑 Bearer Token", callback_data="auth_bearer")],
                [InlineKeyboardButton("🍪 Cookie", callback_data="auth_cookie")],
                [InlineKeyboardButton("🔐 Basic Auth", callback_data="auth_basic")],
                [InlineKeyboardButton("📝 API Key", callback_data="auth_apikey")],
                [InlineKeyboardButton("🎫 JWT", callback_data="auth_jwt")],
                [InlineKeyboardButton("🔙 Indietro", callback_data="menu_back")]
            ]
        else:
            keyboard = [
                [InlineKeyboardButton("🔑 Bearer Token", callback_data="auth_bearer")],
                [InlineKeyboardButton("🍪 Cookie", callback_data="auth_cookie")],
                [InlineKeyboardButton("🔐 Basic Auth", callback_data="auth_basic")],
                [InlineKeyboardButton("📝 API Key", callback_data="auth_apikey")],
                [InlineKeyboardButton("🎫 JWT", callback_data="auth_jwt")],
                [InlineKeyboardButton("🔙 Back", callback_data="menu_back")]
            ]
        return InlineKeyboardMarkup(keyboard)

__all__ = ["BotKeyboards"]
