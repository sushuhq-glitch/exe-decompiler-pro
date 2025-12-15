"""
Website Analyzer - Comprehensive website analysis and login detection
=====================================================================

This module provides advanced website analysis capabilities including:
- Automatic login page detection
- Form analysis and field identification  
- DOM structure analysis
- JavaScript detection and analysis
- API endpoint discovery from page source
- Cookie and session management
- Security header analysis
- Mobile vs desktop detection
- Performance metrics
- Screenshot capture
- Network waterfall analysis

Author: Telegram API Checker Bot Team
Version: 1.0.0
License: MIT
"""

import asyncio
import logging
import re
import json
import time
import hashlib
from typing import Dict, Any, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse, parse_qs
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.chrome.service import Service as ChromeService
    from selenium.common.exceptions import (
        TimeoutException, 
        NoSuchElementException,
        WebDriverException
    )
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False

try:
    from bs4 import BeautifulSoup
    from bs4.element import Tag, NavigableString
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False
    # Fallback classes when BeautifulSoup is not available
    class Tag:
        """Fallback Tag class when bs4 is not installed."""
        pass
    
    class NavigableString:
        """Fallback NavigableString class when bs4 is not installed."""
        pass

try:
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    from PIL import Image
    import io
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from utils.logger import get_logger
from utils.helpers import sanitize_url, extract_domain, is_valid_url
from utils.constants import (
    LOGIN_KEYWORDS,
    FORM_FIELD_PATTERNS,
    CSRF_TOKEN_PATTERNS,
    API_ENDPOINT_PATTERNS,
    FORM_FIELD_SELECTORS
)

# Import BrowserController for network interception script
try:
    from interceptor.browser_controller import BrowserController
    BROWSER_CONTROLLER_AVAILABLE = True
except ImportError:
    BROWSER_CONTROLLER_AVAILABLE = False
    BrowserController = None

logger = get_logger(__name__)


class PageType(Enum):
    """Enumeration of different page types."""
    LOGIN = "login"
    REGISTER = "register"
    FORGOT_PASSWORD = "forgot_password"
    TWO_FACTOR = "two_factor"
    PROFILE = "profile"
    DASHBOARD = "dashboard"
    HOME = "home"
    UNKNOWN = "unknown"


class FormType(Enum):
    """Enumeration of form types."""
    LOGIN = "login"
    REGISTRATION = "registration"
    SEARCH = "search"
    CONTACT = "contact"
    PAYMENT = "payment"
    PASSWORD_RESET = "password_reset"
    NEWSLETTER = "newsletter"
    UNKNOWN = "unknown"


@dataclass
class FormField:
    """Represents a form input field."""
    name: str
    field_type: str
    value: str = ""
    placeholder: str = ""
    required: bool = False
    pattern: Optional[str] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    autocomplete: Optional[str] = None
    id: Optional[str] = None
    css_classes: List[str] = field(default_factory=list)
    aria_label: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "type": self.field_type,
            "value": self.value,
            "placeholder": self.placeholder,
            "required": self.required,
            "pattern": self.pattern,
            "min_length": self.min_length,
            "max_length": self.max_length,
            "autocomplete": self.autocomplete,
            "id": self.id,
            "classes": self.css_classes,
            "aria_label": self.aria_label
        }


@dataclass
class FormInfo:
    """Represents a complete form structure."""
    action: str
    method: str
    form_type: FormType
    fields: List[FormField]
    form_id: Optional[str] = None
    css_classes: List[str] = field(default_factory=list)
    has_captcha: bool = False
    has_recaptcha: bool = False
    has_csrf: bool = False
    csrf_token: Optional[str] = None
    encoding: str = "application/x-www-form-urlencoded"
    validation_rules: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "action": self.action,
            "method": self.method,
            "type": self.form_type.value,
            "fields": [f.to_dict() for f in self.fields],
            "id": self.form_id,
            "classes": self.css_classes,
            "has_captcha": self.has_captcha,
            "has_recaptcha": self.has_recaptcha,
            "has_csrf": self.has_csrf,
            "csrf_token": self.csrf_token,
            "encoding": self.encoding,
            "validation_rules": self.validation_rules
        }


@dataclass
class PageMetrics:
    """Page performance and metrics."""
    load_time: float = 0.0
    dom_ready_time: float = 0.0
    first_paint_time: float = 0.0
    resource_count: int = 0
    script_count: int = 0
    stylesheet_count: int = 0
    image_count: int = 0
    xhr_count: int = 0
    total_size: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "load_time": self.load_time,
            "dom_ready_time": self.dom_ready_time,
            "first_paint_time": self.first_paint_time,
            "resource_count": self.resource_count,
            "script_count": self.script_count,
            "stylesheet_count": self.stylesheet_count,
            "image_count": self.image_count,
            "xhr_count": self.xhr_count,
            "total_size": self.total_size
        }


