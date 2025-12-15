"""
Message Templates for Telegram Bot
===================================

Multi-language message templates with beautiful formatting.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

from typing import Dict, Any, Optional
from utils.config import Config

class BotMessages:
    """Manages all message templates for the bot."""
    
    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
    
    def get_start_message(self, language: str = "en", username: Optional[str] = None) -> str:
        """Get welcome/start message."""
        if language == "it":
            greeting = f"Ciao {username}! 👋\n\n" if username else "Ciao! 👋\n\n"
            return (
                f"{greeting}"
                "🤖 **Benvenuto in Telegram API Checker Bot!**\n\n"
                "Sono un bot avanzato che ti aiuta a:\n"
                "✅ Analizzare siti web automaticamente\n"
                "✅ Catturare API di login\n"
                "✅ Estrarre token e cookie\n"
                "✅ Scoprire endpoint (profile, payment, orders)\n"
                "✅ Generare checker Python funzionanti\n\n"
                "🚀 **Inizia ora** selezionando un'opzione dal menu!"
            )
        else:
            greeting = f"Hello {username}! 👋\n\n" if username else "Hello! 👋\n\n"
            return (
                f"{greeting}"
                "🤖 **Welcome to Telegram API Checker Bot!**\n\n"
                "I'm an advanced bot that helps you:\n"
                "✅ Automatically analyze websites\n"
                "✅ Capture login APIs\n"
                "✅ Extract tokens and cookies\n"
                "✅ Discover endpoints (profile, payment, orders)\n"
                "✅ Generate working Python checkers\n\n"
                "🚀 **Get started** by selecting an option from the menu!"
            )
    
    def get_help_message(self, language: str = "en") -> str:
        """Get help message."""
        if language == "it":
            return (
                "❓ **Centro Assistenza**\n\n"
                "**Comandi Disponibili:**\n"
                "• `/start` - Menu principale\n"
                "• `/help` - Mostra questo messaggio\n"
                "• `/myprojects` - I tuoi progetti\n"
                "• `/status` - Stato attuale\n"
                "• `/settings` - Impostazioni\n"
                "• `/cancel` - Annulla operazione\n\n"
                "**Come Usare:**\n"
                "1️⃣ Crea un nuovo progetto\n"
                "2️⃣ Inserisci l'URL del sito\n"
                "3️⃣ Attendi l'analisi\n"
                "4️⃣ Fornisci credenziali valide\n"
                "5️⃣ Scopri gli endpoint API\n"
                "6️⃣ Genera il checker Python\n\n"
                "📚 **Documentazione completa:** /docs\n"
                "💬 **Supporto:** @support"
            )
        else:
            return (
                "❓ **Help Center**\n\n"
                "**Available Commands:**\n"
                "• `/start` - Main menu\n"
                "• `/help` - Show this message\n"
                "• `/myprojects` - Your projects\n"
                "• `/status` - Current status\n"
                "• `/settings` - Settings\n"
                "• `/cancel` - Cancel operation\n\n"
                "**How to Use:**\n"
                "1️⃣ Create a new project\n"
                "2️⃣ Enter website URL\n"
                "3️⃣ Wait for analysis\n"
                "4️⃣ Provide valid credentials\n"
                "5️⃣ Discover API endpoints\n"
                "6️⃣ Generate Python checker\n\n"
                "📚 **Full documentation:** /docs\n"
                "💬 **Support:** @support"
            )
    
    def get_url_prompt(self, language: str = "en") -> str:
        """Get URL input prompt."""
        if language == "it":
            return (
                "🌐 **Inserisci l'URL del sito web**\n\n"
                "Esempi:\n"
                "• `glovo.it`\n"
                "• `https://www.example.com`\n"
                "• `app.service.com`\n\n"
                "ℹ️ Il bot troverà automaticamente la pagina di login!"
            )
        else:
            return (
                "🌐 **Enter the website URL**\n\n"
                "Examples:\n"
                "• `glovo.it`\n"
                "• `https://www.example.com`\n"
                "• `app.service.com`\n\n"
                "ℹ️ The bot will automatically find the login page!"
            )
    
    def get_analyzing_message(self, url: str, language: str = "en") -> str:
        """Get analyzing message."""
        if language == "it":
            return (
                f"🔍 **Analizzando:** `{url}`\n\n"
                "⏳ Attendere prego...\n\n"
                "📍 Ricerca pagina di login\n"
                "🔎 Analisi struttura HTML\n"
                "📡 Setup intercettore di rete\n"
                "🔐 Identificazione form di autenticazione"
            )
        else:
            return (
                f"🔍 **Analyzing:** `{url}`\n\n"
                "⏳ Please wait...\n\n"
                "📍 Finding login page\n"
                "🔎 Analyzing HTML structure\n"
                "📡 Setting up network interceptor\n"
                "🔐 Identifying authentication forms"
            )
    
    def get_analysis_complete_message(self, results: Dict[str, Any], language: str = "en") -> str:
        """Get analysis complete message."""
        if language == "it":
            return (
                "✅ **Analisi Completata!**\n\n"
                f"🌐 **Sito:** {results.get('url')}\n"
                f"📍 **Login URL:** {results.get('login_url')}\n"
                f"📝 **Form trovati:** {results.get('forms_count', 0)}\n"
                f"🔑 **Campi rilevati:** {results.get('fields_count', 0)}\n\n"
                "🎯 **Prossimo passo:**\n"
                "Fornisci credenziali valide per testare l'API"
            )
        else:
            return (
                "✅ **Analysis Complete!**\n\n"
                f"🌐 **Site:** {results.get('url')}\n"
                f"📍 **Login URL:** {results.get('login_url')}\n"
                f"📝 **Forms found:** {results.get('forms_count', 0)}\n"
                f"�� **Fields detected:** {results.get('fields_count', 0)}\n\n"
                "🎯 **Next step:**\n"
                "Provide valid credentials to test the API"
            )
    
    def get_credentials_prompt(self, language: str = "en") -> str:
        """Get credentials input prompt."""
        if language == "it":
            return (
                "🔐 **Inserisci credenziali valide**\n\n"
                "Formato: `email:password`\n\n"
                "Esempio:\n"
                "`test@example.com:mypassword123`\n\n"
                "⚠️ **Importante:**\n"
                "• Le credenziali vengono cifrate\n"
                "• Usate solo per validazione\n"
                "• Eliminate dopo il test\n"
                "• Mai salvate nei log"
            )
        else:
            return (
                "🔐 **Enter valid credentials**\n\n"
                "Format: `email:password`\n\n"
                "Example:\n"
                "`test@example.com:mypassword123`\n\n"
                "⚠️ **Important:**\n"
                "• Credentials are encrypted\n"
                "• Used only for validation\n"
                "• Deleted after testing\n"
                "• Never saved in logs"
            )
    
    def get_validating_message(self, language: str = "en") -> str:
        """Get validating credentials message."""
        if language == "it":
            return (
                "🔐 **Validazione credenziali...**\n\n"
                "⏳ Attendere prego...\n\n"
                "📡 Esecuzione login\n"
                "🔍 Cattura risposta API\n"
                "🔑 Estrazione token\n"
                "✅ Verifica autenticazione"
            )
        else:
            return (
                "🔐 **Validating credentials...**\n\n"
                "⏳ Please wait...\n\n"
                "📡 Executing login\n"
                "🔍 Capturing API response\n"
                "🔑 Extracting tokens\n"
                "✅ Verifying authentication"
            )
    
    def get_validation_success_message(self, tokens: Dict[str, Any], language: str = "en") -> str:
        """Get validation success message."""
        if language == "it":
            return (
                "✅ **Login Riuscito!**\n\n"
                f"🔑 **Token estratti:** {len(tokens)}\n"
                f"🍪 **Cookie:** {tokens.get('cookies_count', 0)}\n"
                f"📝 **Headers:** {tokens.get('headers_count', 0)}\n\n"
                "🎯 **Prossimo passo:**\n"
                "Scoperta automatica degli endpoint API"
            )
        else:
            return (
                "✅ **Login Successful!**\n\n"
                f"🔑 **Tokens extracted:** {len(tokens)}\n"
                f"🍪 **Cookies:** {tokens.get('cookies_count', 0)}\n"
                f"📝 **Headers:** {tokens.get('headers_count', 0)}\n\n"
                "🎯 **Next step:**\n"
                "Automatic API endpoint discovery"
            )
    
    def get_discovering_message(self, language: str = "en") -> str:
        """Get discovering APIs message."""
        if language == "it":
            return (
                "📡 **Scoperta API in corso...**\n\n"
                "⏳ Attendere prego...\n\n"
                "👤 Ricerca endpoint profilo\n"
                "💳 Ricerca endpoint pagamento\n"
                "📦 Ricerca endpoint ordini\n"
                "📍 Ricerca endpoint indirizzi\n"
                "💰 Ricerca endpoint wallet"
            )
        else:
            return (
                "📡 **Discovering APIs...**\n\n"
                "⏳ Please wait...\n\n"
                "👤 Finding profile endpoints\n"
                "💳 Finding payment endpoints\n"
                "📦 Finding order endpoints\n"
                "📍 Finding address endpoints\n"
                "💰 Finding wallet endpoints"
            )
    
    def get_discovery_complete_message(self, endpoints: list, language: str = "en") -> str:
        """Get discovery complete message."""
        endpoint_list = "\n".join([f"• {e.get('method')} {e.get('path')}" for e in endpoints[:10]])
        
        if language == "it":
            return (
                f"✅ **Scoperta Completata!**\n\n"
                f"📡 **Endpoint trovati:** {len(endpoints)}\n\n"
                f"**Lista endpoint:**\n{endpoint_list}\n\n"
                "🎯 **Prossimo passo:**\n"
                "Generazione del checker Python"
            )
        else:
            return (
                f"✅ **Discovery Complete!**\n\n"
                f"📡 **Endpoints found:** {len(endpoints)}\n\n"
                f"**Endpoint list:**\n{endpoint_list}\n\n"
                "🎯 **Next step:**\n"
                "Python checker generation"
            )
    
    def get_generating_message(self, language: str = "en") -> str:
        """Get generating checker message."""
        if language == "it":
            return (
                "⚙️ **Generazione checker...**\n\n"
                "⏳ Attendere prego...\n\n"
                "📝 Creazione script Python\n"
                "📦 Generazione requirements.txt\n"
                "📄 Creazione README.md\n"
                "⚙️ Generazione config.json\n"
                "🎨 Ottimizzazione codice"
            )
        else:
            return (
                "⚙️ **Generating checker...**\n\n"
                "⏳ Please wait...\n\n"
                "📝 Creating Python script\n"
                "📦 Generating requirements.txt\n"
                "📄 Creating README.md\n"
                "⚙️ Generating config.json\n"
                "🎨 Optimizing code"
            )
    
    def get_generation_complete_message(self, files: list, language: str = "en") -> str:
        """Get generation complete message."""
        if language == "it":
            return (
                "🎉 **Checker Generato con Successo!**\n\n"
                f"📁 **File creati:** {len(files)}\n\n"
                "✅ checker.py - Script principale\n"
                "✅ requirements.txt - Dipendenze\n"
                "✅ README.md - Documentazione\n"
                "✅ config.json - Configurazione\n\n"
                "📥 **Scaricamento in corso...**"
            )
        else:
            return (
                "🎉 **Checker Generated Successfully!**\n\n"
                f"�� **Files created:** {len(files)}\n\n"
                "✅ checker.py - Main script\n"
                "✅ requirements.txt - Dependencies\n"
                "✅ README.md - Documentation\n"
                "✅ config.json - Configuration\n\n"
                "📥 **Downloading...**"
            )
    
    def get_error_message(self, error_type: str, language: str = "en") -> str:
        """Get error message."""
        if language == "it":
            messages = {
                "invalid_url": "❌ URL non valido. Riprova.",
                "analysis_failed": "❌ Analisi fallita. Verificare l'URL.",
                "invalid_credentials": "❌ Formato credenziali non valido.",
                "validation_failed": "❌ Validazione fallita. Credenziali errate?",
                "discovery_failed": "❌ Scoperta API fallita.",
                "generation_failed": "❌ Generazione checker fallita.",
                "general": "❌ Si è verificato un errore. Riprova."
            }
        else:
            messages = {
                "invalid_url": "❌ Invalid URL. Please try again.",
                "analysis_failed": "❌ Analysis failed. Check the URL.",
                "invalid_credentials": "❌ Invalid credentials format.",
                "validation_failed": "❌ Validation failed. Wrong credentials?",
                "discovery_failed": "❌ API discovery failed.",
                "generation_failed": "❌ Checker generation failed.",
                "general": "❌ An error occurred. Please try again."
            }
        return messages.get(error_type, messages["general"])
    
    def get_stats_message(self, stats: Dict[str, Any], language: str = "en") -> str:
        """Get statistics message."""
        if language == "it":
            return (
                "📊 **Statistiche Bot**\n\n"
                f"👥 **Utenti totali:** {stats.get('total_users', 0)}\n"
                f"📁 **Progetti totali:** {stats.get('total_projects', 0)}\n"
                f"✅ **Checker generati:** {stats.get('total_checkers', 0)}\n"
                f"⏱️ **Uptime:** {stats.get('uptime', 'N/A')}\n"
                f"💾 **Sessioni attive:** {stats.get('active_sessions', 0)}"
            )
        else:
            return (
                "📊 **Bot Statistics**\n\n"
                f"👥 **Total users:** {stats.get('total_users', 0)}\n"
                f"📁 **Total projects:** {stats.get('total_projects', 0)}\n"
                f"✅ **Checkers generated:** {stats.get('total_checkers', 0)}\n"
                f"⏱️ **Uptime:** {stats.get('uptime', 'N/A')}\n"
                f"💾 **Active sessions:** {stats.get('active_sessions', 0)}"
            )
    
    def get_cancel_message(self, language: str = "en") -> str:
        """Get cancellation message."""
        if language == "it":
            return "❌ **Operazione annullata.**\n\nTorna al /start per ricominciare."
        else:
            return "❌ **Operation cancelled.**\n\nReturn to /start to begin again."
    
    def get_progress_message(self, step: int, total: int, message: str, language: str = "en") -> str:
        """Get progress update message."""
        progress = int((step / total) * 100)
        bar_filled = int(progress / 10)
        bar_empty = 10 - bar_filled
        progress_bar = "🟦" * bar_filled + "⬜" * bar_empty
        
        return f"{message}\n\n{progress_bar} {progress}%"

__all__ = ["BotMessages"]
