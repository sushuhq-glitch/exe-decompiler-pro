"""
Multi-level Logging Module.

This module provides comprehensive logging functionality with colored console output,
rotating file handlers, and multiple log levels for the keyword generator system.

Classes:
    Logger: Advanced logging system with file and console handlers.

Example:
    >>> from utils.logger import Logger
    >>> logger = Logger.get_logger(__name__)
    >>> logger.info("Processing started")
    >>> logger.error("An error occurred")
"""

import logging
import logging.handlers
import sys
import os
from typing import Optional
from pathlib import Path
from datetime import datetime
from ui.colors import Colors


class ColoredFormatter(logging.Formatter):
    """
    Custom formatter that adds colors to log messages.
    
    This formatter applies ANSI colors to log messages based on their level,
    making console output easier to read and understand.
    """
    
    # Color mapping for log levels
    COLORS = {
        logging.DEBUG: Colors.BRIGHT_BLACK,
        logging.INFO: Colors.BRIGHT_CYAN,
        logging.WARNING: Colors.BRIGHT_YELLOW,
        logging.ERROR: Colors.BRIGHT_RED,
        logging.CRITICAL: Colors.BRIGHT_MAGENTA + Colors.BOLD,
    }
    
    def __init__(self, fmt: Optional[str] = None, datefmt: Optional[str] = None):
        """
        Initialize colored formatter.
        
        Args:
            fmt: Log message format string.
            datefmt: Date format string.
        """
        super().__init__(fmt, datefmt)
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record with colors.
        
        Args:
            record: Log record to format.
        
        Returns:
            Formatted and colored log message.
        """
        # Get base formatted message
        message = super().format(record)
        
        # Apply color if colors are supported
        if Colors.supports_color():
            color = self.COLORS.get(record.levelno, '')
            if color:
                # Color the level name
                level_name = record.levelname
                colored_level = f"{color}{level_name}{Colors.RESET}"
                message = message.replace(level_name, colored_level, 1)
        
        return message


class Logger:
    """
    Advanced logging system with file and console handlers.
    
    This class provides a comprehensive logging solution with:
    - Multiple log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    - Colored console output
    - Rotating file handlers
    - Configurable format and rotation
    
    Attributes:
        DEFAULT_LOG_DIR (Path): Default directory for log files.
        DEFAULT_FORMAT (str): Default log message format.
        DEFAULT_DATE_FORMAT (str): Default date format.
        MAX_BYTES (int): Maximum bytes before rotation (10MB).
        BACKUP_COUNT (int): Number of backup files to keep.
    
    Example:
        >>> logger = Logger.get_logger("my_module")
        >>> logger.info("Operation started")
        >>> logger.error("An error occurred", exc_info=True)
    """
    
    # Class-level configuration
    DEFAULT_LOG_DIR = Path("logs")
    DEFAULT_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    DEFAULT_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
    MAX_BYTES = 10 * 1024 * 1024  # 10MB
    BACKUP_COUNT = 5
    
    # Store created loggers to avoid duplicates
    _loggers = {}
    _handlers_configured = False
    
    @staticmethod
    def get_logger(
        name: str,
        level: int = logging.INFO,
        log_to_file: bool = True,
        log_dir: Optional[Path] = None
    ) -> logging.Logger:
        """
        Get or create a logger with specified configuration.
        
        Args:
            name: Logger name (usually __name__ of module).
            level: Logging level (default: INFO).
            log_to_file: Whether to log to file (default: True).
            log_dir: Directory for log files (default: 'logs/').
        
        Returns:
            Configured logger instance.
        
        Example:
            >>> logger = Logger.get_logger(__name__)
            >>> logger.info("Starting process")
        """
        # Return existing logger if already created
        if name in Logger._loggers:
            return Logger._loggers[name]
        
        # Create new logger
        logger = logging.getLogger(name)
        logger.setLevel(level)
        
        # Prevent duplicate handlers
        if logger.hasHandlers():
            logger.handlers.clear()
        
        # Configure console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_formatter = ColoredFormatter(
            Logger.DEFAULT_FORMAT,
            Logger.DEFAULT_DATE_FORMAT
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
        # Configure file handler if requested
        if log_to_file:
            if log_dir is None:
                log_dir = Logger.DEFAULT_LOG_DIR
            
            # Create log directory if it doesn't exist
            log_dir = Path(log_dir)
            log_dir.mkdir(parents=True, exist_ok=True)
            
            # Create log file path
            timestamp = datetime.now().strftime("%Y%m%d")
            log_file = log_dir / f"{name}_{timestamp}.log"
            
            # Create rotating file handler
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=Logger.MAX_BYTES,
                backupCount=Logger.BACKUP_COUNT,
                encoding='utf-8'
            )
            file_handler.setLevel(level)
            file_formatter = logging.Formatter(
                Logger.DEFAULT_FORMAT,
                Logger.DEFAULT_DATE_FORMAT
            )
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)
        
        # Store logger
        Logger._loggers[name] = logger
        
        return logger
    
    @staticmethod
    def set_level(name: str, level: int) -> None:
        """
        Set logging level for a specific logger.
        
        Args:
            name: Logger name.
            level: New logging level.
        
        Raises:
            ValueError: If logger doesn't exist.
        
        Example:
            >>> Logger.set_level("my_module", logging.DEBUG)
        """
        if name not in Logger._loggers:
            raise ValueError(f"Logger '{name}' not found")
        
        logger = Logger._loggers[name]
        logger.setLevel(level)
        
        # Update all handlers
        for handler in logger.handlers:
            handler.setLevel(level)
    
    @staticmethod
    def set_all_levels(level: int) -> None:
        """
        Set logging level for all created loggers.
        
        Args:
            level: New logging level.
        
        Example:
            >>> Logger.set_all_levels(logging.DEBUG)
        """
        for name in Logger._loggers:
            Logger.set_level(name, level)
    
    @staticmethod
    def disable_file_logging(name: str) -> None:
        """
        Disable file logging for a specific logger.
        
        Args:
            name: Logger name.
        
        Raises:
            ValueError: If logger doesn't exist.
        
        Example:
            >>> Logger.disable_file_logging("my_module")
        """
        if name not in Logger._loggers:
            raise ValueError(f"Logger '{name}' not found")
        
        logger = Logger._loggers[name]
        
        # Remove file handlers
        for handler in logger.handlers[:]:
            if isinstance(handler, logging.handlers.RotatingFileHandler):
                handler.close()
                logger.removeHandler(handler)
    
    @staticmethod
    def enable_file_logging(
        name: str,
        log_dir: Optional[Path] = None
    ) -> None:
        """
        Enable file logging for a specific logger.
        
        Args:
            name: Logger name.
            log_dir: Directory for log files (default: 'logs/').
        
        Raises:
            ValueError: If logger doesn't exist.
        
        Example:
            >>> Logger.enable_file_logging("my_module", Path("/tmp/logs"))
        """
        if name not in Logger._loggers:
            raise ValueError(f"Logger '{name}' not found")
        
        logger = Logger._loggers[name]
        
        # Check if file handler already exists
        has_file_handler = any(
            isinstance(h, logging.handlers.RotatingFileHandler)
            for h in logger.handlers
        )
        
        if has_file_handler:
            return  # Already has file logging
        
        # Create log directory
        if log_dir is None:
            log_dir = Logger.DEFAULT_LOG_DIR
        
        log_dir = Path(log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Create log file path
        timestamp = datetime.now().strftime("%Y%m%d")
        log_file = log_dir / f"{name}_{timestamp}.log"
        
        # Create rotating file handler
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=Logger.MAX_BYTES,
            backupCount=Logger.BACKUP_COUNT,
            encoding='utf-8'
        )
        file_handler.setLevel(logger.level)
        file_formatter = logging.Formatter(
            Logger.DEFAULT_FORMAT,
            Logger.DEFAULT_DATE_FORMAT
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    @staticmethod
    def cleanup_old_logs(days: int = 7, log_dir: Optional[Path] = None) -> int:
        """
        Remove log files older than specified days.
        
        Args:
            days: Age threshold in days.
            log_dir: Directory containing log files.
        
        Returns:
            Number of files removed.
        
        Example:
            >>> removed = Logger.cleanup_old_logs(days=30)
            >>> print(f"Removed {removed} old log files")
        """
        if log_dir is None:
            log_dir = Logger.DEFAULT_LOG_DIR
        
        log_dir = Path(log_dir)
        
        if not log_dir.exists():
            return 0
        
        removed_count = 0
        cutoff_time = datetime.now().timestamp() - (days * 86400)
        
        # Find and remove old log files
        for log_file in log_dir.glob("*.log*"):
            try:
                if log_file.stat().st_mtime < cutoff_time:
                    log_file.unlink()
                    removed_count += 1
            except (OSError, PermissionError):
                # Skip files that can't be removed
                continue
        
        return removed_count
    
    @staticmethod
    def get_log_files(log_dir: Optional[Path] = None) -> list[Path]:
        """
        Get list of all log files.
        
        Args:
            log_dir: Directory containing log files.
        
        Returns:
            List of log file paths.
        
        Example:
            >>> files = Logger.get_log_files()
            >>> for f in files:
            ...     print(f.name)
        """
        if log_dir is None:
            log_dir = Logger.DEFAULT_LOG_DIR
        
        log_dir = Path(log_dir)
        
        if not log_dir.exists():
            return []
        
        return sorted(log_dir.glob("*.log*"), key=lambda x: x.stat().st_mtime)
    
    @staticmethod
    def clear_logger(name: str) -> None:
        """
        Remove and clean up a logger.
        
        Args:
            name: Logger name to remove.
        
        Example:
            >>> Logger.clear_logger("my_module")
        """
        if name in Logger._loggers:
            logger = Logger._loggers[name]
            
            # Close and remove all handlers
            for handler in logger.handlers[:]:
                handler.close()
                logger.removeHandler(handler)
            
            # Remove from tracking
            del Logger._loggers[name]
    
    @staticmethod
    def clear_all_loggers() -> None:
        """
        Remove and clean up all loggers.
        
        Example:
            >>> Logger.clear_all_loggers()
        """
        for name in list(Logger._loggers.keys()):
            Logger.clear_logger(name)
