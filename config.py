#!/usr/bin/env python3
"""
Configuration Module for Advanced Keyword Generator v5.0.

This module contains all configuration settings, paths, and parameters
used throughout the application. It provides a centralized configuration
management system with sensible defaults.

Classes:
    Config: Main configuration class with all application settings.

Example:
    >>> from config import Config
    >>> config = Config()
    >>> print(config.OUTPUT_DIR)
    >>> print(config.MAX_KEYWORDS_PER_BATCH)
"""

from pathlib import Path
from typing import Dict, Any, List
import os
import sys


class Config:
    """
    Central configuration class for the keyword generator application.
    
    This class contains all configuration parameters, paths, and settings
    used throughout the application. All values are class attributes for
    easy access and modification.
    
    Attributes:
        BASE_DIR: Base directory of the application.
        OUTPUT_DIR: Directory for output files.
        CACHE_DIR: Directory for cache files.
        LOGS_DIR: Directory for log files.
        VERSION: Application version.
        
    Example:
        >>> config = Config()
        >>> print(config.VERSION)
        >>> output_path = Config.OUTPUT_DIR / "keywords.txt"
    """
    
    # ===== VERSION INFORMATION =====
    VERSION = "5.0.0"
    APP_NAME = "SUSHKW - Advanced Keyword Generator"
    AUTHOR = "@teoo6232-eng"
    DESCRIPTION = "Professional OOP Keyword Generation System"
    
    # ===== DIRECTORY PATHS =====
    BASE_DIR = Path(__file__).parent.resolve()
    OUTPUT_DIR = BASE_DIR / "output"
    CACHE_DIR = BASE_DIR / ".cache"
    LOGS_DIR = BASE_DIR / "logs"
    DATA_DIR = BASE_DIR / "data"
    
    # ===== KEYWORD GENERATION PARAMETERS =====
    # Maximum number of keywords to generate in a single batch
    MAX_KEYWORDS_PER_BATCH = 10_000_000
    
    # Default number of keywords to generate
    DEFAULT_KEYWORD_COUNT = 1000
    
    # Minimum keyword count allowed
    MIN_KEYWORD_COUNT = 1
    
    # Maximum keyword count allowed (10 million)
    MAX_KEYWORD_COUNT = 10_000_000
    
    # Keywords generated per second target
    TARGET_KEYWORDS_PER_SECOND = 10000
    
    # Batch size for processing keywords
    BATCH_SIZE = 10000
    
    # Buffer size for streaming operations
    STREAM_BUFFER_SIZE = 100000
    
    # ===== RANDOM ENGINE PARAMETERS =====
    # Number of entropy mixing rounds
    ENTROPY_MIXING_ROUNDS = 5
    
    # Default seed for deterministic mode (None = random)
    DEFAULT_SEED = None
    
    # Enable/disable deterministic mode by default
    DEFAULT_DETERMINISTIC = False
    
    # ===== DEDUPLICATION PARAMETERS =====
    # Enable Bloom filter for deduplication
    USE_BLOOM_FILTER = True
    
    # Bloom filter expected number of elements
    BLOOM_FILTER_SIZE = 10_000_000
    
    # Bloom filter false positive probability
    BLOOM_FILTER_FPR = 0.001
    
    # Maximum memory usage for deduplication (2GB)
    MAX_DEDUP_MEMORY_MB = 2048
    
    # Cache size for duplicate checking
    DEDUP_CACHE_SIZE = 1_000_000
    
    # ===== PASSWORD ANALYZER PARAMETERS =====
    # Minimum password length
    MIN_PASSWORD_LENGTH = 8
    
    # Maximum password length
    MAX_PASSWORD_LENGTH = 128
    
    # Minimum password score (0-100)
    MIN_PASSWORD_SCORE = 60
    
    # Password strength thresholds
    PASSWORD_SCORE_WEAK = 40
    PASSWORD_SCORE_MEDIUM = 60
    PASSWORD_SCORE_STRONG = 80
    
    # Minimum character diversity required
    MIN_CHAR_DIVERSITY = 0.3
    
    # Maximum vowel ratio allowed
    MAX_VOWEL_RATIO = 0.7
    
    # Enable entropy calculation
    ENABLE_ENTROPY_CHECK = True
    
    # Minimum Shannon entropy required
    MIN_SHANNON_ENTROPY = 3.0
    
    # ===== FILE MANAGEMENT PARAMETERS =====
    # Supported output formats
    SUPPORTED_FORMATS = ['txt', 'csv', 'json']
    
    # Default output format
    DEFAULT_OUTPUT_FORMAT = 'txt'
    
    # Enable file compression
    ENABLE_COMPRESSION = True
    
    # Compression level (1-9)
    COMPRESSION_LEVEL = 6
    
    # Enable checksum generation
    ENABLE_CHECKSUMS = True
    
    # Checksum algorithms to use
    CHECKSUM_ALGORITHMS = ['md5', 'sha256']
    
    # File write buffer size (1MB)
    FILE_WRITE_BUFFER_SIZE = 1024 * 1024
    
    # ===== LOGGING PARAMETERS =====
    # Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    LOG_LEVEL = "INFO"
    
    # Enable console logging
    ENABLE_CONSOLE_LOG = True
    
    # Enable file logging
    ENABLE_FILE_LOG = True
    
    # Log file rotation size (10MB)
    LOG_FILE_MAX_SIZE = 10 * 1024 * 1024
    
    # Number of log file backups to keep
    LOG_FILE_BACKUP_COUNT = 5
    
    # Log format
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Date format for logs
    LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
    
    # ===== STATISTICS PARAMETERS =====
    # Enable real-time statistics
    ENABLE_REALTIME_STATS = True
    
    # Statistics update interval (seconds)
    STATS_UPDATE_INTERVAL = 1.0
    
    # Enable performance metrics
    ENABLE_PERFORMANCE_METRICS = True
    
    # Enable memory tracking
    ENABLE_MEMORY_TRACKING = True
    
    # ===== UI PARAMETERS =====
    # Enable colored output
    ENABLE_COLORS = True
    
    # Enable progress bars
    ENABLE_PROGRESS_BARS = True
    
    # Progress bar width
    PROGRESS_BAR_WIDTH = 50
    
    # Enable animated spinners
    ENABLE_SPINNERS = True
    
    # Terminal width (auto-detect if None)
    TERMINAL_WIDTH = None
    
    # ===== TEMPLATE ENGINE PARAMETERS =====
    # Maximum template cache size
    MAX_TEMPLATE_CACHE_SIZE = 1000
    
    # Default template weight
    DEFAULT_TEMPLATE_WEIGHT = 1.0
    
    # Enable template validation
    ENABLE_TEMPLATE_VALIDATION = True
    
    # ===== LANGUAGE DATA PARAMETERS =====
    # Supported languages
    SUPPORTED_LANGUAGES = ['IT', 'MX', 'DE', 'TW', 'AT']
    
    # Default language
    DEFAULT_LANGUAGE = 'IT'
    
    # Enable language data caching
    ENABLE_LANGUAGE_CACHE = True
    
    # ===== PERFORMANCE TUNING =====
    # Enable multi-threading
    ENABLE_MULTITHREADING = True
    
    # Number of worker threads (None = auto-detect)
    NUM_WORKER_THREADS = None
    
    # Enable memory pooling
    ENABLE_MEMORY_POOLING = True
    
    # Memory pool size (MB)
    MEMORY_POOL_SIZE_MB = 512
    
    # ===== FEATURE FLAGS =====
    # Enable keyword validation
    ENABLE_KEYWORD_VALIDATION = True
    
    # Enable duplicate checking during generation
    ENABLE_REALTIME_DEDUP = True
    
    # Enable password strength filtering
    ENABLE_PASSWORD_FILTERING = True
    
    # Enable file dialogs (requires tkinter)
    ENABLE_FILE_DIALOGS = True
    
    # Enable export statistics
    ENABLE_EXPORT_STATS = True
    
    # ===== DEVELOPER OPTIONS =====
    # Enable debug mode
    DEBUG_MODE = False
    
    # Enable verbose output
    VERBOSE = False
    
    # Enable profiling
    ENABLE_PROFILING = False
    
    # ===== VALIDATION PARAMETERS =====
    # Email validation regex
    EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    # Combo validation format (email:password)
    COMBO_SEPARATOR = ':'
    
    # Maximum line length for file reading
    MAX_LINE_LENGTH = 1024
    
    @classmethod
    def get_output_path(cls, filename: str, language: str = None) -> Path:
        """
        Get the full output path for a file.
        
        Args:
            filename: Name of the output file.
            language: Language code (optional).
            
        Returns:
            Full path to the output file.
            
        Example:
            >>> path = Config.get_output_path("keywords.txt", "IT")
        """
        if language:
            filename = f"{language}_{filename}"
        return cls.OUTPUT_DIR / filename
    
    @classmethod
    def get_cache_path(cls, cache_name: str) -> Path:
        """
        Get the full cache path for a cache file.
        
        Args:
            cache_name: Name of the cache file.
            
        Returns:
            Full path to the cache file.
        """
        return cls.CACHE_DIR / cache_name
    
    @classmethod
    def get_log_path(cls, log_name: str) -> Path:
        """
        Get the full log path for a log file.
        
        Args:
            log_name: Name of the log file.
            
        Returns:
            Full path to the log file.
        """
        return cls.LOGS_DIR / log_name
    
    @classmethod
    def ensure_directories(cls) -> None:
        """
        Create all required directories if they don't exist.
        
        This method should be called at application startup to ensure
        all necessary directories are present.
        
        Example:
            >>> Config.ensure_directories()
        """
        directories = [
            cls.OUTPUT_DIR,
            cls.CACHE_DIR,
            cls.LOGS_DIR,
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_config_dict(cls) -> Dict[str, Any]:
        """
        Get all configuration values as a dictionary.
        
        Returns:
            Dictionary containing all configuration parameters.
            
        Example:
            >>> config = Config.get_config_dict()
            >>> print(config['VERSION'])
        """
        config = {}
        for attr in dir(cls):
            if not attr.startswith('_') and attr.isupper():
                config[attr] = getattr(cls, attr)
        return config
    
    @classmethod
    def print_config(cls) -> None:
        """
        Print all configuration values to console.
        
        Useful for debugging and verification.
        
        Example:
            >>> Config.print_config()
        """
        print(f"\n{cls.APP_NAME} v{cls.VERSION}")
        print(f"Author: {cls.AUTHOR}\n")
        print("Configuration:")
        print("-" * 50)
        
        config = cls.get_config_dict()
        for key, value in sorted(config.items()):
            print(f"{key}: {value}")
        
        print("-" * 50)
    
    @classmethod
    def validate_config(cls) -> bool:
        """
        Validate configuration values.
        
        Returns:
            True if configuration is valid, False otherwise.
            
        Example:
            >>> if Config.validate_config():
            ...     print("Configuration is valid")
        """
        # Validate keyword count ranges
        if cls.MIN_KEYWORD_COUNT <= 0:
            return False
        
        if cls.MAX_KEYWORD_COUNT < cls.MIN_KEYWORD_COUNT:
            return False
        
        # Validate password parameters
        if cls.MIN_PASSWORD_LENGTH <= 0:
            return False
        
        if cls.MAX_PASSWORD_LENGTH < cls.MIN_PASSWORD_LENGTH:
            return False
        
        # Validate score thresholds
        if not (0 <= cls.MIN_PASSWORD_SCORE <= 100):
            return False
        
        # Validate supported formats
        if not cls.SUPPORTED_FORMATS:
            return False
        
        if cls.DEFAULT_OUTPUT_FORMAT not in cls.SUPPORTED_FORMATS:
            return False
        
        # Validate supported languages
        if not cls.SUPPORTED_LANGUAGES:
            return False
        
        if cls.DEFAULT_LANGUAGE not in cls.SUPPORTED_LANGUAGES:
            return False
        
        return True


# Ensure directories exist on module import
Config.ensure_directories()
