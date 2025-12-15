# API Documentation - Telegram API Checker Bot

## Table of Contents
1. [Introduction](#introduction)
2. [Bot Module API](#bot-module-api)
3. [Analyzer Module API](#analyzer-module-api)
4. [Interceptor Module API](#interceptor-module-api)
5. [Discovery Module API](#discovery-module-api)
6. [Generator Module API](#generator-module-api)
7. [Database Module API](#database-module-api)
8. [Utils Module API](#utils-module-api)
9. [Models API](#models-api)

## Introduction

This document provides comprehensive API documentation for all modules in the Telegram API Checker Bot.

## Bot Module API

### TelegramAPICheckerBot

Main bot class that handles all Telegram operations.

```python
class TelegramAPICheckerBot:
    def __init__(self, token: Optional[str] = None, config: Optional[Config] = None, db_manager: Optional[DatabaseManager] = None)
    async def initialize() -> None
    async def start() -> None
    async def stop() -> None
    def get_session(user_id: int) -> Optional[Dict[str, Any]]
    def create_session(user_id: int, project_data: Dict[str, Any]) -> Dict[str, Any]
    def update_session(user_id: int, updates: Dict[str, Any]) -> None
    def close_session(user_id: int) -> None
    async def send_progress_update(user_id: int, message: str, progress: int = 0) -> None
    def get_stats() -> Dict[str, Any]
```

**Methods:**

#### `__init__(token, config, db_manager)`
Initialize the bot with configuration.

**Parameters:**
- `token` (str, optional): Telegram bot token
- `config` (Config, optional): Configuration object
- `db_manager` (DatabaseManager, optional): Database manager

**Returns:** None

#### `initialize()`
Initialize bot components and handlers.

**Returns:** None
**Raises:** Exception if initialization fails

#### `start()`
Start the bot and begin polling for updates.

**Returns:** None
**Raises:** Exception if start fails

### BotHandlers

Handles all bot commands and callbacks.

```python
class BotHandlers:
    def __init__(self, config: Config, db_manager: DatabaseManager, keyboards: BotKeyboards, messages: BotMessages)
    async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int
    async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None
    async def handle_url_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int
    async def handle_credentials_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int
```

## Analyzer Module API

### WebsiteAnalyzer

Analyzes websites to find login pages and forms.

```python
class WebsiteAnalyzer:
    def __init__(self)
    async def analyze(url: str) -> Dict[str, Any]
```

**Methods:**

#### `analyze(url)`
Perform comprehensive website analysis.

**Parameters:**
- `url` (str): Website URL to analyze

**Returns:** Dict with analysis results:
```python
{
    'url': str,
    'login_url': Optional[str],
    'forms_count': int,
    'fields_count': int,
    'forms': List[Dict],
    'endpoints': List[str],
    'cookies': List[Dict],
    'headers': Dict[str, str],
    'meta_tags': List[Dict]
}
```

**Raises:** Exception if analysis fails

### TokenAnalyzer

Analyzes and extracts tokens and cookies.

```python
class TokenAnalyzer:
    def __init__(self)
    def analyze_response(response: Dict[str, Any]) -> Dict[str, Any]
    def decode_jwt(token: str) -> Optional[Dict]
```

**Methods:**

#### `analyze_response(response)`
Analyze HTTP response for tokens.

**Parameters:**
- `response` (Dict): HTTP response with headers and body

**Returns:** Dict with extracted tokens:
```python
{
    'jwt_tokens': List[str],
    'bearer_tokens': List[str],
    'cookies': List[Dict],
    'custom_tokens': List[str],
    'csrf_tokens': List[str]
}
```

#### `decode_jwt(token)`
Decode JWT token payload.

**Parameters:**
- `token` (str): JWT token string

**Returns:** Dict with decoded payload or None if invalid

## Interceptor Module API

### NetworkInterceptor

Intercepts and logs network traffic.

```python
class NetworkInterceptor:
    def __init__(self)
    async def start() -> None
    async def stop() -> None
    def intercept_request(request: Dict[str, Any]) -> None
    def intercept_response(response: Dict[str, Any]) -> None
    def get_requests(filter_func: Optional[Callable] = None) -> List[Dict]
    def find_login_request() -> Optional[Dict]
```

### BrowserController

Controls browser automation.

```python
class BrowserController:
    def __init__(self, headless: bool = True)
    def start() -> None
    def navigate(url: str) -> None
    def fill_form(email: str, password: str) -> None
    def submit_form() -> None
    def get_cookies() -> List[Dict]
    def stop() -> None
```

## Discovery Module API

### APIDiscovery

Discovers API endpoints by analyzing traffic and patterns.

```python
class APIDiscovery:
    def __init__(self)
    async def discover_endpoints(base_url: str, tokens: Dict[str, Any], intercepted_requests: Optional[List[Dict]] = None) -> List[Dict[str, Any]]
```

**Methods:**

#### `discover_endpoints(base_url, tokens, intercepted_requests)`
Discover API endpoints.

**Parameters:**
- `base_url` (str): Base website URL
- `tokens` (Dict): Authentication tokens
- `intercepted_requests` (List, optional): Captured HTTP requests

**Returns:** List of discovered endpoints:
```python
[
    {
        'url': str,
        'method': str,
        'type': str,  # 'profile', 'payment', 'orders', etc.
        'tested': bool,
        'description': str
    }
]
```

## Generator Module API

### CheckerGenerator

Generates complete Python checker scripts.

```python
class CheckerGenerator:
    def __init__(self)
    async def generate_checker(url: str, endpoints: List[Dict], tokens: Dict[str, Any]) -> List[Dict[str, str]]
```

**Methods:**

#### `generate_checker(url, endpoints, tokens)`
Generate complete checker package.

**Parameters:**
- `url` (str): Target website URL
- `endpoints` (List[Dict]): Discovered endpoints
- `tokens` (Dict): Authentication tokens

**Returns:** List of generated files:
```python
[
    {'name': 'checker.py', 'path': '/path/to/checker.py'},
    {'name': 'requirements.txt', 'path': '/path/to/requirements.txt'},
    {'name': 'README.md', 'path': '/path/to/README.md'},
    {'name': 'config.json', 'path': '/path/to/config.json'}
]
```

## Database Module API

### DatabaseManager

Manages all database operations.

```python
class DatabaseManager:
    def __init__(self, db_url: str)
    async def initialize() -> None
    async def migrate() -> None
    async def register_user(telegram_id: int, username: Optional[str], first_name: Optional[str]) -> None
    async def get_user_projects(user_id: int) -> List[Dict]
    async def get_project(project_id: int) -> Optional[Dict]
    async def update_user_language(user_id: int, language: str) -> None
    async def get_bot_stats() -> Dict
    async def close() -> None
```

## Utils Module API

### Logger

Comprehensive logging system.

```python
def setup_logging(level=logging.INFO, log_file: Optional[str] = None) -> logging.Logger
def get_logger(name: str) -> logging.Logger

class StructuredLogger:
    def __init__(self, name: str)
    def set_context(**kwargs) -> None
    def info(message: str, **kwargs) -> None
    def error(message: str, **kwargs) -> None
```

### Config

Configuration management.

```python
class Config(BaseSettings):
    telegram_token: str
    database_url: str
    browser_headless: bool
    # ... many more settings
    
    def validate() -> bool
    def get(key: str, default: Any = None) -> Any
```

### Helpers

Utility functions.

```python
def validate_url(url: str) -> bool
def validate_email(email: str) -> bool
def normalize_url(url: str) -> str
def parse_credentials(creds: str) -> tuple
def format_bytes(bytes_num: int) -> str
def hash_string(s: str) -> str
async def retry_async(func, max_attempts: int = 3, delay: float = 1.0)
```

## Models API

### Website

Website data model.

```python
@dataclass
class Website:
    url: str
    name: Optional[str]
    created_at: Optional[datetime]
    login_url: Optional[str]
    forms: List[Form]
    
    def to_dict() -> Dict[str, Any]
    def to_json() -> str
    @classmethod
    def from_dict(data: Dict[str, Any]) -> 'Website'
```

### Project

Project data model.

```python
class Project:
    def __init__(self, name: str, url: str, user_id: Optional[int] = None)
    def update_status(status: ProjectStatus) -> None
    def update_progress(progress: int) -> None
    def add_endpoint(endpoint: Dict) -> None
    def to_dict() -> Dict[str, Any]
    def to_json() -> str
```

### APIEndpoint

API endpoint model.

```python
@dataclass
class APIEndpoint:
    url: str
    method: str
    endpoint_type: str
    description: Optional[str]
    tested: bool
    
    def to_dict() -> Dict[str, Any]
    @classmethod
    def from_dict(data: Dict[str, Any]) -> 'APIEndpoint'
```

## Error Handling

All API methods may raise exceptions. Common exceptions:

- `ValueError`: Invalid input parameters
- `ConnectionError`: Network connectivity issues
- `TimeoutError`: Operation timeout
- `AuthenticationError`: Authentication failures
- `ValidationError`: Data validation failures

## Rate Limiting

API operations respect rate limits:
- Default: 10 requests per minute
- Configurable via Config
- Automatic retry with backoff

## Security

- All credentials encrypted in memory
- No sensitive data in logs
- Input validation on all endpoints
- SQL injection prevention
- XSS protection

## Examples

### Complete Workflow

```python
from bot import TelegramAPICheckerBot
from utils.config import Config

# Initialize
config = Config()
bot = TelegramAPICheckerBot(config=config)

# Start bot
await bot.initialize()
await bot.start()
```

### Website Analysis

```python
from analyzer.website_analyzer import WebsiteAnalyzer

analyzer = WebsiteAnalyzer()
result = await analyzer.analyze("https://example.com")

print(f"Login URL: {result['login_url']}")
print(f"Forms found: {result['forms_count']}")
```

### Checker Generation

```python
from generator.checker_generator import CheckerGenerator

generator = CheckerGenerator()
files = await generator.generate_checker(
    url="https://example.com",
    endpoints=[...],
    tokens={...}
)

for file in files:
    print(f"Generated: {file['name']}")
```

## Version History

- 1.0.0: Initial release with complete API
- Future: Enhanced features and improvements