class WebsiteAnalyzer:
    """
    Comprehensive website analyzer for finding login pages and extracting forms.
    
    This class provides extensive website analysis capabilities including
    automatic login detection, form parsing, security analysis, and more.
    
    Features:
    ---------
    - Multi-strategy login page detection
    - Deep form analysis with field validation
    - CSRF token extraction
    - Cookie and session analysis
    - Security header inspection
    - JavaScript code analysis
    - API endpoint discovery
    - Mobile responsiveness detection
    - Performance metrics collection
    - Screenshot capture
    - DOM fingerprinting
    
    Attributes:
        logger: Logger instance
        driver: Selenium WebDriver instance
        session: Requests session with retry logic
        config: Configuration dictionary
        screenshot_dir: Directory for storing screenshots
    """
    
    # Common login page paths to try
    LOGIN_PATHS = [
        "/login", "/signin", "/auth", "/authenticate", "/log-in", "/sign-in",
        "/user/login", "/account/login", "/member/login", "/customer/login",
        "/auth/login", "/login.php", "/login.html", "/login.aspx",
        "/signin.php", "/signin.html", "/signin.aspx",
        "/sso/login", "/oauth/login", "/connect/login",
        "/portal/login", "/app/login", "/api/login",
        "/v1/login", "/v2/login", "/v3/login",
        "/en/login", "/it/login", "/de/login", "/fr/login", "/es/login",
        "/users/sign_in", "/users/login", "/session/new",
        "/accounts/login", "/accounts/signin", "/accounts/auth",
        "/authorization/login", "/authorization/signin"
    ]
    
    # Keywords to identify login pages in URL, title, or content
    LOGIN_KEYWORDS = [
        "login", "signin", "sign-in", "log-in", "authenticate", "authentication",
        "auth", "sso", "oauth", "connect", "accedi", "entra", "iniciar",
        "anmelden", "connexion", "entrar", "session", "logon", "access"
    ]
    
    # Pattern for detecting form field types
    FIELD_TYPE_PATTERNS = {
        "email": [
            r"email", r"e-mail", r"mail", r"correo", r"posta",
            r"user.*mail", r"account.*mail"
        ],
        "password": [
            r"pass", r"pwd", r"password", r"senha", r"contraseña",
            r"contrasena", r"mot.*passe", r"parola", r"kennwort"
        ],
        "username": [
            r"user", r"username", r"login", r"account", r"userid",
            r"user.*name", r"account.*name", r"nome.*utente"
        ],
        "phone": [
            r"phone", r"mobile", r"telefono", r"cellulare", r"tel",
            r"numero", r"contact.*number"
        ],
        "otp": [
            r"otp", r"code", r"token", r"verification", r"verifica",
            r"2fa", r"mfa", r"auth.*code"
        ]
    }
    
    def __init__(
        self, 
        config: Optional[Dict[str, Any]] = None,
        headless: bool = True,
        screenshot_dir: Optional[Path] = None
    ):
        """
        Initialize the WebsiteAnalyzer.
        
        Args:
            config: Configuration dictionary
            headless: Whether to run browser in headless mode
            screenshot_dir: Directory for storing screenshots
        """
        self.logger = logger
        self.driver: Optional[webdriver.Chrome] = None
        self.session: Optional[requests.Session] = None
        self.config = config or {}
        self.headless = headless
        self.screenshot_dir = screenshot_dir or Path("./screenshots")
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        
        # Analysis results cache
        self._cache: Dict[str, Any] = {}
        
        # Initialize HTTP session with retry logic
        self._init_session()
    
    def _init_session(self) -> None:
        """Initialize requests session with retry strategy."""
        if not REQUESTS_AVAILABLE:
            self.logger.warning("requests library not available")
            return
            
        self.session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set default headers
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,it;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        })
    
    def _init_driver(self) -> None:
        """Initialize Selenium WebDriver."""
        if not SELENIUM_AVAILABLE:
            self.logger.warning("Selenium not available")
            return
            
        if self.driver is not None:
            return
        
        try:
            options = ChromeOptions()
            
            if self.headless:
                options.add_argument("--headless=new")
            
            # Additional options for stability
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-popup-blocking")
            options.add_argument("--start-maximized")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_argument(f"--window-size=1920,1080")
            
            # Set user agent
            options.add_argument(
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            
            # Exclude automation flags
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option("useAutomationExtension", False)
            
            # Enable performance logging
            options.set_capability("goog:loggingPrefs", {"performance": "ALL"})
            
            self.driver = webdriver.Chrome(options=options)
            self.driver.execute_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            
            # Set timeouts
            self.driver.set_page_load_timeout(30)
            self.driver.implicitly_wait(10)
            
            self.logger.info("✅ WebDriver initialized successfully")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize WebDriver: {e}")
            self.driver = None
    
    async def analyze(self, url: str, deep: bool = True) -> Dict[str, Any]:
        """
        Perform comprehensive website analysis.
        
        Args:
            url: Website URL to analyze
            deep: Whether to perform deep analysis (slower but more thorough)
        
        Returns:
            Dictionary containing analysis results
        """
        self.logger.info(f"🔍 Starting analysis of {url}")
        start_time = time.time()
        
        # Sanitize and validate URL
        url = sanitize_url(url)
        if not is_valid_url(url):
            raise ValueError(f"Invalid URL: {url}")
        
        # Check cache
        cache_key = hashlib.md5(f"{url}:{deep}".encode()).hexdigest()
        if cache_key in self._cache:
            self.logger.info("📦 Returning cached results")
            return self._cache[cache_key]
        
        results = {
            "url": url,
            "domain": extract_domain(url),
            "timestamp": datetime.now().isoformat(),
            "analysis_time": 0.0,
            "login_url": None,
            "page_type": PageType.UNKNOWN.value,
            "forms": [],
            "forms_count": 0,
            "fields_count": 0,
            "endpoints": [],
            "cookies": [],
            "headers": {},
            "meta_tags": [],
            "security": {},
            "javascript": {},
            "metrics": {},
            "screenshots": [],
            "errors": []
        }
        
        try:
            # Step 1: Find login page
            self.logger.info("📍 Step 1: Finding login page...")
            login_url = await self._find_login_page(url)
            results["login_url"] = login_url or url
            target_url = results["login_url"]
            
            # Step 2: Analyze page type
            self.logger.info("🔍 Step 2: Identifying page type...")
            results["page_type"] = await self._identify_page_type(target_url)
            
            # Step 3: Analyze forms
            self.logger.info("📋 Step 3: Analyzing forms...")
            forms = await self._analyze_forms(target_url, deep=deep)
            results["forms"] = [f.to_dict() for f in forms]
            results["forms_count"] = len(forms)
            results["fields_count"] = sum(len(f.fields) for f in forms)
            
            # Step 4: Extract meta information
            self.logger.info("🏷️  Step 4: Extracting meta information...")
            meta = await self._extract_meta_info(target_url)
            results.update(meta)
            
            # Step 5: Security analysis
            self.logger.info("🔒 Step 5: Performing security analysis...")
            security = await self._analyze_security(target_url)
            results["security"] = security
            
            # Step 6: JavaScript analysis
            if deep:
                self.logger.info("📜 Step 6: Analyzing JavaScript...")
                js_analysis = await self._analyze_javascript(target_url)
                results["javascript"] = js_analysis
            
            # Step 7: Performance metrics
            if deep:
                self.logger.info("⚡ Step 7: Collecting performance metrics...")
                metrics = await self._collect_metrics(target_url)
                results["metrics"] = metrics.to_dict() if metrics else {}
            
            # Step 8: Screenshot
            self.logger.info("📸 Step 8: Capturing screenshot...")
            screenshot = await self._capture_screenshot(target_url)
            if screenshot:
                results["screenshots"].append(screenshot)
            
            # Step 9: Network capture with fake login (if forms found)
            if results["forms_count"] > 0 and deep:
                self.logger.info("🔐 Step 9: Executing fake login to capture APIs...")
                network_data = await self._capture_network_with_fake_login(target_url)
                if network_data.get("success"):
                    results["network_capture"] = network_data
                    results["api_calls"] = network_data.get("api_calls", [])
                    results["login_api"] = network_data.get("login_api")
            
            # Calculate analysis time
            results["analysis_time"] = time.time() - start_time
            
            self.logger.info(
                f"✅ Analysis complete in {results['analysis_time']:.2f}s: "
                f"found {results['forms_count']} forms with {results['fields_count']} fields"
            )
            
            # Cache results
            self._cache[cache_key] = results
            
        except Exception as e:
            self.logger.error(f"❌ Analysis failed: {e}", exc_info=True)
            results["errors"].append(str(e))
            raise
        
        return results
    
    async def _find_login_page(self, url: str) -> Optional[str]:
        """
        Find the login page URL using multiple strategies.
        
        Strategies:
        1. Try common login paths
        2. Look for login links in homepage
        3. Search for authentication redirects
        4. Check robots.txt hints
        5. Analyze sitemap.xml
        
        Args:
            url: Base website URL
        
        Returns:
            Login page URL if found, None otherwise
        """
        base_url = url.rstrip("/")
        
        # Strategy 1: Try common login paths
        for path in self.LOGIN_PATHS:
            test_url = base_url + path
            try:
                response = self.session.head(test_url, timeout=5, allow_redirects=True)
                if response.status_code == 200:
                    self.logger.info(f"✅ Found login page via path: {test_url}")
                    return test_url
            except Exception:
                continue
        
        # Strategy 2: Look for login links in homepage
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Search for login links
            for link in soup.find_all("a", href=True):
                href = link.get("href", "").lower()
                text = link.get_text().lower()
                
                # Check if link text or href contains login keywords
                if any(keyword in href or keyword in text for keyword in self.LOGIN_KEYWORDS):
                    login_url = urljoin(url, link["href"])
                    self.logger.info(f"✅ Found login page via link: {login_url}")
                    return login_url
            
            # Check buttons with onclick events
            for button in soup.find_all(["button", "div", "span"], onclick=True):
                onclick = button.get("onclick", "").lower()
                if any(keyword in onclick for keyword in self.LOGIN_KEYWORDS):
                    # Try to extract URL from onclick
                    url_match = re.search(r"['\"]([^'\"]*(?:login|signin)[^'\"]*)['\"]", onclick)
                    if url_match:
                        login_url = urljoin(url, url_match.group(1))
                        self.logger.info(f"✅ Found login page via onclick: {login_url}")
                        return login_url
        
        except Exception as e:
            self.logger.warning(f"Homepage analysis failed: {e}")
        
        # Strategy 3: Check for auth redirects
        try:
            protected_paths = ["/dashboard", "/profile", "/account", "/user"]
            for path in protected_paths:
                test_url = base_url + path
                response = self.session.get(test_url, timeout=5, allow_redirects=True)
                if response.history and response.url != test_url:
                    # Check if redirected to login
                    if any(keyword in response.url.lower() for keyword in self.LOGIN_KEYWORDS):
                        self.logger.info(f"✅ Found login page via redirect: {response.url}")
                        return response.url
        except Exception as e:
            self.logger.warning(f"Redirect analysis failed: {e}")
        
        self.logger.warning("⚠️ Could not find login page, using base URL")
        return None
    
    async def _identify_page_type(self, url: str) -> str:
        """
        Identify the type of page being analyzed.
        
        Args:
            url: Page URL
        
        Returns:
            Page type string
        """
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Get page title and body text
            title = soup.find("title")
            title_text = title.get_text().lower() if title else ""
            body_text = soup.get_text().lower()[:5000]  # First 5000 chars
            url_lower = url.lower()
            
            # Check for two-factor authentication
            if any(kw in title_text or kw in body_text or kw in url_lower 
                   for kw in ["2fa", "two factor", "verification code", "otp"]):
                return PageType.TWO_FACTOR.value
            
            # Check for forgot password
            if any(kw in title_text or kw in body_text or kw in url_lower 
                   for kw in ["forgot", "reset", "recover", "recupera"]):
                return PageType.FORGOT_PASSWORD.value
            
            # Check for registration
            if any(kw in title_text or kw in body_text or kw in url_lower 
                   for kw in ["register", "signup", "sign up", "create account", "registra"]):
                return PageType.REGISTER.value
            
            # Check for login
            if any(kw in title_text or kw in url_lower 
                   for kw in self.LOGIN_KEYWORDS):
                return PageType.LOGIN.value
            
            # Check for profile
            if any(kw in url_lower for kw in ["profile", "account", "user", "profilo"]):
                return PageType.PROFILE.value
            
            # Check for dashboard
            if any(kw in url_lower for kw in ["dashboard", "panel", "admin"]):
                return PageType.DASHBOARD.value
            
            return PageType.UNKNOWN.value
            
        except Exception as e:
            self.logger.warning(f"Page type identification failed: {e}")
            return PageType.UNKNOWN.value
    
    async def _analyze_forms(self, url: str, deep: bool = True) -> List[FormInfo]:
        """
        Analyze all forms on the page in detail.
        Uses both static HTML parsing and dynamic browser rendering.
        
        Args:
            url: Page URL
            deep: Whether to perform deep analysis
        
        Returns:
            List of FormInfo objects
        """
        forms = []
        
        # Try static HTML parsing first (faster)
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            
            for form_elem in soup.find_all("form"):
                try:
                    form_info = await self._parse_form(form_elem, url, deep=deep)
                    forms.append(form_info)
                except Exception as e:
                    self.logger.warning(f"Failed to parse form: {e}")
                    continue
            
            # If we found forms, return them
            if forms:
                self.logger.info(f"✅ Found {len(forms)} forms via static HTML parsing")
                return forms
            
            # If no forms found, log and try with browser
            self.logger.warning("⚠️ No forms found in static HTML, trying with browser...")
        
        except Exception as e:
            self.logger.error(f"Static form analysis failed: {e}")
        
        # Try with browser if no forms found (for JavaScript-rendered forms)
        if not forms and SELENIUM_AVAILABLE:
            try:
                if not self.driver:
                    self._init_driver()
                
                if self.driver:
                    self.logger.info("🌐 Loading page with browser for dynamic form detection...")
                    self.driver.get(url)
                    
                    # Wait for page to load and JavaScript to execute
                    await asyncio.sleep(2)
                    
                    # Get rendered HTML
                    page_source = self.driver.page_source
                    soup = BeautifulSoup(page_source, "html.parser")
                    
                    for form_elem in soup.find_all("form"):
                        try:
                            form_info = await self._parse_form(form_elem, url, deep=deep)
                            forms.append(form_info)
                        except Exception as e:
                            self.logger.warning(f"Failed to parse dynamic form: {e}")
                            continue
                    
                    if forms:
                        self.logger.info(f"✅ Found {len(forms)} forms via browser rendering")
                    else:
                        self.logger.warning("⚠️ Still no forms found after browser rendering")
            
            except Exception as e:
                self.logger.error(f"Dynamic form analysis failed: {e}")
        
        return forms
    
    async def _parse_form(self, form_elem: Tag, base_url: str, deep: bool = True) -> FormInfo:
        """
        Parse a single form element in detail.
        
        Args:
            form_elem: BeautifulSoup form element
            base_url: Base URL for resolving relative action URLs
            deep: Whether to perform deep analysis
        
        Returns:
            FormInfo object
        """
        # Extract basic form attributes
        action = form_elem.get("action", "")
        action = urljoin(base_url, action) if action else base_url
        method = form_elem.get("method", "GET").upper()
        form_id = form_elem.get("id")
        css_classes = form_elem.get("class", [])
        encoding = form_elem.get("enctype", "application/x-www-form-urlencoded")
        
        # Parse all form fields
        fields = []
        csrf_token = None
        has_captcha = False
        has_recaptcha = False
        
        # Find all input elements
        for input_elem in form_elem.find_all(["input", "textarea", "select"]):
            field = await self._parse_form_field(input_elem)
            if field:
                fields.append(field)
                
                # Check for CSRF token
                if "csrf" in field.name.lower() or "token" in field.name.lower():
                    if field.field_type == "hidden" and field.value:
                        csrf_token = field.value
                        has_csrf = True
        
        # Check for CAPTCHA
        if form_elem.find(class_=re.compile(r"captcha|recaptcha", re.I)):
            has_captcha = True
        if form_elem.find("div", {"class": "g-recaptcha"}):
            has_recaptcha = True
        
        # Determine form type
        form_type = self._determine_form_type(fields, form_elem)
        
        # Extract validation rules if deep analysis
        validation_rules = {}
        if deep:
            validation_rules = self._extract_validation_rules(form_elem)
        
        return FormInfo(
            action=action,
            method=method,
            form_type=form_type,
            fields=fields,
            form_id=form_id,
            css_classes=css_classes if isinstance(css_classes, list) else [css_classes],
            has_captcha=has_captcha,
            has_recaptcha=has_recaptcha,
            has_csrf=csrf_token is not None,
            csrf_token=csrf_token,
            encoding=encoding,
            validation_rules=validation_rules
        )
    
    async def _parse_form_field(self, elem: Tag) -> Optional[FormField]:
        """
        Parse a single form field element.
        
        Args:
            elem: BeautifulSoup element
        
        Returns:
            FormField object or None if invalid
        """
        name = elem.get("name", "")
        if not name:
            return None
        
        field_type = elem.get("type", "text")
        value = elem.get("value", "")
        placeholder = elem.get("placeholder", "")
        required = elem.has_attr("required")
        pattern = elem.get("pattern")
        min_length = elem.get("minlength")
        max_length = elem.get("maxlength")
        autocomplete = elem.get("autocomplete")
        field_id = elem.get("id")
        css_classes = elem.get("class", [])
        aria_label = elem.get("aria-label")
        
        # Convert string lengths to int
        if min_length:
            try:
                min_length = int(min_length)
            except ValueError:
                min_length = None
        if max_length:
            try:
                max_length = int(max_length)
            except ValueError:
                max_length = None
        
        return FormField(
            name=name,
            field_type=field_type,
            value=value,
            placeholder=placeholder,
            required=required,
            pattern=pattern,
            min_length=min_length,
            max_length=max_length,
            autocomplete=autocomplete,
            id=field_id,
            css_classes=css_classes if isinstance(css_classes, list) else [css_classes],
            aria_label=aria_label
        )
    
    def _determine_form_type(self, fields: List[FormField], form_elem: Tag) -> FormType:
        """
        Determine the type of form based on its fields and attributes.
        
        Args:
            fields: List of form fields
            form_elem: Form element
        
        Returns:
            FormType enum value
        """
        # Get form text content
        form_text = form_elem.get_text().lower()
        form_id = str(form_elem.get("id", "")).lower()
        form_classes = " ".join(form_elem.get("class", [])).lower()
        
        # Check for login form
        has_password = any(f.field_type == "password" for f in fields)
        has_email_or_username = any(
            f.field_type == "email" or "user" in f.name.lower() or "email" in f.name.lower()
            for f in fields
        )
        
        if has_password and has_email_or_username and len(fields) <= 4:
            if any(kw in form_text for kw in ["login", "signin", "accedi", "entra"]):
                return FormType.LOGIN
        
        # Check for registration form
        if len(fields) >= 4 and has_password:
            if any(kw in form_text for kw in ["register", "signup", "create", "registra"]):
                return FormType.REGISTRATION
        
        # Check for password reset
        if has_email_or_username and not has_password:
            if any(kw in form_text for kw in ["forgot", "reset", "recover"]):
                return FormType.PASSWORD_RESET
        
        # Check for payment form
        if any("card" in f.name.lower() or "payment" in f.name.lower() for f in fields):
            return FormType.PAYMENT
        
        # Check for newsletter
        if len(fields) <= 2 and has_email_or_username:
            if any(kw in form_text for kw in ["newsletter", "subscribe", "iscriviti"]):
                return FormType.NEWSLETTER
        
        # Check for search form
        if any(f.name.lower() in ["q", "search", "query"] for f in fields):
            return FormType.SEARCH
        
        # Check for contact form
        if any("message" in f.name.lower() or "msg" in f.name.lower() for f in fields):
            return FormType.CONTACT
        
        return FormType.UNKNOWN
    
    def _extract_validation_rules(self, form_elem: Tag) -> Dict[str, Any]:
        """
        Extract JavaScript validation rules from form.
        
        Args:
            form_elem: Form element
        
        Returns:
            Dictionary of validation rules
        """
        rules = {}
        
        # Look for data-validate attributes
        for elem in form_elem.find_all(attrs={"data-validate": True}):
            name = elem.get("name")
            if name:
                rules[name] = elem.get("data-validate")
        
        # Look for pattern attributes
        for elem in form_elem.find_all(attrs={"pattern": True}):
            name = elem.get("name")
            if name:
                if name not in rules:
                    rules[name] = {}
                rules[name]["pattern"] = elem.get("pattern")
        
        return rules
    
    async def _extract_meta_info(self, url: str) -> Dict[str, Any]:
        """
        Extract comprehensive meta information from page.
        
        Args:
            url: Page URL
        
        Returns:
            Dictionary with meta information
        """
        meta_info = {
            "meta_tags": [],
            "csrf_tokens": [],
            "api_endpoints": [],
            "cookies": [],
            "headers": {},
            "title": "",
            "description": "",
            "keywords": [],
            "og_tags": {},
            "twitter_tags": {},
            "json_ld": []
        }
        
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Extract title
            title = soup.find("title")
            if title:
                meta_info["title"] = title.get_text().strip()
            
            # Extract meta tags
            for meta in soup.find_all("meta"):
                meta_data = {
                    "name": meta.get("name", ""),
                    "property": meta.get("property", ""),
                    "content": meta.get("content", ""),
                    "http_equiv": meta.get("http-equiv", "")
                }
                meta_info["meta_tags"].append(meta_data)
                
                # Extract specific meta information
                if meta.get("name") == "description":
                    meta_info["description"] = meta.get("content", "")
                elif meta.get("name") == "keywords":
                    meta_info["keywords"] = [
                        kw.strip() for kw in meta.get("content", "").split(",")
                    ]
                elif meta.get("property", "").startswith("og:"):
                    meta_info["og_tags"][meta.get("property")] = meta.get("content", "")
                elif meta.get("name", "").startswith("twitter:"):
                    meta_info["twitter_tags"][meta.get("name")] = meta.get("content", "")
            
            # Look for CSRF tokens in multiple places
            csrf_patterns = [
                (By.NAME, re.compile(r"csrf|xsrf|token", re.I)),
                (By.ID, re.compile(r"csrf|xsrf|token", re.I))
            ]
            
            for input_tag in soup.find_all("input", type="hidden"):
                name = input_tag.get("name", "").lower()
                if any(pattern in name for pattern in ["csrf", "xsrf", "token", "_token"]):
                    token_value = input_tag.get("value")
                    if token_value:
                        meta_info["csrf_tokens"].append({
                            "name": input_tag.get("name"),
                            "value": token_value,
                            "location": "hidden_input"
                        })
            
            # Check meta tags for CSRF
            for meta in soup.find_all("meta"):
                name = meta.get("name", "").lower()
                if "csrf" in name or "token" in name:
                    meta_info["csrf_tokens"].append({
                        "name": meta.get("name"),
                        "value": meta.get("content"),
                        "location": "meta_tag"
                    })
            
            # Extract JSON-LD structured data
            for script in soup.find_all("script", type="application/ld+json"):
                try:
                    json_data = json.loads(script.string)
                    meta_info["json_ld"].append(json_data)
                except Exception:
                    pass
            
            # Extract API endpoints from JavaScript
            for script in soup.find_all("script"):
                script_text = script.string if script.string else ""
                # Look for API endpoint patterns
                api_patterns = [
                    r'["\']/(api|v\d+)/[^"\']+["\']',
                    r'["\']https?://[^"\']+/(api|v\d+)/[^"\']+["\']',
                    r'endpoint:\s*["\']([^"\']+)["\']',
                    r'url:\s*["\']([^"\']+)["\']'
                ]
                for pattern in api_patterns:
                    matches = re.findall(pattern, script_text)
                    for match in matches:
                        endpoint = match if isinstance(match, str) else match[0]
                        if endpoint not in meta_info["api_endpoints"]:
                            meta_info["api_endpoints"].append(endpoint)
            
            # Store response headers
            meta_info["headers"] = dict(response.headers)
            
            # Store cookies
            for cookie in response.cookies:
                meta_info["cookies"].append({
                    "name": cookie.name,
                    "value": cookie.value,
                    "domain": cookie.domain,
                    "path": cookie.path,
                    "secure": cookie.secure,
                    "httponly": cookie.has_nonstandard_attr("HttpOnly")
                })
        
        except Exception as e:
            self.logger.error(f"Meta extraction failed: {e}")
        
        return meta_info
    
    async def _analyze_security(self, url: str) -> Dict[str, Any]:
        """
        Analyze security features of the website.
        
        Args:
            url: Page URL
        
        Returns:
            Dictionary with security analysis
        """
        security = {
            "https": False,
            "hsts": False,
            "csp": None,
            "x_frame_options": None,
            "x_content_type_options": None,
            "referrer_policy": None,
            "permissions_policy": None,
            "cors": None,
            "cookies_secure": True,
            "cookies_httponly": True,
            "ssl_info": {}
        }
        
        try:
            response = self.session.get(url, timeout=10)
            headers = response.headers
            
            # Check HTTPS
            security["https"] = url.startswith("https://")
            
            # Check security headers
            security["hsts"] = "Strict-Transport-Security" in headers
            security["csp"] = headers.get("Content-Security-Policy")
            security["x_frame_options"] = headers.get("X-Frame-Options")
            security["x_content_type_options"] = headers.get("X-Content-Type-Options")
            security["referrer_policy"] = headers.get("Referrer-Policy")
            security["permissions_policy"] = headers.get("Permissions-Policy")
            security["cors"] = headers.get("Access-Control-Allow-Origin")
            
            # Check cookie security
            for cookie in response.cookies:
                if not cookie.secure:
                    security["cookies_secure"] = False
                if not cookie.has_nonstandard_attr("HttpOnly"):
                    security["cookies_httponly"] = False
        
        except Exception as e:
            self.logger.error(f"Security analysis failed: {e}")
        
        return security
    
    async def _analyze_javascript(self, url: str) -> Dict[str, Any]:
        """
        Analyze JavaScript code on the page.
        
        Args:
            url: Page URL
        
        Returns:
            Dictionary with JavaScript analysis
        """
        js_analysis = {
            "script_count": 0,
            "inline_scripts": 0,
            "external_scripts": 0,
            "frameworks": [],
            "libraries": [],
            "api_calls": [],
            "storage_usage": {
                "localStorage": False,
                "sessionStorage": False,
                "cookies": False,
                "indexedDB": False
            }
        }
        
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Count scripts
            scripts = soup.find_all("script")
            js_analysis["script_count"] = len(scripts)
            
            # Analyze each script
            for script in scripts:
                if script.get("src"):
                    js_analysis["external_scripts"] += 1
                    src = script.get("src")
                    
                    # Detect frameworks and libraries
                    if "react" in src.lower():
                        js_analysis["frameworks"].append("React")
                    elif "vue" in src.lower():
                        js_analysis["frameworks"].append("Vue.js")
                    elif "angular" in src.lower():
                        js_analysis["frameworks"].append("Angular")
                    elif "jquery" in src.lower():
                        js_analysis["libraries"].append("jQuery")
                    elif "bootstrap" in src.lower():
                        js_analysis["libraries"].append("Bootstrap")
                else:
                    js_analysis["inline_scripts"] += 1
                    script_content = script.string if script.string else ""
                    
                    # Check for storage usage
                    if "localStorage" in script_content:
                        js_analysis["storage_usage"]["localStorage"] = True
                    if "sessionStorage" in script_content:
                        js_analysis["storage_usage"]["sessionStorage"] = True
                    if "document.cookie" in script_content:
                        js_analysis["storage_usage"]["cookies"] = True
                    if "indexedDB" in script_content:
                        js_analysis["storage_usage"]["indexedDB"] = True
                    
                    # Look for API calls
                    api_patterns = [
                        r'fetch\(["\']([^"\']+)["\']',
                        r'axios\.\w+\(["\']([^"\']+)["\']',
                        r'\$\.ajax\({.*?url:\s*["\']([^"\']+)["\']',
                        r'XMLHttpRequest.*?open\(["\'](\w+)["\']\s*,\s*["\']([^"\']+)["\']'
                    ]
                    for pattern in api_patterns:
                        matches = re.findall(pattern, script_content)
                        js_analysis["api_calls"].extend(matches)
            
            # Remove duplicates
            js_analysis["frameworks"] = list(set(js_analysis["frameworks"]))
            js_analysis["libraries"] = list(set(js_analysis["libraries"]))
            js_analysis["api_calls"] = list(set(js_analysis["api_calls"]))
        
        except Exception as e:
            self.logger.error(f"JavaScript analysis failed: {e}")
        
        return js_analysis
    
    async def _collect_metrics(self, url: str) -> Optional[PageMetrics]:
        """
        Collect page performance metrics using Selenium.
        
        Args:
            url: Page URL
        
        Returns:
            PageMetrics object or None if failed
        """
        if not SELENIUM_AVAILABLE or not self.driver:
            self._init_driver()
            if not self.driver:
                return None
        
        try:
            start_time = time.time()
            self.driver.get(url)
            load_time = time.time() - start_time
            
            # Get performance metrics from browser
            navigation_timing = self.driver.execute_script(
                "return window.performance.timing"
            )
            
            # Calculate metrics
            dom_ready_time = (
                navigation_timing["domContentLoadedEventEnd"] -
                navigation_timing["navigationStart"]
            ) / 1000.0
            
            # Count resources
            resources = self.driver.execute_script(
                "return window.performance.getEntriesByType('resource')"
            )
            
            script_count = sum(1 for r in resources if r.get("initiatorType") == "script")
            stylesheet_count = sum(1 for r in resources if r.get("initiatorType") == "link")
            image_count = sum(1 for r in resources if r.get("initiatorType") == "img")
            xhr_count = sum(1 for r in resources if r.get("initiatorType") == "xmlhttprequest")
            
            total_size = sum(r.get("transferSize", 0) for r in resources)
            
            return PageMetrics(
                load_time=load_time,
                dom_ready_time=dom_ready_time,
                first_paint_time=0.0,
                resource_count=len(resources),
                script_count=script_count,
                stylesheet_count=stylesheet_count,
                image_count=image_count,
                xhr_count=xhr_count,
                total_size=total_size
            )
        
        except Exception as e:
            self.logger.error(f"Metrics collection failed: {e}")
            return None
    
    async def _capture_screenshot(self, url: str) -> Optional[str]:
        """
        Capture a screenshot of the page.
        
        Args:
            url: Page URL
        
        Returns:
            Screenshot file path or None if failed
        """
        if not SELENIUM_AVAILABLE or not PIL_AVAILABLE:
            return None
        
        if not self.driver:
            self._init_driver()
            if not self.driver:
                return None
        
        try:
            self.driver.get(url)
            
            # Wait for page to load
            await asyncio.sleep(2)
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            domain = extract_domain(url)
            filename = f"{domain}_{timestamp}.png"
            filepath = self.screenshot_dir / filename
            
            # Take screenshot
            self.driver.save_screenshot(str(filepath))
            
            self.logger.info(f"📸 Screenshot saved: {filepath}")
            return str(filepath)
        
        except Exception as e:
            self.logger.error(f"Screenshot capture failed: {e}")
            return None
    
    async def _capture_network_with_fake_login(self, url: str) -> Dict[str, Any]:
        """
        Capture network traffic by executing a fake login.
        
        Args:
            url: Login page URL
        
        Returns:
            Dictionary with network capture results
        """
        if not SELENIUM_AVAILABLE:
            return {"success": False, "error": "Selenium not available"}
        
        try:
            # Initialize driver with CDP enabled
            if not self.driver:
                self._init_driver()
            
            if not self.driver:
                return {"success": False, "error": "Failed to initialize driver"}
            
            # Navigate to login page
            self.logger.info(f"🌐 Navigating to {url}")
            self.driver.get(url)
            await asyncio.sleep(2)
            
            # Enable network tracking via CDP
            try:
                self.driver.execute_cdp_cmd("Network.enable", {})
                self.logger.info("✅ Network tracking enabled")
            except Exception as e:
                self.logger.warning(f"Failed to enable CDP network tracking: {e}")
            
            # Inject network interception script
            if BROWSER_CONTROLLER_AVAILABLE and BrowserController:
                inject_script = BrowserController._get_network_interception_script()
            else:
                # Fallback to inline script if BrowserController not available
                inject_script = """
                (function() {
                    window.__interceptedRequests = [];
                    window.__interceptedResponses = [];
                    const originalFetch = window.fetch;
                    window.fetch = function(...args) {
                        window.__interceptedRequests.push({url: args[0], timestamp: Date.now()});
                        return originalFetch.apply(this, args);
                    };
                })();
                """
            
            self.driver.execute_script(inject_script)
            self.logger.info("✅ Network interception script injected")
            
            # Try to fill and submit login form
            try:
                # Find email/username field using shared selectors
                email_field = None
                for selector in FORM_FIELD_SELECTORS['email']:
                    try:
                        email_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                        break
                    except:
                        continue
                
                # Find password field using shared selectors
                password_field = None
                for selector in FORM_FIELD_SELECTORS['password']:
                    try:
                        password_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                        break
                    except:
                        continue
                
                # Fill form if fields found
                if email_field and password_field:
                    self.logger.info("📝 Filling login form with fake credentials...")
                    email_field.send_keys("test@example.com")
                    password_field.send_keys("password123")
                    
                    # Submit form using shared selectors
                    submit_button = None
                    for selector in FORM_FIELD_SELECTORS['submit']:
                        try:
                            submit_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                            break
                        except:
                            continue
                    
                    if submit_button:
                        submit_button.click()
                        self.logger.info("✅ Form submitted")
                        
                        # Wait for response
                        await asyncio.sleep(3)
                    else:
                        self.logger.warning("⚠️ Submit button not found")
                else:
                    self.logger.warning("⚠️ Could not find login form fields")
            
            except Exception as e:
                self.logger.warning(f"Failed to fill form: {e}")
            
            # Get intercepted requests
            intercepted_requests = self.driver.execute_script(
                "return window.__interceptedRequests || [];"
            )
            intercepted_responses = self.driver.execute_script(
                "return window.__interceptedResponses || [];"
            )
            
            # Get CDP network logs
            network_logs = []
            try:
                logs = self.driver.get_log('performance')
                for entry in logs:
                    try:
                        log = json.loads(entry['message'])['message']
                        if 'Network.' in log.get('method', ''):
                            network_logs.append(log)
                    except:
                        continue
            except Exception as e:
                self.logger.warning(f"Failed to get CDP logs: {e}")
            
            # Extract API calls
            api_calls = []
            login_api = None
            
            for req in intercepted_requests:
                url_lower = req.get('url', '').lower()
                method = req.get('method', 'GET')
                
                # Identify API calls
                if any(pattern in url_lower for pattern in ['/api/', '/v1/', '/v2/', '/graphql']):
                    api_calls.append({
                        'url': req['url'],
                        'method': method,
                        'type': 'api'
                    })
                
                # Identify login API
                if method == 'POST' and any(kw in url_lower for kw in LOGIN_KEYWORDS):
                    login_api = {
                        'url': req['url'],
                        'method': method,
                        'type': 'login'
                    }
            
            self.logger.info(
                f"✅ Network capture complete: {len(intercepted_requests)} requests, "
                f"{len(api_calls)} API calls, {'login API found' if login_api else 'no login API'}"
            )
            
            return {
                "success": True,
                "requests": intercepted_requests,
                "responses": intercepted_responses,
                "network_logs": network_logs,
                "api_calls": api_calls,
                "login_api": login_api
            }
        
        except Exception as e:
            self.logger.error(f"Network capture failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def cleanup(self):
        """Cleanup resources."""
        if self.driver:
            try:
                self.driver.quit()
                self.logger.info("✅ WebDriver closed")
            except Exception as e:
                self.logger.warning(f"Error closing WebDriver: {e}")
            self.driver = None
        
        if self.session:
            try:
                self.session.close()
                self.logger.info("✅ Session closed")
            except Exception as e:
                self.logger.warning(f"Error closing session: {e}")
            self.session = None
    
    def __del__(self):
        """Destructor to ensure cleanup."""
        self.cleanup()
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        self.cleanup()
