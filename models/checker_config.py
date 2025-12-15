"""
Checker Configuration Model
============================

Model for checker configuration settings.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass, field
import json


@dataclass
class CheckerConfig:
    """Configuration for generated checker."""
    
    # Threading
    threads: int = 10
    max_workers: int = 10
    
    # Timeouts
    timeout: int = 30
    connection_timeout: int = 10
    read_timeout: int = 30
    
    # Retry logic
    retry_attempts: int = 3
    retry_delay: float = 1.0
    retry_backoff: float = 2.0
    
    # Rate limiting
    rate_limit_enabled: bool = True
    rate_limit_delay: float = 0.1
    requests_per_minute: int = 60
    
    # Proxy
    use_proxy: bool = False
    proxy_file: str = "proxies.txt"
    proxy_rotation: bool = True
    proxy_timeout: int = 10
    
    # Output
    output_directory: str = "output"
    save_hits: bool = True
    save_bads: bool = True
    save_errors: bool = True
    save_stats: bool = True
    timestamp_format: str = "%Y%m%d_%H%M%S"
    
    # Logging
    log_level: str = "INFO"
    log_to_file: bool = True
    log_file: str = "checker.log"
    log_to_console: bool = True
    
    # Features
    colored_output: bool = True
    progress_bar: bool = True
    fetch_profile: bool = True
    extract_balance: bool = True
    save_tokens: bool = True
    screenshot_on_hit: bool = False
    
    # Advanced
    user_agent: Optional[str] = None
    custom_headers: Dict[str, str] = field(default_factory=dict)
    verify_ssl: bool = True
    allow_redirects: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'threading': {
                'threads': self.threads,
                'max_workers': self.max_workers
            },
            'timeouts': {
                'timeout': self.timeout,
                'connection_timeout': self.connection_timeout,
                'read_timeout': self.read_timeout
            },
            'retry': {
                'attempts': self.retry_attempts,
                'delay': self.retry_delay,
                'backoff': self.retry_backoff
            },
            'rate_limit': {
                'enabled': self.rate_limit_enabled,
                'delay': self.rate_limit_delay,
                'requests_per_minute': self.requests_per_minute
            },
            'proxy': {
                'use_proxy': self.use_proxy,
                'proxy_file': self.proxy_file,
                'rotation': self.proxy_rotation,
                'timeout': self.proxy_timeout
            },
            'output': {
                'directory': self.output_directory,
                'save_hits': self.save_hits,
                'save_bads': self.save_bads,
                'save_errors': self.save_errors,
                'save_stats': self.save_stats,
                'timestamp_format': self.timestamp_format
            },
            'logging': {
                'level': self.log_level,
                'to_file': self.log_to_file,
                'file': self.log_file,
                'to_console': self.log_to_console
            },
            'features': {
                'colored_output': self.colored_output,
                'progress_bar': self.progress_bar,
                'fetch_profile': self.fetch_profile,
                'extract_balance': self.extract_balance,
                'save_tokens': self.save_tokens,
                'screenshot_on_hit': self.screenshot_on_hit
            },
            'advanced': {
                'user_agent': self.user_agent,
                'custom_headers': self.custom_headers,
                'verify_ssl': self.verify_ssl,
                'allow_redirects': self.allow_redirects
            }
        }
    
    def to_json(self) -> str:
        """Convert to JSON."""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CheckerConfig':
        """Create from dictionary."""
        threading = data.get('threading', {})
        timeouts = data.get('timeouts', {})
        retry = data.get('retry', {})
        rate_limit = data.get('rate_limit', {})
        proxy = data.get('proxy', {})
        output = data.get('output', {})
        logging_config = data.get('logging', {})
        features = data.get('features', {})
        advanced = data.get('advanced', {})
        
        return cls(
            threads=threading.get('threads', 10),
            max_workers=threading.get('max_workers', 10),
            timeout=timeouts.get('timeout', 30),
            connection_timeout=timeouts.get('connection_timeout', 10),
            read_timeout=timeouts.get('read_timeout', 30),
            retry_attempts=retry.get('attempts', 3),
            retry_delay=retry.get('delay', 1.0),
            retry_backoff=retry.get('backoff', 2.0),
            rate_limit_enabled=rate_limit.get('enabled', True),
            rate_limit_delay=rate_limit.get('delay', 0.1),
            requests_per_minute=rate_limit.get('requests_per_minute', 60),
            use_proxy=proxy.get('use_proxy', False),
            proxy_file=proxy.get('proxy_file', 'proxies.txt'),
            proxy_rotation=proxy.get('rotation', True),
            proxy_timeout=proxy.get('timeout', 10),
            output_directory=output.get('directory', 'output'),
            save_hits=output.get('save_hits', True),
            save_bads=output.get('save_bads', True),
            save_errors=output.get('save_errors', True),
            save_stats=output.get('save_stats', True),
            timestamp_format=output.get('timestamp_format', '%Y%m%d_%H%M%S'),
            log_level=logging_config.get('level', 'INFO'),
            log_to_file=logging_config.get('to_file', True),
            log_file=logging_config.get('file', 'checker.log'),
            log_to_console=logging_config.get('to_console', True),
            colored_output=features.get('colored_output', True),
            progress_bar=features.get('progress_bar', True),
            fetch_profile=features.get('fetch_profile', True),
            extract_balance=features.get('extract_balance', True),
            save_tokens=features.get('save_tokens', True),
            screenshot_on_hit=features.get('screenshot_on_hit', False),
            user_agent=advanced.get('user_agent'),
            custom_headers=advanced.get('custom_headers', {}),
            verify_ssl=advanced.get('verify_ssl', True),
            allow_redirects=advanced.get('allow_redirects', True)
        )


__all__ = ['CheckerConfig']
