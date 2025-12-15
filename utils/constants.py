'''Application constants and enumerations.'''
from enum import Enum

# HTTP Headers
COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
}

# API Endpoint Patterns
API_PATTERNS = {
    'login': ['/api/auth/login', '/api/login', '/auth/login', '/api/v1/auth/login'],
    'profile': ['/api/user/profile', '/api/profile', '/api/me', '/api/user/me'],
    'payment': ['/api/payment', '/api/payment/methods', '/api/wallet', '/api/billing'],
    'orders': ['/api/orders', '/api/user/orders', '/api/order/history'],
    'addresses': ['/api/addresses', '/api/user/addresses', '/api/delivery/addresses'],
}

# HTTP Status Codes
class HTTPStatus(Enum):
    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_SERVER_ERROR = 500

# Authentication Types
class AuthType(Enum):
    BEARER = 'bearer'
    COOKIE = 'cookie'
    BASIC = 'basic'
    API_KEY = 'apikey'
    JWT = 'jwt'
    OAUTH = 'oauth'

# Endpoint Types
class EndpointType(Enum):
    LOGIN = 'login'
    PROFILE = 'profile'
    PAYMENT = 'payment'
    ORDERS = 'orders'
    ADDRESSES = 'addresses'
    WALLET = 'wallet'
    SUBSCRIPTION = 'subscription'

# Browser Types
class BrowserType(Enum):
    CHROME = 'chrome'
    FIREFOX = 'firefox'
    EDGE = 'edge'
    SAFARI = 'safari'

# Project Status
class ProjectStatus(Enum):
    CREATED = 'created'
    ANALYZING = 'analyzing'
    ANALYZED = 'analyzed'
    VALIDATING = 'validating'
    VALIDATED = 'validated'
    DISCOVERING = 'discovering'
    DISCOVERED = 'discovered'
    GENERATING = 'generating'
    COMPLETE = 'complete'
    FAILED = 'failed'

# File Types
SUPPORTED_FILE_TYPES = {
    '.py': 'python',
    '.txt': 'text',
    '.json': 'json',
    '.md': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
}

# Default Timeouts (seconds)
DEFAULT_TIMEOUT = 30
CONNECTION_TIMEOUT = 10
READ_TIMEOUT = 30

# Rate Limiting
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60  # seconds

# Cache Settings
CACHE_DEFAULT_TTL = 3600  # seconds
CACHE_MAX_SIZE = 1000  # items

# Regex Patterns
REGEX_PATTERNS = {
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'url': r'^https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b',
    'ip': r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$',
    'jwt': r'^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$',
    'uuid': r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
}

# Login Keywords for page detection and API identification
LOGIN_KEYWORDS = [
    'login', 'signin', 'sign-in', 'log-in', 'accedi', 'entra',
    'auth', 'authenticate', 'accesso', 'iniciar', 'session/new'
]

# CSS Selectors for form fields
FORM_FIELD_SELECTORS = {
    'email': [
        'input[type="email"]',
        'input[name*="email"]',
        'input[name*="user"]',
        'input[id*="email"]'
    ],
    'password': [
        'input[type="password"]',
        'input[name*="pass"]',
        'input[id*="pass"]'
    ],
    'submit': [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign in")'
    ]
}

# Form Field Patterns
FORM_FIELD_PATTERNS = {
    'email': ['email', 'e-mail', 'user', 'username', 'login', 'account'],
    'password': ['password', 'passwd', 'pwd', 'pass', 'senha', 'contraseña'],
    'username': ['username', 'user', 'login', 'account', 'usuario'],
}

# CSRF Token Patterns
CSRF_TOKEN_PATTERNS = [
    'csrf', 'csrftoken', 'csrf_token', 'xsrf', 'xsrftoken',
    '_token', 'authenticity_token', 'token'
]

# API Endpoint Patterns for discovery
API_ENDPOINT_PATTERNS = {
    'auth': ['/api/auth', '/api/login', '/auth', '/login', '/api/v1/auth'],
    'user': ['/api/user', '/api/me', '/api/profile', '/api/v1/user'],
    'profile': ['/api/profile', '/api/user/profile', '/api/me', '/profile'],
    'payment': ['/api/payment', '/api/wallet', '/api/billing', '/payment'],
    'orders': ['/api/orders', '/api/order', '/orders', '/api/user/orders'],
}

# Error Messages
ERROR_MESSAGES = {
    'invalid_url': 'Invalid URL format',
    'invalid_email': 'Invalid email format',
    'invalid_credentials': 'Invalid credentials format',
    'network_error': 'Network error occurred',
    'timeout': 'Request timeout',
    'unauthorized': 'Unauthorized access',
    'not_found': 'Resource not found',
    'server_error': 'Server error',
}

__all__ = [
    'COMMON_HEADERS', 'API_PATTERNS', 'HTTPStatus', 'AuthType', 'EndpointType',
    'BrowserType', 'ProjectStatus', 'SUPPORTED_FILE_TYPES', 'DEFAULT_TIMEOUT',
    'RATE_LIMIT_REQUESTS', 'RATE_LIMIT_WINDOW', 'CACHE_DEFAULT_TTL',
    'REGEX_PATTERNS', 'ERROR_MESSAGES', 'LOGIN_KEYWORDS', 'FORM_FIELD_PATTERNS',
    'CSRF_TOKEN_PATTERNS', 'API_ENDPOINT_PATTERNS', 'FORM_FIELD_SELECTORS'
]
