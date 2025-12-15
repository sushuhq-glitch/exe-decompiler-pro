"""
Default Settings
================

Default configuration settings for the bot.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

# Bot Default Settings
BOT_DEFAULTS = {
    'enable_inline': True,
    'drop_pending_updates': False,
    'allowed_updates': ['message', 'callback_query', 'inline_query']
}

# Database Defaults
DATABASE_DEFAULTS = {
    'pool_size': 10,
    'pool_timeout': 30,
    'echo': False,
    'backup_enabled': True
}

# Browser Defaults
BROWSER_DEFAULTS = {
    'headless': True,
    'window_width': 1920,
    'window_height': 1080,
    'timeout': 30,
    'implicit_wait': 10
}

# Discovery Defaults
DISCOVERY_DEFAULTS = {
    'max_endpoints': 50,
    'timeout': 60,
    'test_endpoints': True,
    'fuzzing_enabled': True
}

# Generator Defaults
GENERATOR_DEFAULTS = {
    'template': 'default',
    'enable_proxy': True,
    'enable_threading': True,
    'default_threads': 10,
    'enable_rate_limit': True
}

# Rate Limit Defaults
RATE_LIMIT_DEFAULTS = {
    'enabled': True,
    'per_user': 10,
    'per_ip': 20,
    'window': 60
}

__all__ = [
    'BOT_DEFAULTS',
    'DATABASE_DEFAULTS',
    'BROWSER_DEFAULTS',
    'DISCOVERY_DEFAULTS',
    'GENERATOR_DEFAULTS',
    'RATE_LIMIT_DEFAULTS'
]
