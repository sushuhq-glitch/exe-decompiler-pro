'''Comprehensive logging system with multiple handlers and formatters.'''
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from typing import Optional
import colorama
from colorama import Fore, Style

colorama.init()

class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output."""
    COLORS = {
        'DEBUG': Fore.CYAN,
        'INFO': Fore.GREEN,
        'WARNING': Fore.YELLOW,
        'ERROR': Fore.RED,
        'CRITICAL': Fore.RED + Style.BRIGHT
    }
    
    def format(self, record):
        color = self.COLORS.get(record.levelname, '')
        record.levelname = f"{color}{record.levelname}{Style.RESET_ALL}"
        return super().format(record)

def setup_logging(level=logging.INFO, log_file: Optional[str] = None):
    """Setup logging configuration with console and file handlers."""
    logger = logging.getLogger()
    logger.setLevel(level)
    
    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_formatter = ColoredFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler if specified
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(level)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    return logger

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for a module."""
    return logging.getLogger(name)

class StructuredLogger:
    """Structured logging with context."""
    def __init__(self, name: str):
        self.logger = get_logger(name)
        self.context = {}
    
    def set_context(self, **kwargs):
        self.context.update(kwargs)
    
    def clear_context(self):
        self.context.clear()
    
    def _format_message(self, message: str) -> str:
        if self.context:
            context_str = " ".join(f"{k}={v}" for k, v in self.context.items())
            return f"{message} [{context_str}]"
        return message
    
    def debug(self, message: str, **kwargs):
        self.logger.debug(self._format_message(message), extra=kwargs)
    
    def info(self, message: str, **kwargs):
        self.logger.info(self._format_message(message), extra=kwargs)
    
    def warning(self, message: str, **kwargs):
        self.logger.warning(self._format_message(message), extra=kwargs)
    
    def error(self, message: str, **kwargs):
        self.logger.error(self._format_message(message), extra=kwargs)
    
    def critical(self, message: str, **kwargs):
        self.logger.critical(self._format_message(message), extra=kwargs)

__all__ = ['setup_logging', 'get_logger', 'StructuredLogger', 'ColoredFormatter']
