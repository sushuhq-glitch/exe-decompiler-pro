'''Helper utility functions.'''
import re
import hashlib
import json
import base64
from typing import Any, Dict, Optional, List
from datetime import datetime
from urllib.parse import urlparse, urljoin
import asyncio

def validate_url(url: str) -> bool:
    """Validate URL format."""
    url_pattern = re.compile(
        r'^(?:http|https)://|^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}',
        re.IGNORECASE
    )
    return bool(url_pattern.match(url))

def validate_email(email: str) -> bool:
    """Validate email format."""
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(email_pattern.match(email))

def normalize_url(url: str) -> str:
    """Normalize URL to standard format."""
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

def extract_domain(url: str) -> str:
    """Extract domain from URL."""
    parsed = urlparse(url)
    return parsed.netloc

def generate_id(prefix: str = "") -> str:
    """Generate unique ID."""
    timestamp = datetime.now().isoformat()
    hash_obj = hashlib.sha256(timestamp.encode())
    return f"{prefix}{hash_obj.hexdigest()[:16]}"

def hash_string(s: str) -> str:
    """Hash a string using SHA-256."""
    return hashlib.sha256(s.encode()).hexdigest()

def encode_base64(data: str) -> str:
    """Encode string to base64."""
    return base64.b64encode(data.encode()).decode()

def decode_base64(data: str) -> str:
    """Decode base64 string."""
    return base64.b64decode(data.encode()).decode()

def parse_credentials(creds: str) -> tuple:
    """Parse credentials in email:password format."""
    if ':' not in creds:
        raise ValueError("Invalid credentials format")
    parts = creds.split(':', 1)
    return parts[0].strip(), parts[1].strip()

def format_bytes(bytes_num: int) -> str:
    """Format bytes to human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_num < 1024.0:
            return f"{bytes_num:.2f} {unit}"
        bytes_num /= 1024.0
    return f"{bytes_num:.2f} PB"

def format_duration(seconds: float) -> str:
    """Format duration in seconds to human readable format."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        return f"{seconds/60:.1f}m"
    else:
        return f"{seconds/3600:.1f}h"

def sanitize_filename(filename: str) -> str:
    """Sanitize filename by removing invalid characters."""
    return re.sub(r'[<>:"/\|?*]', '_', filename)

def truncate_string(s: str, length: int = 100, suffix: str = "...") -> str:
    """Truncate string to specified length."""
    if len(s) <= length:
        return s
    return s[:length - len(suffix)] + suffix

def deep_merge(dict1: Dict, dict2: Dict) -> Dict:
    """Deep merge two dictionaries."""
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

async def retry_async(func, max_attempts: int = 3, delay: float = 1.0):
    """Retry async function with exponential backoff."""
    for attempt in range(max_attempts):
        try:
            return await func()
        except Exception as e:
            if attempt == max_attempts - 1:
                raise
            await asyncio.sleep(delay * (2 ** attempt))

def chunk_list(lst: List, chunk_size: int) -> List[List]:
    """Split list into chunks."""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

class Timer:
    """Context manager for timing code execution."""
    def __init__(self, name: str = "Timer"):
        self.name = name
        self.start_time = None
        self.end_time = None
    
    def __enter__(self):
        self.start_time = datetime.now()
        return self
    
    def __exit__(self, *args):
        self.end_time = datetime.now()
        duration = (self.end_time - self.start_time).total_seconds()
        print(f"{self.name}: {format_duration(duration)}")
    
    @property
    def elapsed(self) -> float:
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0.0

__all__ = [
    'validate_url', 'validate_email', 'normalize_url', 'extract_domain',
    'generate_id', 'hash_string', 'encode_base64', 'decode_base64',
    'parse_credentials', 'format_bytes', 'format_duration', 'sanitize_filename',
    'truncate_string', 'deep_merge', 'retry_async', 'chunk_list', 'Timer'
]
