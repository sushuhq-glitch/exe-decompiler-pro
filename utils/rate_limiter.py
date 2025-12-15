"""
Rate Limiter Utility
====================

Comprehensive rate limiting implementation for API requests.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

import time
import asyncio
from typing import Dict, Optional, Callable, Any
from collections import deque
from datetime import datetime, timedelta
import logging
from functools import wraps


class RateLimiter:
    """
    Rate limiter with sliding window algorithm.
    
    Implements token bucket and sliding window rate limiting
    for controlling request rates.
    """
    
    def __init__(
        self,
        max_requests: int = 60,
        time_window: int = 60,
        burst_size: Optional[int] = None
    ):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum requests allowed in time window
            time_window: Time window in seconds
            burst_size: Maximum burst size (defaults to max_requests)
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.burst_size = burst_size or max_requests
        
        self.requests: deque = deque()
        self.tokens = self.burst_size
        self.last_refill = time.time()
        
        self.logger = logging.getLogger(__name__)
    
    def acquire(self, tokens: int = 1) -> bool:
        """
        Try to acquire tokens for a request.
        
        Args:
            tokens: Number of tokens to acquire
            
        Returns:
            True if tokens acquired, False otherwise
        """
        self._refill_tokens()
        self._cleanup_old_requests()
        
        # Check if we have enough tokens
        if self.tokens >= tokens:
            # Check sliding window
            if len(self.requests) + tokens <= self.max_requests:
                self.tokens -= tokens
                self.requests.append(time.time())
                return True
        
        return False
    
    def wait(self, tokens: int = 1, timeout: Optional[float] = None) -> bool:
        """
        Wait until tokens are available.
        
        Args:
            tokens: Number of tokens needed
            timeout: Maximum time to wait in seconds
            
        Returns:
            True if acquired, False if timeout
        """
        start_time = time.time()
        
        while True:
            if self.acquire(tokens):
                return True
            
            # Check timeout
            if timeout and (time.time() - start_time) >= timeout:
                return False
            
            # Wait before retry
            time.sleep(0.01)
    
    async def acquire_async(self, tokens: int = 1) -> bool:
        """
        Async version of acquire.
        
        Args:
            tokens: Number of tokens to acquire
            
        Returns:
            True if tokens acquired, False otherwise
        """
        return self.acquire(tokens)
    
    async def wait_async(
        self,
        tokens: int = 1,
        timeout: Optional[float] = None
    ) -> bool:
        """
        Async version of wait.
        
        Args:
            tokens: Number of tokens needed
            timeout: Maximum time to wait in seconds
            
        Returns:
            True if acquired, False if timeout
        """
        start_time = time.time()
        
        while True:
            if await self.acquire_async(tokens):
                return True
            
            # Check timeout
            if timeout and (time.time() - start_time) >= timeout:
                return False
            
            # Wait before retry
            await asyncio.sleep(0.01)
    
    def _refill_tokens(self):
        """Refill tokens based on time elapsed."""
        now = time.time()
        elapsed = now - self.last_refill
        
        # Calculate tokens to add
        tokens_to_add = elapsed * (self.burst_size / self.time_window)
        
        self.tokens = min(self.burst_size, self.tokens + tokens_to_add)
        self.last_refill = now
    
    def _cleanup_old_requests(self):
        """Remove requests older than time window."""
        now = time.time()
        cutoff = now - self.time_window
        
        while self.requests and self.requests[0] < cutoff:
            self.requests.popleft()
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get rate limiter statistics.
        
        Returns:
            Dictionary with statistics
        """
        self._cleanup_old_requests()
        
        return {
            'tokens_available': self.tokens,
            'requests_in_window': len(self.requests),
            'requests_remaining': self.max_requests - len(self.requests),
            'max_requests': self.max_requests,
            'time_window': self.time_window,
            'burst_size': self.burst_size
        }
    
    def reset(self):
        """Reset rate limiter state."""
        self.requests.clear()
        self.tokens = self.burst_size
        self.last_refill = time.time()


class PerUserRateLimiter:
    """Rate limiter that tracks limits per user."""
    
    def __init__(
        self,
        max_requests: int = 60,
        time_window: int = 60
    ):
        """
        Initialize per-user rate limiter.
        
        Args:
            max_requests: Max requests per user per window
            time_window: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.limiters: Dict[str, RateLimiter] = {}
        self.logger = logging.getLogger(__name__)
    
    def get_limiter(self, user_id: str) -> RateLimiter:
        """Get or create rate limiter for user."""
        if user_id not in self.limiters:
            self.limiters[user_id] = RateLimiter(
                self.max_requests,
                self.time_window
            )
        return self.limiters[user_id]
    
    def acquire(self, user_id: str, tokens: int = 1) -> bool:
        """Acquire tokens for a user."""
        limiter = self.get_limiter(user_id)
        return limiter.acquire(tokens)
    
    def wait(
        self,
        user_id: str,
        tokens: int = 1,
        timeout: Optional[float] = None
    ) -> bool:
        """Wait for tokens for a user."""
        limiter = self.get_limiter(user_id)
        return limiter.wait(tokens, timeout)
    
    async def acquire_async(self, user_id: str, tokens: int = 1) -> bool:
        """Async acquire for a user."""
        limiter = self.get_limiter(user_id)
        return await limiter.acquire_async(tokens)
    
    async def wait_async(
        self,
        user_id: str,
        tokens: int = 1,
        timeout: Optional[float] = None
    ) -> bool:
        """Async wait for a user."""
        limiter = self.get_limiter(user_id)
        return await limiter.wait_async(tokens, timeout)
    
    def get_stats(self, user_id: str) -> Dict[str, Any]:
        """Get statistics for a user."""
        limiter = self.get_limiter(user_id)
        return limiter.get_stats()
    
    def reset(self, user_id: Optional[str] = None):
        """Reset rate limiter(s)."""
        if user_id:
            if user_id in self.limiters:
                self.limiters[user_id].reset()
        else:
            for limiter in self.limiters.values():
                limiter.reset()


def rate_limit(max_requests: int = 60, time_window: int = 60):
    """
    Decorator for rate limiting functions.
    
    Args:
        max_requests: Max requests allowed in time window
        time_window: Time window in seconds
    
    Example:
        @rate_limit(max_requests=10, time_window=60)
        def my_function():
            pass
    """
    limiter = RateLimiter(max_requests, time_window)
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not limiter.wait():
                raise Exception("Rate limit exceeded")
            return func(*args, **kwargs)
        return wrapper
    
    return decorator


def rate_limit_async(max_requests: int = 60, time_window: int = 60):
    """
    Async decorator for rate limiting.
    
    Args:
        max_requests: Max requests allowed in time window
        time_window: Time window in seconds
    """
    limiter = RateLimiter(max_requests, time_window)
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not await limiter.wait_async():
                raise Exception("Rate limit exceeded")
            return await func(*args, **kwargs)
        return wrapper
    
    return decorator


__all__ = [
    'RateLimiter',
    'PerUserRateLimiter',
    'rate_limit',
    'rate_limit_async'
]
