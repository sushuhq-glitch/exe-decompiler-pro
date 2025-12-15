#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Telegram API Checker Bot - Configuration
========================================

Central configuration module for the bot.

Author: Telegram API Checker Bot Team
Version: 2.0.0
"""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Main configuration class for the Telegram bot."""
    
    # Bot Configuration
    TELEGRAM_BOT_TOKEN: str = os.getenv(
        "TELEGRAM_BOT_TOKEN",
        "8440573724:AAGFEW0MSo2G7kPrDtvQRBi2E-bWrRiOSXU"
    )
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bot_data.db")
    
    # Paths
    BASE_DIR: Path = Path(__file__).parent
    OUTPUT_DIR: Path = BASE_DIR / "output"
    TEMP_DIR: Path = BASE_DIR / "temp"
    GENERATED_DIR: Path = BASE_DIR / "generated"
    
    # Create directories
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    
    # Browser Configuration (for Selenium)
    BROWSER_HEADLESS: bool = os.getenv("BROWSER_HEADLESS", "true").lower() == "true"
    BROWSER_TIMEOUT: int = int(os.getenv("BROWSER_TIMEOUT", "30"))
    PAGE_LOAD_TIMEOUT: int = int(os.getenv("PAGE_LOAD_TIMEOUT", "30"))
    
    # Network Interception
    NETWORK_TIMEOUT: int = int(os.getenv("NETWORK_TIMEOUT", "10"))
    MAX_WAIT_TIME: int = int(os.getenv("MAX_WAIT_TIME", "30"))
    
    # Form Detection
    FORM_WAIT_TIME: int = int(os.getenv("FORM_WAIT_TIME", "3"))
    
    # Fake Login Credentials
    TEST_EMAIL: str = "test@example.com"
    TEST_PASSWORD: str = "TestPassword123"
    
    # API Discovery
    COMMON_ENDPOINTS: list = [
        "/api/user/profile",
        "/api/user/me",
        "/api/users/me",
        "/api/user/orders",
        "/api/user/addresses",
        "/api/user/payment-methods",
        "/api/user/payments",
        "/api/user/settings",
        "/api/profile",
        "/api/me",
        "/api/account",
        "/api/account/profile",
        "/api/account/orders",
        "/v1/user/profile",
        "/v1/users/me",
        "/v2/user/profile",
        "/v2/users/me",
        "/v3/user/profile",
        "/v3/users/me",
    ]
    
    # Checker Generation
    CHECKER_THREADS: int = int(os.getenv("CHECKER_THREADS", "10"))
    CHECKER_TIMEOUT: int = int(os.getenv("CHECKER_TIMEOUT", "30"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: Optional[Path] = None
    
    # Supported Languages
    LANGUAGES: list = ["en", "it"]
    DEFAULT_LANGUAGE: str = "en"
    
    @classmethod
    def validate(cls) -> bool:
        """
        Validate configuration.
        
        Returns:
            bool: True if valid, False otherwise
        """
        if not cls.TELEGRAM_BOT_TOKEN:
            print("❌ TELEGRAM_BOT_TOKEN is required")
            return False
        
        return True
    
    @classmethod
    def get_output_dir(cls, user_id: int) -> Path:
        """
        Get output directory for a specific user.
        
        Args:
            user_id: Telegram user ID
            
        Returns:
            Path: User-specific output directory
        """
        user_dir = cls.OUTPUT_DIR / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir
    
    @classmethod
    def get_temp_dir(cls, user_id: int) -> Path:
        """
        Get temporary directory for a specific user.
        
        Args:
            user_id: Telegram user ID
            
        Returns:
            Path: User-specific temp directory
        """
        temp_dir = cls.TEMP_DIR / str(user_id)
        temp_dir.mkdir(parents=True, exist_ok=True)
        return temp_dir


# Export singleton instance
config = Config()
