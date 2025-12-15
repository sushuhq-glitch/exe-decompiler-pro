"""
Bot Middleware
==============

Middleware for request processing, logging, and rate limiting.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

import time
import logging
from typing import Optional, Dict, Any, Callable
from functools import wraps
from telegram import Update
from telegram.ext import ContextTypes
from database.db_manager import DatabaseManager
from utils.logger import get_logger

logger = get_logger(__name__)


class BotMiddleware:
    """Middleware for bot request processing."""
    
    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        self.db = db_manager
        self.rate_limiter = RateLimiter()
        self.request_logger = RequestLogger()
    
    async def process_update(
        self,
        update: Update,
        context: ContextTypes.DEFAULT_TYPE,
        handler: Callable
    ) -> Any:
        """Process update through middleware chain."""
        user_id = update.effective_user.id if update.effective_user else None
        
        # Log request
        self.request_logger.log_request(update)
        
        # Check rate limit
        if not self.rate_limiter.check_rate_limit(user_id):
            await update.effective_message.reply_text(
                "⚠️ Rate limit exceeded. Please wait a moment."
            )
            return
        
        # Track user activity
        if user_id and self.db:
            await self.db.track_user_activity(user_id, update.update_id)
        
        # Execute handler
        start_time = time.time()
        result = await handler(update, context)
        duration = time.time() - start_time
        
        # Log response
        self.request_logger.log_response(update, duration)
        
        return result


class RateLimiter:
    """Rate limiting for user requests."""
    
    def __init__(self, max_requests: int = 10, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.user_requests: Dict[int, list] = {}
    
    def check_rate_limit(self, user_id: Optional[int]) -> bool:
        """Check if user is within rate limits."""
        if user_id is None:
            return True
        
        now = time.time()
        
        # Get user's request history
        if user_id not in self.user_requests:
            self.user_requests[user_id] = []
        
        # Remove old requests
        self.user_requests[user_id] = [
            ts for ts in self.user_requests[user_id]
            if now - ts < self.time_window
        ]
        
        # Check limit
        if len(self.user_requests[user_id]) >= self.max_requests:
            return False
        
        # Add current request
        self.user_requests[user_id].append(now)
        return True


class RequestLogger:
    """Logs bot requests and responses."""
    
    def log_request(self, update: Update) -> None:
        """Log incoming request."""
        user = update.effective_user
        message = update.effective_message
        
        if user and message:
            logger.info(
                f"Request from user {user.id} (@{user.username}): "
                f"{message.text[:100] if message.text else 'No text'}"
            )
    
    def log_response(self, update: Update, duration: float) -> None:
        """Log response timing."""
        user = update.effective_user
        if user:
            logger.debug(f"Response to user {user.id} took {duration:.3f}s")


def rate_limit(max_calls: int = 5, time_window: int = 60):
    """Decorator for rate limiting handler functions."""
    limiter = RateLimiter(max_calls, time_window)
    
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
            user_id = update.effective_user.id if update.effective_user else None
            
            if not limiter.check_rate_limit(user_id):
                await update.effective_message.reply_text(
                    "⚠️ Too many requests. Please slow down."
                )
                return
            
            return await func(update, context)
        
        return wrapper
    return decorator


__all__ = ["BotMiddleware", "RateLimiter", "RequestLogger", "rate_limit"]
