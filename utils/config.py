'''Configuration management system.'''
import os
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import yaml

class Config(BaseSettings):
    """Main configuration class using Pydantic."""
    
    # Bot configuration
    telegram_token: str = Field(default="8440573724:AAGFEW0MSo2G7kPrDtvQRBi2E-bWrRiOSXU", env="TELEGRAM_BOT_TOKEN")
    telegram_admin_ids: list = Field(default_factory=list, env="TELEGRAM_ADMIN_IDS")
    enable_inline_mode: bool = Field(default=True, env="TELEGRAM_ENABLE_INLINE")
    drop_pending_updates: bool = Field(default=False, env="TELEGRAM_DROP_PENDING_UPDATES")
    
    # Database
    database_url: str = Field(default="sqlite:///data/bot.db", env="DATABASE_URL")
    database_pool_size: int = Field(default=10, env="DATABASE_POOL_SIZE")
    database_echo: bool = Field(default=False, env="DATABASE_ECHO")
    
    # Browser automation
    chrome_binary_path: Optional[str] = Field(default=None, env="CHROME_BINARY_PATH")
    browser_headless: bool = Field(default=True, env="BROWSER_HEADLESS")
    browser_width: int = Field(default=1920, env="BROWSER_WIDTH")
    browser_height: int = Field(default=1080, env="BROWSER_HEIGHT")
    browser_timeout: int = Field(default=30, env="BROWSER_TIMEOUT")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file_path: Optional[str] = Field(default="./logs/bot.log", env="LOG_FILE_PATH")
    log_to_file: bool = Field(default=True, env="LOG_TO_FILE")
    
    # Storage
    storage_base_dir: str = Field(default="./storage", env="STORAGE_BASE_DIR")
    storage_projects_dir: str = Field(default="./storage/projects", env="STORAGE_PROJECTS_DIR")
    storage_temp_dir: str = Field(default="./storage/temp", env="STORAGE_TEMP_DIR")
    
    # Security
    security_encrypt_credentials: bool = Field(default=True, env="SECURITY_ENCRYPT_CREDENTIALS")
    security_encryption_key: Optional[str] = Field(default=None, env="SECURITY_ENCRYPTION_KEY")
    
    # Features
    enable_graphql: bool = Field(default=True, env="ENABLE_GRAPHQL")
    enable_websocket: bool = Field(default=True, env="ENABLE_WEBSOCKET")
    max_concurrent_projects: int = Field(default=3, env="MAX_CONCURRENT_PROJECTS")
    
    # Performance
    max_workers: int = Field(default=10, env="MAX_WORKERS")
    enable_cache: bool = Field(default=True, env="ENABLE_CACHE")
    cache_ttl: int = Field(default=3600, env="CACHE_TTL")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    @field_validator("telegram_admin_ids", mode='before')
    @classmethod
    def parse_admin_ids(cls, v):
        if isinstance(v, str):
            return [int(id.strip()) for id in v.split(",") if id.strip()]
        return v
    
    def validate(self) -> bool:
        """Validate configuration."""
        return bool(self.telegram_token)
    
    @classmethod
    def load_from_yaml(cls, path: str) -> "Config":
        """Load configuration from YAML file."""
        with open(path, 'r') as f:
            data = yaml.safe_load(f)
        return cls(**data)
    
    def save_to_yaml(self, path: str) -> None:
        """Save configuration to YAML file."""
        with open(path, 'w') as f:
            yaml.dump(self.model_dump(), f)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key."""
        return getattr(self, key, default)

__all__ = ['Config']
