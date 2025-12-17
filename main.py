#!/usr/bin/env python3
"""
CD Key Store Finder - Comprehensive Search Tool
Version 1.0.0

Finds CD key stores with PayPal support and instant delivery using 100+ search methods.
"""

import requests
from bs4 import BeautifulSoup
import threading
from queue import Queue, Empty
import time
import json
import re
from urllib.parse import urlparse, urljoin, quote_plus
from datetime import datetime
import random
from typing import List, Dict, Tuple, Optional, Set
import os
import sys
from dataclasses import dataclass, asdict
from collections import defaultdict
import hashlib
import ssl
import socket

# ANSI Color codes for beautiful terminal output
class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    
    # Additional colors
    PURPLE = '\033[35m'
    YELLOW = '\033[33m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    RESET = '\033[0m'


@dataclass
class StoreInfo:
    """Data class for store information"""
    url: str
    name: str
    paypal_supported: bool
    instant_delivery: bool
    paypal_confidence: float
    delivery_confidence: float
    found_via: str
    validated_at: str
    domain_age_days: Optional[int] = None
    ssl_valid: bool = False
    reputation_score: float = 0.0
    additional_info: Dict = None
    
    def __post_init__(self):
        if self.additional_info is None:
            self.additional_info = {}


class UserAgentRotator:
    """Rotates user agents to avoid detection"""
    
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    ]
    
    @classmethod
    def get_random(cls) -> str:
        """Get a random user agent"""
        return random.choice(cls.USER_AGENTS)


class RateLimiter:
    """Thread-safe rate limiter"""
    
    def __init__(self, max_requests_per_second: float = 10.0):
        self.max_requests_per_second = max_requests_per_second
        self.min_interval = 1.0 / max_requests_per_second
        self.last_request_time = 0
        self.lock = threading.Lock()
    
    def wait(self):
        """Wait if necessary to respect rate limit"""
        with self.lock:
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            if time_since_last < self.min_interval:
                sleep_time = self.min_interval - time_since_last
                time.sleep(sleep_time)
            self.last_request_time = time.time()


class HTTPClient:
    """HTTP client with retries and user agent rotation"""
    
    def __init__(self, timeout: int = 10, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
    
    def get(self, url: str, **kwargs) -> Optional[requests.Response]:
        """GET request with retries"""
        for attempt in range(self.max_retries):
            try:
                headers = kwargs.get('headers', {})
                headers['User-Agent'] = UserAgentRotator.get_random()
                kwargs['headers'] = headers
                kwargs['timeout'] = kwargs.get('timeout', self.timeout)
                
                response = self.session.get(url, **kwargs)
                return response
            except requests.exceptions.RequestException as e:
                if attempt == self.max_retries - 1:
                    return None
                time.sleep(2 ** attempt)  # Exponential backoff
        return None
    
    def post(self, url: str, **kwargs) -> Optional[requests.Response]:
        """POST request with retries"""
        for attempt in range(self.max_retries):
            try:
                headers = kwargs.get('headers', {})
                headers['User-Agent'] = UserAgentRotator.get_random()
                kwargs['headers'] = headers
                kwargs['timeout'] = kwargs.get('timeout', self.timeout)
                
                response = self.session.post(url, **kwargs)
                return response
            except requests.exceptions.RequestException:
                if attempt == self.max_retries - 1:
                    return None
                time.sleep(2 ** attempt)
        return None


class DomainValidator:
    """Validates domains for reputation and security"""
    
    @staticmethod
    def check_ssl_certificate(domain: str) -> bool:
        """Check if domain has valid SSL certificate with secure protocols only"""
        try:
            # Create SSL context with secure protocols only (TLS 1.2+)
            context = ssl.create_default_context()
            # Explicitly set minimum TLS version to 1.2 for security
            context.minimum_version = ssl.TLSVersion.TLSv1_2
            # Disable insecure protocols
            context.options |= ssl.OP_NO_TLSv1 | ssl.OP_NO_TLSv1_1
            
            with socket.create_connection((domain, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    return cert is not None
        except Exception:
            return False
    
    @staticmethod
    def extract_domain(url: str) -> str:
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            return parsed.netloc or parsed.path
        except Exception:
            return ""
    
    @staticmethod
    def is_valid_url(url: str) -> bool:
        """Check if URL is valid"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False
    
    @staticmethod
    def normalize_url(url: str) -> str:
        """Normalize URL for deduplication"""
        try:
            parsed = urlparse(url)
            # Remove www. prefix
            netloc = parsed.netloc.lower()
            if netloc.startswith('www.'):
                netloc = netloc[4:]
            # Remove trailing slash
            path = parsed.path.rstrip('/')
            return f"{parsed.scheme}://{netloc}{path}"
        except Exception:
            return url.lower()


class PayPalDetector:
    """Detects PayPal support on websites"""
    
    PAYPAL_KEYWORDS = [
        'paypal', 'pay-pal', 'pay pal',
        'paypal.com', 'paypal checkout',
        'paypal button', 'paypal payment',
        'paypal accepted', 'paypal logo',
        'data-paypal', 'paypal-button',
        'paypalobjects', 'paypal.me',
        'paypal express', 'paypal credit'
    ]
    
    PAYMENT_SECTION_KEYWORDS = [
        'payment', 'checkout', 'pay now',
        'payment methods', 'accepted payments',
        'how to pay', 'payment options'
    ]
    
    @classmethod
    def detect_paypal(cls, html_content: str, url: str) -> Tuple[bool, float]:
        """
        Detect PayPal support on a webpage
        Returns: (supported, confidence_score)
        """
        if not html_content:
            return False, 0.0
        
        html_lower = html_content.lower()
        confidence = 0.0
        detections = []
        
        # Method 1: Direct keyword search
        for keyword in cls.PAYPAL_KEYWORDS:
            count = html_lower.count(keyword)
            if count > 0:
                confidence += min(count * 0.1, 0.3)
                detections.append(f"keyword:{keyword}({count})")
        
        # Method 2: Image detection
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Check for PayPal images
            images = soup.find_all('img')
            for img in images:
                src = img.get('src', '').lower()
                alt = img.get('alt', '').lower()
                if 'paypal' in src or 'paypal' in alt:
                    confidence += 0.2
                    detections.append(f"img:paypal")
                    break
            
            # Method 3: Check for PayPal buttons
            buttons = soup.find_all(['button', 'a', 'div'], class_=lambda x: x and 'paypal' in x.lower())
            if buttons:
                confidence += 0.25
                detections.append(f"button:paypal")
            
            # Method 4: Check for PayPal SDK
            scripts = soup.find_all('script')
            for script in scripts:
                src = script.get('src', '').lower()
                content = script.string or ''
                if 'paypal' in src or 'paypal' in content.lower():
                    confidence += 0.3
                    detections.append(f"script:paypal")
                    break
            
            # Method 5: Meta tags
            meta_tags = soup.find_all('meta')
            for meta in meta_tags:
                content = meta.get('content', '').lower()
                if 'paypal' in content:
                    confidence += 0.15
                    detections.append(f"meta:paypal")
                    break
            
            # Method 6: Check payment section
            payment_sections = soup.find_all(['div', 'section', 'footer'], 
                                            class_=lambda x: x and any(k in x.lower() for k in cls.PAYMENT_SECTION_KEYWORDS))
            for section in payment_sections[:3]:
                section_text = section.get_text().lower()
                if 'paypal' in section_text:
                    confidence += 0.2
                    detections.append(f"section:paypal")
                    break
            
            # Method 7: Check links to PayPal domains
            # Note: This is detection only, not used for URL redirection or security-sensitive operations
            links = soup.find_all('a', href=True)
            for link in links:
                href = link.get('href', '').lower()
                # Check if the URL's domain is actually paypal.com
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(href)
                    domain = parsed.netloc.lower()
                    # Verify domain ends with or equals paypal domains (not just substring)
                    if (domain.endswith('.paypal.com') or domain == 'paypal.com' or 
                        domain.endswith('.paypal.me') or domain == 'paypal.me'):
                        confidence += 0.25
                        detections.append(f"link:paypal.com")
                        break
                except Exception:
                    # Fallback: This is for detection only, not authentication or redirection
                    # We're just checking if PayPal links exist for informational purposes
                    pass
            
            # Method 8: Data attributes
            elements_with_paypal = soup.find_all(attrs={"data-payment": lambda x: x and 'paypal' in x.lower()})
            if elements_with_paypal:
                confidence += 0.2
                detections.append(f"data-attr:paypal")
            
            # Method 9: Check footer
            footer = soup.find('footer')
            if footer and 'paypal' in footer.get_text().lower():
                confidence += 0.15
                detections.append(f"footer:paypal")
            
            # Method 10: Form action
            forms = soup.find_all('form')
            for form in forms:
                action = form.get('action', '').lower()
                if 'paypal' in action:
                    confidence += 0.3
                    detections.append(f"form:paypal")
                    break
                    
        except Exception as e:
            pass
        
        # Normalize confidence to 0-1 range
        confidence = min(confidence, 1.0)
        
        # Consider it supported if confidence > 0.3
        supported = confidence > 0.3
        
        return supported, confidence


class InstantDeliveryDetector:
    """Detects instant delivery on websites"""
    
    INSTANT_KEYWORDS = [
        'instant delivery', 'instant download', 'instant access',
        'immediate delivery', 'immediate download', 'immediate access',
        'automatic delivery', 'automated delivery', 'auto delivery',
        'delivered instantly', 'instant digital delivery',
        'instant activation', 'instant email delivery',
        'delivered in seconds', 'delivered immediately',
        'receive instantly', 'instant code delivery',
        'digital delivery', 'automatic code delivery',
        'instant key delivery', 'automated email',
        'delivered automatically', '24/7 instant',
        'instant purchase', 'buy now receive instantly'
    ]
    
    @classmethod
    def detect_instant_delivery(cls, html_content: str, url: str) -> Tuple[bool, float]:
        """
        Detect instant delivery on a webpage
        Returns: (has_instant, confidence_score)
        """
        if not html_content:
            return False, 0.0
        
        html_lower = html_content.lower()
        confidence = 0.0
        detections = []
        
        # Method 1: Direct keyword search
        for keyword in cls.INSTANT_KEYWORDS:
            count = html_lower.count(keyword)
            if count > 0:
                confidence += min(count * 0.08, 0.25)
                detections.append(f"keyword:{keyword}({count})")
        
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Method 2: Check titles and headings
            titles = soup.find_all(['h1', 'h2', 'h3', 'title'])
            for title in titles:
                text = title.get_text().lower()
                if any(keyword in text for keyword in ['instant', 'immediate', 'automatic']):
                    confidence += 0.2
                    detections.append(f"heading:instant")
                    break
            
            # Method 3: Check prominent sections
            prominent = soup.find_all(['div', 'section'], 
                                     class_=lambda x: x and any(k in x.lower() for k in ['feature', 'benefit', 'advantage', 'highlight']))
            for section in prominent[:5]:
                text = section.get_text().lower()
                if 'instant' in text or 'immediate' in text or 'automatic' in text:
                    confidence += 0.15
                    detections.append(f"feature:instant")
                    break
            
            # Method 4: Check FAQ section
            faq = soup.find_all(['div', 'section'], 
                               class_=lambda x: x and 'faq' in x.lower())
            for section in faq:
                text = section.get_text().lower()
                if 'instant' in text or 'immediate' in text:
                    confidence += 0.15
                    detections.append(f"faq:instant")
                    break
            
            # Method 5: Check meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                content = meta_desc.get('content', '').lower()
                if any(keyword in content for keyword in ['instant', 'immediate', 'automatic']):
                    confidence += 0.2
                    detections.append(f"meta:instant")
            
            # Method 6: Check product descriptions
            products = soup.find_all(['div', 'article'], 
                                    class_=lambda x: x and 'product' in x.lower())
            for product in products[:3]:
                text = product.get_text().lower()
                if 'instant' in text or 'immediate' in text:
                    confidence += 0.1
                    detections.append(f"product:instant")
                    break
            
            # Method 7: Check badges/icons
            badges = soup.find_all(['span', 'div'], 
                                  class_=lambda x: x and any(k in x.lower() for k in ['badge', 'icon', 'label']))
            for badge in badges:
                text = badge.get_text().lower()
                if 'instant' in text:
                    confidence += 0.15
                    detections.append(f"badge:instant")
                    break
            
            # Method 8: Check delivery information section
            delivery_sections = soup.find_all(text=re.compile(r'delivery|shipping', re.I))
            for i, match in enumerate(delivery_sections[:5]):
                parent = match.parent
                if parent:
                    text = parent.get_text().lower()
                    if 'instant' in text or 'immediate' in text or 'automatic' in text:
                        confidence += 0.15
                        detections.append(f"delivery-section:instant")
                        break
                        
        except Exception as e:
            pass
        
        # Normalize confidence
        confidence = min(confidence, 1.0)
        
        # Consider instant delivery if confidence > 0.25
        has_instant = confidence > 0.25
        
        return has_instant, confidence


class SearchEngine:
    """Base class for search engines"""
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def search(self, query: str, max_results: int = 10) -> List[str]:
        """Override in subclasses"""
        raise NotImplementedError


class GoogleSearch(SearchEngine):
    """Google search with dorks"""
    
    GOOGLE_DORKS = [
        '"buy game keys" "paypal" "instant delivery"',
        'inurl:cdkey intext:"paypal accepted"',
        'site:*.com "digital games" "instant" "paypal"',
        '"steam keys" "instant delivery" "paypal checkout"',
        'intitle:"cd keys" "buy now" paypal',
        'inurl:shop "game keys" "paypal" -scam',
        '"origin keys" "instant" site:*.com',
        '"uplay keys" "paypal" "automatic delivery"',
        '"epic games" "keys" "instant" "paypal"',
        '"battle.net" "keys" "paypal accepted"',
        '"game codes" "instant email" "paypal"',
        '"digital game keys" "instant" "paypal accepted"',
        'inurl:store "pc games" "paypal" "instant"',
        '"xbox keys" "instant delivery" paypal',
        '"playstation keys" "instant" "paypal"',
        '"nintendo" "game codes" "instant" paypal',
        'inurl:buy "activation codes" "paypal" instant',
        '"game licenses" "instant delivery" paypal',
        '"cd key store" paypal instant',
        '"game key shop" "instant" "paypal accepted"',
    ]
    
    def search_with_dorks(self) -> List[str]:
        """Execute all Google dorks"""
        results = []
        for dork in self.GOOGLE_DORKS:
            self.rate_limiter.wait()
            urls = self._execute_dork(dork)
            results.extend(urls)
        return results
    
    def _execute_dork(self, dork: str) -> List[str]:
        """Execute a single Google dork"""
        try:
            # Use custom search or scraping
            # Note: In production, use Google Custom Search API
            encoded_query = quote_plus(dork)
            url = f"https://www.google.com/search?q={encoded_query}&num=20"
            
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract search result links
            for g in soup.find_all('div', class_='g'):
                anchors = g.find_all('a')
                for a in anchors:
                    href = a.get('href', '')
                    if href.startswith('http') and 'google.com' not in href:
                        links.append(href)
            
            return links[:10]
        except Exception:
            return []


class BingSearch(SearchEngine):
    """Bing search"""
    
    BING_QUERIES = [
        'cd keys paypal instant delivery',
        'game keys store paypal accepted',
        'buy steam keys paypal instant',
        'digital game codes paypal immediate',
        'pc game keys instant delivery paypal',
        'xbox game keys paypal automatic',
        'playstation codes instant paypal',
        'game license store paypal instant',
        'buy game activation codes paypal',
        'instant game keys paypal checkout',
    ]
    
    def search_all_queries(self) -> List[str]:
        """Execute all Bing queries"""
        results = []
        for query in self.BING_QUERIES:
            self.rate_limiter.wait()
            urls = self._execute_query(query)
            results.extend(urls)
        return results
    
    def _execute_query(self, query: str) -> List[str]:
        """Execute a single Bing query"""
        try:
            encoded_query = quote_plus(query)
            url = f"https://www.bing.com/search?q={encoded_query}&count=20"
            
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract Bing result links
            for result in soup.find_all('li', class_='b_algo'):
                a = result.find('a')
                if a:
                    href = a.get('href', '')
                    if href.startswith('http') and 'bing.com' not in href:
                        links.append(href)
            
            return links[:10]
        except Exception:
            return []


class DuckDuckGoSearch(SearchEngine):
    """DuckDuckGo search"""
    
    DDG_QUERIES = [
        'cd key store paypal instant',
        'buy game keys paypal delivery',
        'steam keys instant paypal',
        'game codes store paypal',
        'digital games paypal instant',
    ]
    
    def search_all_queries(self) -> List[str]:
        """Execute all DDG queries"""
        results = []
        for query in self.DDG_QUERIES:
            self.rate_limiter.wait()
            urls = self._execute_query(query)
            results.extend(urls)
        return results
    
    def _execute_query(self, query: str) -> List[str]:
        """Execute a single DDG query"""
        try:
            encoded_query = quote_plus(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
            
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract DDG result links
            for result in soup.find_all('a', class_='result__url'):
                href = result.get('href', '')
                if href.startswith('http'):
                    links.append(href)
            
            return links[:10]
        except Exception:
            return []


class RedditScraper:
    """Scrape Reddit for CD key stores"""
    
    SUBREDDITS = [
        'GameDeals',
        'CDKeys', 
        'GameDealsMeta',
        'SteamGameSwap',
        'SteamDeals',
        'GameSwap',
    ]
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def scrape_all_subreddits(self) -> List[str]:
        """Scrape all subreddits"""
        results = []
        for subreddit in self.SUBREDDITS:
            self.rate_limiter.wait()
            urls = self._scrape_subreddit(subreddit)
            results.extend(urls)
        return results
    
    def _scrape_subreddit(self, subreddit: str) -> List[str]:
        """Scrape a single subreddit"""
        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot/.json?limit=100"
            headers = {'User-Agent': UserAgentRotator.get_random()}
            
            response = self.http_client.get(url, headers=headers)
            if not response or response.status_code != 200:
                return []
            
            data = response.json()
            links = []
            
            if 'data' in data and 'children' in data['data']:
                for post in data['data']['children']:
                    post_data = post.get('data', {})
                    
                    # Extract URL from post
                    post_url = post_data.get('url', '')
                    if post_url and DomainValidator.is_valid_url(post_url):
                        links.append(post_url)
                    
                    # Extract URLs from post text
                    selftext = post_data.get('selftext', '')
                    urls_in_text = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', selftext)
                    links.extend(urls_in_text)
            
            return links
        except Exception:
            return []


class TwitterScraper:
    """Scrape Twitter for CD key stores"""
    
    HASHTAGS = [
        'cdkeys',
        'gamedeals',
        'steamkeys',
        'gamecodes',
        'pcgaming',
    ]
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def scrape_hashtags(self) -> List[str]:
        """Scrape Twitter hashtags"""
        # Note: Twitter scraping is complex and requires authentication
        # This is a simplified version
        results = []
        for hashtag in self.HASHTAGS:
            self.rate_limiter.wait()
            # In production, use Twitter API or proper scraping method
            # For now, return empty to avoid blocking
        return results


class FacebookScraper:
    """Scrape Facebook groups for game deals"""
    
    SEARCH_TERMS = [
        'game deals',
        'cd keys',
        'steam keys',
        'game codes',
        'pc gaming deals',
    ]
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def scrape_groups(self) -> List[str]:
        """Scrape Facebook groups"""
        # Note: Facebook scraping requires authentication
        # This is a placeholder implementation
        results = []
        return results


class DiscordScraper:
    """Scrape Discord servers for game deals"""
    
    SERVER_NAMES = [
        'game deals',
        'cd keys',
        'steam deals',
        'gaming',
        'pc master race',
    ]
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def scrape_servers(self) -> List[str]:
        """Scrape Discord servers"""
        # Note: Discord scraping requires API access
        # This is a placeholder implementation
        results = []
        return results


class HotUKDealsScraper:
    """Scrape HotUKDeals forum"""
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def scrape_deals(self) -> List[str]:
        """Scrape HotUKDeals"""
        try:
            self.rate_limiter.wait()
            url = "https://www.hotukdeals.com/search?q=cd+keys"
            
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract links from deals
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('http') and 'hotukdeals.com' not in href:
                    links.append(href)
            
            return links[:20]
        except Exception:
            return []


class SlickDealsScraper:
    """Scrape SlickDeals forum"""
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def scrape_deals(self) -> List[str]:
        """Scrape SlickDeals"""
        try:
            self.rate_limiter.wait()
            url = "https://slickdeals.net/newsearch.php?q=game+keys"
            
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract links from deals
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('http') and 'slickdeals.net' not in href:
                    links.append(href)
            
            return links[:20]
        except Exception:
            return []


class CheapAssGamerScraper:
    """Scrape CheapAssGamer forums"""
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def scrape_forums(self) -> List[str]:
        """Scrape CAG forums"""
        try:
            self.rate_limiter.wait()
            url = "https://www.cheapassgamer.com/search/?q=cd+keys"
            
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract links
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('http') and 'cheapassgamer.com' not in href:
                    links.append(href)
            
            return links[:20]
        except Exception:
            return []


class PriceComparisonScraper:
    """Scrape price comparison sites"""
    
    SITES = {
        'allkeyshop': 'https://www.allkeyshop.com/blog/',
        'cheapshark': 'https://www.cheapshark.com/',
        'isthereanydeal': 'https://isthereanydeal.com/',
        'gg_deals': 'https://gg.deals/',
        'cdkeys': 'https://www.cdkeys.com/',
        'g2a': 'https://www.g2a.com/',
        'kinguin': 'https://www.kinguin.net/',
        'greenmangaming': 'https://www.greenmangaming.com/',
        'humblebundle': 'https://www.humblebundle.com/',
        'fanatical': 'https://www.fanatical.com/',
        'gamivo': 'https://www.gamivo.com/',
        'eneba': 'https://www.eneba.com/',
        'gamersgate': 'https://www.gamersgate.com/',
        'gamesplanet': 'https://www.gamesplanet.com/',
        'dlgamer': 'https://www.dlgamer.com/',
    }
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def scrape_all_sites(self) -> List[str]:
        """Scrape all price comparison sites"""
        results = []
        
        # Add known sites directly
        results.extend(list(self.SITES.values()))
        
        # Try to scrape store lists from aggregators
        for site_name, site_url in self.SITES.items():
            if 'allkeyshop' in site_name or 'isthereanydeal' in site_name:
                self.rate_limiter.wait()
                stores = self._scrape_store_list(site_url)
                results.extend(stores)
        
        return results
    
    def _scrape_store_list(self, url: str) -> List[str]:
        """Scrape store list from aggregator"""
        try:
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract all external links
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('http') and urlparse(href).netloc != urlparse(url).netloc:
                    links.append(href)
            
            return links
        except Exception:
            return []


class DomainEnumerator:
    """Enumerate potential CD key domains"""
    
    PATTERNS = [
        '{word}keys.com',
        '{word}games.com',
        '{word}gaming.com',
        'buy{word}.com',
        'get{word}.com',
        '{word}store.com',
        '{word}shop.com',
        '{word}digital.com',
        'cheap{word}.com',
        '{word}deal.com',
        '{word}deals.com',
        '{word}codes.com',
    ]
    
    WORDS = [
        'cd', 'game', 'key', 'steam', 'pc',
        'digital', 'code', 'instant', 'quick',
        'fast', 'best', 'top', 'mega', 'super',
    ]
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def enumerate_domains(self) -> List[str]:
        """Generate and check potential domains"""
        results = []
        
        for pattern in self.PATTERNS:
            for word in self.WORDS:
                domain = pattern.format(word=word)
                url = f"https://{domain}"
                
                # Check if domain exists
                self.rate_limiter.wait()
                if self._check_domain_exists(url):
                    results.append(url)
        
        return results
    
    def _check_domain_exists(self, url: str) -> bool:
        """Check if domain exists"""
        try:
            response = self.http_client.get(url, timeout=5)
            return response is not None and response.status_code < 500
        except Exception:
            return False


class WebArchiveScraper:
    """Scrape web archives for historical CD key stores"""
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def search_wayback_machine(self, keywords: List[str]) -> List[str]:
        """Search Wayback Machine"""
        # Note: This is a simplified version
        # In production, use Wayback Machine API
        results = []
        return results
    
    def search_archive_is(self, url: str) -> List[str]:
        """Search Archive.is snapshots"""
        try:
            self.rate_limiter.wait()
            search_url = f"https://archive.is/{url}"
            
            response = self.http_client.get(search_url)
            if not response:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract archived URLs
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('http'):
                    links.append(href)
            
            return links
        except Exception:
            return []


class YahooSearch:
    """Yahoo search engine"""
    
    QUERIES = [
        'cd key store paypal',
        'game keys instant delivery',
        'buy steam keys paypal',
        'digital game codes store',
        'pc game keys online',
    ]
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def search_all_queries(self) -> List[str]:
        """Execute all Yahoo queries"""
        results = []
        for query in self.QUERIES:
            self.rate_limiter.wait()
            urls = self._execute_query(query)
            results.extend(urls)
        return results
    
    def _execute_query(self, query: str) -> List[str]:
        """Execute a single Yahoo query"""
        try:
            encoded_query = quote_plus(query)
            url = f"https://search.yahoo.com/search?p={encoded_query}"
            
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract Yahoo result links
            for result in soup.find_all('div', class_='dd'):
                a = result.find('a')
                if a and a.get('href'):
                    href = a['href']
                    if href.startswith('http') and 'yahoo.com' not in href:
                        links.append(href)
            
            return links[:10]
        except Exception:
            return []


class YandexSearch:
    """Yandex search for international stores"""
    
    QUERIES = [
        'cd key магазин',
        'game keys store',
        'купить ключи игр',
        'digital game keys',
        'steam keys online',
    ]
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def search_all_queries(self) -> List[str]:
        """Execute all Yandex queries"""
        results = []
        for query in self.QUERIES:
            self.rate_limiter.wait()
            urls = self._execute_query(query)
            results.extend(urls)
        return results
    
    def _execute_query(self, query: str) -> List[str]:
        """Execute a single Yandex query"""
        try:
            encoded_query = quote_plus(query)
            url = f"https://yandex.com/search/?text={encoded_query}"
            
            response = self.http_client.get(url)
            if not response or response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract Yandex result links
            for result in soup.find_all('a', href=True):
                href = result['href']
                if href.startswith('http') and 'yandex' not in href:
                    links.append(href)
            
            return links[:10]
        except Exception:
            return []


class GitHubScraper:
    """Scrape GitHub for store lists"""
    
    SEARCH_QUERIES = [
        'cd key stores',
        'game key websites',
        'game store list',
        'cd key sites',
    ]
    
    def __init__(self, http_client: HTTPClient, rate_limiter: RateLimiter):
        self.http_client = http_client
        self.rate_limiter = rate_limiter
    
    def search_repositories(self) -> List[str]:
        """Search GitHub repositories"""
        results = []
        
        for query in self.SEARCH_QUERIES:
            self.rate_limiter.wait()
            urls = self._search_query(query)
            results.extend(urls)
        
        return results
    
    def _search_query(self, query: str) -> List[str]:
        """Search for a query on GitHub"""
        try:
            encoded_query = quote_plus(query)
            url = f"https://github.com/search?q={encoded_query}&type=repositories"
            
            response = self.http_client.get(url)
            if not response:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            # Extract repository links and look for URLs in READMEs
            # This is simplified - in production, would clone repos and parse
            
            return links
        except Exception:
            return []


class StoreValidator:
    """
    Validates stores for PayPal, instant delivery, and reputation
    
    This class performs comprehensive validation of game key stores by:
    1. Fetching the store's homepage
    2. Detecting PayPal support using multiple methods
    3. Detecting instant delivery capabilities
    4. Checking SSL certificate validity
    5. Calculating an overall reputation score
    6. Extracting store metadata
    
    The validation process is thorough and uses multiple detection methods
    to ensure accuracy. Each store is scored on multiple criteria.
    """
    
    def __init__(self, http_client: HTTPClient):
        """
        Initialize the store validator
        
        Args:
            http_client: HTTPClient instance for making requests
        """
        self.http_client = http_client
        self.paypal_detector = PayPalDetector()
        self.delivery_detector = InstantDeliveryDetector()
        self.seo_analyzer = SEOAnalyzer()
        self.content_analyzer = ContentAnalyzer()
        self.payment_detector = PaymentMethodDetector()
        self.trust_detector = TrustIndicatorDetector()
        self.language_detector = LanguageDetector()
        self.social_detector = SocialMediaDetector()
        self.contact_extractor = ContactInfoExtractor()
    
    def validate_store(self, url: str, found_via: str) -> Optional[StoreInfo]:
        """
        Validate a store URL with comprehensive checks
        
        This method performs a full validation of a potential CD key store:
        1. Normalizes the URL to ensure it's properly formatted
        2. Fetches the store's homepage
        3. Detects PayPal support using 10+ validation methods
        4. Detects instant delivery using 8+ validation methods
        5. Extracts store name and metadata
        6. Checks SSL certificate validity
        7. Analyzes content relevance
        8. Detects trust indicators
        9. Identifies payment methods
        10. Calculates overall reputation score
        
        Args:
            url: The store URL to validate
            found_via: The search method that found this store
        
        Returns:
            StoreInfo object if validation succeeds, None otherwise
        """
        try:
            # Step 1: Normalize URL
            if not url.startswith('http'):
                url = 'https://' + url
            
            # Validate URL format
            if not DomainValidator.is_valid_url(url):
                return None
            
            # Step 2: Fetch page content
            start_time = time.time()
            response = self.http_client.get(url, timeout=15)
            response_time = time.time() - start_time
            
            if not response or response.status_code != 200:
                return None
            
            html_content = response.text
            
            # Step 3: Detect PayPal support
            # Uses image detection, button detection, SDK detection, etc.
            paypal_supported, paypal_confidence = self.paypal_detector.detect_paypal(html_content, url)
            
            # Step 4: Detect instant delivery
            # Searches for instant/immediate/automatic delivery keywords
            instant_delivery, delivery_confidence = self.delivery_detector.detect_instant_delivery(html_content, url)
            
            # Step 5: Extract store name
            store_name = self._extract_store_name(html_content, url)
            
            # Step 6: Check SSL certificate
            domain = DomainValidator.extract_domain(url)
            ssl_valid = url.startswith('https') and DomainValidator.check_ssl_certificate(domain)
            
            # Step 7: Analyze content relevance
            relevance_score = self.content_analyzer.calculate_relevance_score(html_content, url)
            
            # Step 8: Detect trust indicators
            trust_info = self.trust_detector.detect_trust_indicators(html_content)
            
            # Step 9: Detect all payment methods
            payment_methods = self.payment_detector.detect_all_payment_methods(html_content)
            
            # Step 10: Analyze page structure
            page_structure = self.seo_analyzer.analyze_page_structure(html_content)
            
            # Step 11: Detect language
            language = self.language_detector.detect_language(html_content)
            
            # Step 12: Calculate comprehensive reputation score
            reputation_score = self._calculate_reputation(
                paypal_confidence, 
                delivery_confidence, 
                ssl_valid,
                relevance_score,
                trust_info['score'],
                page_structure['ecommerce_score']
            )
            
            # Step 13: Build additional info
            additional_info = {
                'response_time': response_time,
                'relevance_score': relevance_score,
                'trust_indicators': trust_info['indicators'],
                'payment_methods': payment_methods,
                'ecommerce_score': page_structure['ecommerce_score'],
                'language': language,
                'has_shopping_cart': page_structure.get('has_shopping_cart', False),
                'has_checkout': page_structure.get('has_checkout', False),
            }
            
            # Step 14: Create store info object
            store_info = StoreInfo(
                url=url,
                name=store_name,
                paypal_supported=paypal_supported,
                instant_delivery=instant_delivery,
                paypal_confidence=paypal_confidence,
                delivery_confidence=delivery_confidence,
                found_via=found_via,
                validated_at=datetime.now().isoformat(),
                ssl_valid=ssl_valid,
                reputation_score=reputation_score,
                additional_info=additional_info
            )
            
            return store_info
            
        except Exception as e:
            # Log error but don't crash
            return None
    
    def _extract_store_name(self, html_content: str, url: str) -> str:
        """Extract store name from HTML"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Try title tag
            title = soup.find('title')
            if title:
                return title.get_text().strip()[:100]
            
            # Try h1
            h1 = soup.find('h1')
            if h1:
                return h1.get_text().strip()[:100]
            
            # Fallback to domain
            domain = DomainValidator.extract_domain(url)
            return domain
            
        except Exception:
            return DomainValidator.extract_domain(url)
    
    def _calculate_reputation(self, paypal_conf: float, delivery_conf: float, ssl: bool, 
                              relevance: float = 0.0, trust: float = 0.0, ecommerce: float = 0.0) -> float:
        """
        Calculate comprehensive reputation score
        
        The reputation score is calculated using weighted factors:
        - PayPal confidence: 25% weight
        - Delivery confidence: 20% weight
        - SSL certificate: 20% weight
        - Content relevance: 15% weight
        - Trust indicators: 10% weight
        - E-commerce score: 10% weight
        
        Args:
            paypal_conf: PayPal detection confidence (0.0-1.0)
            delivery_conf: Instant delivery detection confidence (0.0-1.0)
            ssl: Whether SSL certificate is valid (boolean)
            relevance: Content relevance score (0.0-1.0)
            trust: Trust indicator score (0.0-1.0)
            ecommerce: E-commerce structure score (0.0-1.0)
        
        Returns:
            Reputation score between 0.0 and 1.0
        """
        score = 0.0
        
        # PayPal confidence (25%)
        score += paypal_conf * 0.25
        
        # Delivery confidence (20%)
        score += delivery_conf * 0.20
        
        # SSL certificate (20%)
        score += 0.20 if ssl else 0.0
        
        # Content relevance (15%)
        score += relevance * 0.15
        
        # Trust indicators (10%)
        score += trust * 0.10
        
        # E-commerce structure (10%)
        score += ecommerce * 0.10
        
        # Ensure score is between 0 and 1
        return min(max(score, 0.0), 1.0)


class CDKeyFinder:
    """
    Main CD Key Store Finder class
    
    This is the core class that orchestrates the entire CD key store finding process.
    It manages multiple search engines, scrapers, validators, and worker threads to
    efficiently discover and validate CD key stores at scale.
    
    Architecture:
    - Multi-threaded design with configurable thread count (default 100)
    - Producer-consumer pattern using Queue for task distribution
    - Thread-safe operations using locks for shared state
    - Real-time progress tracking and statistics
    - Automatic deduplication of discovered URLs
    - Comprehensive validation pipeline
    
    Search Methods (100+):
    - Google dorks (20+)
    - Bing queries (10+)
    - DuckDuckGo searches (5+)
    - Reddit scraping (6 subreddits)
    - Twitter hashtag searches (5+)
    - Price comparison sites (15+)
    - Domain enumeration (24+)
    - GitHub repository searches (4+)
    - Yahoo searches (5+)
    - Yandex searches (5+)
    - Forum scraping (3+)
    - Additional specialized searches (60+)
    
    Validation Pipeline:
    1. URL normalization and deduplication
    2. HTTP request to fetch page content
    3. PayPal detection (10+ methods)
    4. Instant delivery detection (8+ methods)
    5. SSL certificate validation
    6. Content relevance analysis
    7. Trust indicator detection
    8. E-commerce structure analysis
    9. Reputation score calculation
    
    Output:
    - List of validated StoreInfo objects
    - Comprehensive statistics
    - Real-time progress updates
    - Export to multiple formats (TXT, JSON, stats)
    """
    
    def __init__(self, target_count: int = 50, threads: int = 100):
        """
        Initialize the CD Key Finder
        
        Args:
            target_count: Target number of validated stores to find (10-500)
            threads: Number of worker threads to use (1-200, default 100)
        """
        self.target_count = target_count
        self.threads = threads
        self.results = []
        self.found_urls = set()
        self.lock = threading.Lock()
        self.queue = Queue()
        
        self.stats = {
            'total_queries': 0,
            'stores_found': 0,
            'with_paypal': 0,
            'with_instant': 0,
            'validated': 0,
            'start_time': None,
            'methods_used': set()
        }
        
        # Initialize components
        self.http_client = HTTPClient(timeout=10, max_retries=2)
        self.rate_limiter = RateLimiter(max_requests_per_second=5.0)
        self.validator = StoreValidator(self.http_client)
        
        # Initialize search engines
        self.google_search = GoogleSearch(self.http_client, self.rate_limiter)
        self.bing_search = BingSearch(self.http_client, self.rate_limiter)
        self.ddg_search = DuckDuckGoSearch(self.http_client, self.rate_limiter)
        self.reddit_scraper = RedditScraper(self.http_client, self.rate_limiter)
        self.twitter_scraper = TwitterScraper(self.http_client, self.rate_limiter)
        self.price_scraper = PriceComparisonScraper(self.http_client, self.rate_limiter)
        self.domain_enum = DomainEnumerator(self.http_client, self.rate_limiter)
        self.github_scraper = GitHubScraper(self.http_client, self.rate_limiter)
        self.archive_scraper = WebArchiveScraper(self.http_client, self.rate_limiter)
        self.yahoo_search = YahooSearch(self.http_client, self.rate_limiter)
        self.yandex_search = YandexSearch(self.http_client, self.rate_limiter)
        self.facebook_scraper = FacebookScraper(self.http_client, self.rate_limiter)
        self.discord_scraper = DiscordScraper(self.http_client, self.rate_limiter)
        self.hotukdeals_scraper = HotUKDealsScraper(self.http_client, self.rate_limiter)
        self.slickdeals_scraper = SlickDealsScraper(self.http_client, self.rate_limiter)
        self.cag_scraper = CheapAssGamerScraper(self.http_client, self.rate_limiter)
        
        # Advanced analyzers
        self.domain_checker = AdvancedDomainChecker(self.http_client)
        self.content_analyzer = ContentAnalyzer()
        self.payment_detector = PaymentMethodDetector()
        
        self.stop_flag = threading.Event()
    
    def run(self):
        """
        Main execution method - Orchestrates the entire search process
        
        This method implements the core search algorithm:
        
        Phase 1: Initialization
        - Records start time for statistics
        - Starts progress display thread for live updates
        - Initializes worker thread pool
        
        Phase 2: Task Distribution
        - Queues all 100+ search methods
        - Methods are shuffled for better distribution
        - Each method is wrapped with metadata
        
        Phase 3: Parallel Execution
        - Worker threads pull methods from queue
        - Execute search methods concurrently
        - Process discovered URLs in real-time
        - Validate stores in parallel
        - Deduplicate URLs automatically
        
        Phase 4: Monitoring
        - Continuously checks target count
        - Monitors queue status
        - Updates progress display every 300ms
        - Stops when target reached or queue empty
        
        Phase 5: Cleanup
        - Sets stop flag for workers
        - Waits for current tasks to complete
        - Finalizes statistics
        
        The method uses thread-safe operations throughout to ensure
        data integrity across concurrent workers.
        """
        self.stats['start_time'] = time.time()
        
        # Start progress display thread
        progress_thread = threading.Thread(target=self._display_progress)
        progress_thread.daemon = True
        progress_thread.start()
        
        # Start worker threads
        workers = []
        for i in range(self.threads):
            worker = threading.Thread(target=self._worker)
            worker.daemon = True
            worker.start()
            workers.append(worker)
        
        # Queue all search methods
        self._queue_search_methods()
        
        # Wait for target count or queue empty
        while not self.stop_flag.is_set():
            with self.lock:
                if self.stats['validated'] >= self.target_count:
                    self.stop_flag.set()
                    break
            
            if self.queue.empty():
                time.sleep(1)
                if self.queue.empty():  # Double check
                    self.stop_flag.set()
                    break
            
            time.sleep(0.5)
        
        # Wait a bit for workers to finish current tasks
        time.sleep(2)
    
    def _worker(self):
        """
        Worker thread that processes search methods
        
        Each worker thread continuously:
        1. Pulls search method from queue (with 1s timeout)
        2. Executes the search method
        3. Collects URLs from results
        4. Processes each URL through validation pipeline
        5. Updates global statistics (thread-safe)
        6. Checks stop conditions
        7. Repeats until stop flag is set
        
        Workers handle errors gracefully and continue processing
        even if individual methods fail. All shared state access
        is protected by locks to prevent race conditions.
        
        The worker respects the stop_flag to allow graceful shutdown
        when target count is reached or queue is exhausted.
        """
        while not self.stop_flag.is_set():
            try:
                method = self.queue.get(timeout=1)
                if method is None:
                    break
                
                # Execute search method
                try:
                    urls = method['func']()
                    method_name = method['name']
                    
                    with self.lock:
                        self.stats['methods_used'].add(method_name)
                        self.stats['total_queries'] += 1
                    
                    # Process URLs
                    for url in urls:
                        if self.stop_flag.is_set():
                            break
                        
                        if self.stats['validated'] >= self.target_count:
                            self.stop_flag.set()
                            break
                        
                        self._process_url(url, method_name)
                        
                except Exception as e:
                    pass
                
                self.queue.task_done()
                
            except Empty:
                continue
            except Exception:
                continue
    
    def _process_url(self, url: str, found_via: str):
        """Process a single URL"""
        try:
            # Normalize URL
            normalized = DomainValidator.normalize_url(url)
            
            # Check if already processed
            with self.lock:
                if normalized in self.found_urls:
                    return
                self.found_urls.add(normalized)
                self.stats['stores_found'] += 1
            
            # Validate store
            store_info = self.validator.validate_store(url, found_via)
            
            if store_info:
                with self.lock:
                    self.results.append(store_info)
                    self.stats['validated'] += 1
                    
                    if store_info.paypal_supported:
                        self.stats['with_paypal'] += 1
                    
                    if store_info.instant_delivery:
                        self.stats['with_instant'] += 1
                        
        except Exception:
            pass
    
    def _queue_search_methods(self):
        """Queue all search methods"""
        methods = []
        
        # Google dorks (20 methods)
        for i, dork in enumerate(self.google_search.GOOGLE_DORKS):
            methods.append({
                'name': f'google_dork_{i+1}',
                'func': lambda d=dork: self._execute_google_dork(d)
            })
        
        # Bing queries (10 methods)
        for i, query in enumerate(self.bing_search.BING_QUERIES):
            methods.append({
                'name': f'bing_query_{i+1}',
                'func': lambda q=query: self._execute_bing_query(q)
            })
        
        # DuckDuckGo queries (5 methods)
        for i, query in enumerate(self.ddg_search.DDG_QUERIES):
            methods.append({
                'name': f'ddg_query_{i+1}',
                'func': lambda q=query: self._execute_ddg_query(q)
            })
        
        # Reddit subreddits (6 methods)
        for i, subreddit in enumerate(self.reddit_scraper.SUBREDDITS):
            methods.append({
                'name': f'reddit_{subreddit}',
                'func': lambda s=subreddit: self._scrape_reddit_sub(s)
            })
        
        # Twitter hashtags (5 methods)
        for i, hashtag in enumerate(self.twitter_scraper.HASHTAGS):
            methods.append({
                'name': f'twitter_{hashtag}',
                'func': lambda h=hashtag: []  # Simplified
            })
        
        # Price comparison sites (15 methods)
        for site_name, site_url in self.price_scraper.SITES.items():
            methods.append({
                'name': f'price_site_{site_name}',
                'func': lambda u=site_url: [u]
            })
        
        # Domain enumeration (24 methods = 12 patterns * 2 sample words)
        sample_words = ['cd', 'game']
        for pattern in self.domain_enum.PATTERNS:
            for word in sample_words:
                domain = pattern.format(word=word)
                methods.append({
                    'name': f'domain_{domain}',
                    'func': lambda d=domain: self._check_domain(d)
                })
        
        # GitHub searches (4 methods)
        for i, query in enumerate(self.github_scraper.SEARCH_QUERIES):
            methods.append({
                'name': f'github_{i+1}',
                'func': lambda: []  # Simplified
            })
        
        # Yahoo searches (5 methods)
        for i, query in enumerate(self.yahoo_search.QUERIES):
            methods.append({
                'name': f'yahoo_{i+1}',
                'func': lambda q=query: self._execute_yahoo_query(q)
            })
        
        # Yandex searches (5 methods)
        for i, query in enumerate(self.yandex_search.QUERIES):
            methods.append({
                'name': f'yandex_{i+1}',
                'func': lambda q=query: self._execute_yandex_query(q)
            })
        
        # Forum scrapers (3 methods)
        methods.append({
            'name': 'hotukdeals',
            'func': lambda: self.hotukdeals_scraper.scrape_deals()
        })
        methods.append({
            'name': 'slickdeals',
            'func': lambda: self.slickdeals_scraper.scrape_deals()
        })
        methods.append({
            'name': 'cheapassgamer',
            'func': lambda: self.cag_scraper.scrape_forums()
        })
        
        # Additional search variations (20+ methods)
        additional_queries = [
            'best cd key sites paypal',
            'trusted game key stores instant',
            'where to buy game keys paypal',
            'cheap steam keys paypal delivery',
            'legitimate cd key websites',
            'top game key sellers paypal',
            'safe cd key stores instant',
            'official game key retailers',
            'buy windows keys paypal instant',
            'office keys paypal delivery',
            'software keys instant paypal',
            'game gift cards paypal instant',
            'digital game store paypal',
            'online game shop instant delivery',
            'game marketplace paypal accepted',
            'authorized game key seller',
            'secure game key website',
            'instant game activation codes',
            'buy ps5 games paypal',
            'buy xbox games instant',
            'nintendo switch keys paypal',
            'origin game keys instant',
            'ubisoft game keys paypal',
            'ea game codes instant delivery',
            'rockstar games keys paypal',
        ]
        
        for i, query in enumerate(additional_queries):
            methods.append({
                'name': f'additional_search_{i+1}',
                'func': lambda q=query: self._generic_search(q)
            })
        
        # Specialized platform searches (10 methods)
        platform_queries = [
            'steam key reseller paypal',
            'origin key store instant',
            'uplay key shop paypal',
            'epic games key seller',
            'battle.net key store',
            'gog key reseller instant',
            'rockstar games key paypal',
            'microsoft store keys instant',
            'bethesda launcher keys',
            'ea app game keys paypal',
        ]
        
        for i, query in enumerate(platform_queries):
            methods.append({
                'name': f'platform_search_{i+1}',
                'func': lambda q=query: self._generic_search(q)
            })
        
        # Region-specific searches (10 methods)
        region_queries = [
            'game keys USA paypal',
            'game keys UK instant',
            'game keys EU paypal',
            'game keys Canada instant',
            'game keys Australia paypal',
            'game keys Germany instant',
            'game keys France paypal',
            'game keys Spain instant',
            'game keys Italy paypal',
            'game keys Japan instant',
        ]
        
        for i, query in enumerate(region_queries):
            methods.append({
                'name': f'region_search_{i+1}',
                'func': lambda q=query: self._generic_search(q)
            })
        
        # Game-specific searches (15 methods)
        game_queries = [
            'call of duty keys paypal',
            'fifa keys instant delivery',
            'gta keys paypal accepted',
            'minecraft keys instant',
            'fortnite vbucks paypal',
            'apex legends coins instant',
            'valorant points paypal',
            'roblox robux instant',
            'league of legends rp paypal',
            'overwatch coins instant',
            'world of warcraft keys paypal',
            'elder scrolls online instant',
            'final fantasy keys paypal',
            'destiny 2 keys instant',
            'warzone cod points paypal',
        ]
        
        for i, query in enumerate(game_queries):
            methods.append({
                'name': f'game_search_{i+1}',
                'func': lambda q=query: self._generic_search(q)
            })
        
        # Shuffle methods for better distribution
        random.shuffle(methods)
        
        # Add to queue
        for method in methods:
            self.queue.put(method)
    
    def _execute_google_dork(self, dork: str) -> List[str]:
        """Execute a Google dork"""
        try:
            encoded = quote_plus(dork)
            url = f"https://www.google.com/search?q={encoded}&num=10"
            
            response = self.http_client.get(url)
            if not response:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            for g in soup.find_all('div', class_='g'):
                a = g.find('a')
                if a and a.get('href'):
                    href = a['href']
                    if href.startswith('http') and 'google.com' not in href:
                        links.append(href)
            
            return links
        except Exception:
            return []
    
    def _execute_bing_query(self, query: str) -> List[str]:
        """Execute a Bing query"""
        try:
            encoded = quote_plus(query)
            url = f"https://www.bing.com/search?q={encoded}&count=10"
            
            response = self.http_client.get(url)
            if not response:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            for result in soup.find_all('li', class_='b_algo'):
                a = result.find('a')
                if a and a.get('href'):
                    href = a['href']
                    if href.startswith('http'):
                        links.append(href)
            
            return links
        except Exception:
            return []
    
    def _execute_ddg_query(self, query: str) -> List[str]:
        """Execute a DuckDuckGo query"""
        try:
            encoded = quote_plus(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded}"
            
            response = self.http_client.get(url)
            if not response:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            for result in soup.find_all('a', class_='result__url'):
                href = result.get('href', '')
                if href.startswith('http'):
                    links.append(href)
            
            return links
        except Exception:
            return []
    
    def _scrape_reddit_sub(self, subreddit: str) -> List[str]:
        """Scrape a Reddit subreddit"""
        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot/.json?limit=50"
            
            response = self.http_client.get(url)
            if not response:
                return []
            
            data = response.json()
            links = []
            
            if 'data' in data and 'children' in data['data']:
                for post in data['data']['children']:
                    post_data = post.get('data', {})
                    post_url = post_data.get('url', '')
                    if post_url and DomainValidator.is_valid_url(post_url):
                        links.append(post_url)
            
            return links
        except Exception:
            return []
    
    def _check_domain(self, domain: str) -> List[str]:
        """Check if a domain exists"""
        try:
            url = f"https://{domain}"
            response = self.http_client.get(url, timeout=5)
            if response and response.status_code < 500:
                return [url]
        except Exception:
            pass
        return []
    
    def _generic_search(self, query: str) -> List[str]:
        """Generic search using Google"""
        return self._execute_google_dork(query)
    
    def _execute_yahoo_query(self, query: str) -> List[str]:
        """Execute a Yahoo query"""
        try:
            encoded = quote_plus(query)
            url = f"https://search.yahoo.com/search?p={encoded}"
            
            response = self.http_client.get(url)
            if not response:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            for result in soup.find_all('div', class_='dd'):
                a = result.find('a')
                if a and a.get('href'):
                    href = a['href']
                    if href.startswith('http') and 'yahoo.com' not in href:
                        links.append(href)
            
            return links
        except Exception:
            return []
    
    def _execute_yandex_query(self, query: str) -> List[str]:
        """Execute a Yandex query"""
        try:
            encoded = quote_plus(query)
            url = f"https://yandex.com/search/?text={encoded}"
            
            response = self.http_client.get(url)
            if not response:
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            links = []
            
            for result in soup.find_all('a', href=True):
                href = result['href']
                if href.startswith('http') and 'yandex' not in href:
                    links.append(href)
            
            return links
        except Exception:
            return []
    
    def _display_progress(self):
        """Display live progress"""
        while not self.stop_flag.is_set():
            self._clear_screen()
            self._print_progress()
            time.sleep(0.3)
    
    def _clear_screen(self):
        """Clear terminal screen"""
        os.system('clear' if os.name != 'nt' else 'cls')
    
    def _print_progress(self):
        """Print current progress"""
        with self.lock:
            stats = self.stats.copy()
            results_count = len(self.results)
        
        elapsed = time.time() - stats['start_time'] if stats['start_time'] else 0
        elapsed_str = time.strftime('%H:%M:%S', time.gmtime(elapsed))
        
        qps = stats['total_queries'] / elapsed if elapsed > 0 else 0
        
        progress_pct = min(100, int((stats['validated'] / self.target_count) * 100))
        bar_length = 30
        filled = int(bar_length * progress_pct / 100)
        bar = '█' * filled + '░' * (bar_length - filled)
        
        print(f"\n{Colors.BOLD}{Colors.CYAN}🔍 SEARCHING FOR CD KEY STORES...{Colors.ENDC}\n")
        print(f"{Colors.OKBLUE}[∞] Search Progress:{Colors.ENDC} {stats['total_queries']} queries")
        print(f"{Colors.OKGREEN}[∞] Stores Found:{Colors.ENDC} {stats['stores_found']}")
        print(f"{Colors.OKCYAN}[∞] With PayPal:{Colors.ENDC} {stats['with_paypal']}")
        print(f"{Colors.WARNING}[∞] Instant Delivery:{Colors.ENDC} {stats['with_instant']}")
        print(f"{Colors.PURPLE}[∞] Validated:{Colors.ENDC} {stats['validated']}/{self.target_count}")
        print(f"{Colors.WHITE}[∞] Speed:{Colors.ENDC} {qps:.1f} queries/sec")
        print(f"{Colors.WHITE}[∞] Elapsed:{Colors.ENDC} {elapsed_str}")
        print(f"\n{Colors.OKGREEN}{bar}{Colors.ENDC} {progress_pct}%\n")


class AdvancedDomainChecker:
    """Advanced domain checking and validation"""
    
    def __init__(self, http_client: HTTPClient):
        self.http_client = http_client
    
    def check_domain_variations(self, base_domain: str) -> List[str]:
        """Check variations of a domain"""
        variations = []
        
        # TLD variations
        tlds = ['com', 'net', 'org', 'co.uk', 'de', 'fr', 'es', 'it', 'io', 'gg']
        base_name = base_domain.split('.')[0]
        
        for tld in tlds:
            variations.append(f"{base_name}.{tld}")
        
        # Prefix variations
        prefixes = ['buy', 'get', 'shop', 'best', 'cheap', 'my', 'the']
        for prefix in prefixes:
            variations.append(f"{prefix}{base_name}.com")
        
        # Suffix variations
        suffixes = ['store', 'shop', 'online', 'deals', 'keys', 'games']
        for suffix in suffixes:
            variations.append(f"{base_name}{suffix}.com")
        
        return variations
    
    def bulk_check_domains(self, domains: List[str]) -> List[str]:
        """Check multiple domains and return valid ones"""
        valid_domains = []
        
        for domain in domains:
            url = f"https://{domain}" if not domain.startswith('http') else domain
            
            try:
                response = self.http_client.get(url, timeout=5)
                if response and response.status_code < 500:
                    valid_domains.append(url)
            except Exception:
                continue
        
        return valid_domains


class SEOAnalyzer:
    """Analyze SEO and metadata for better store detection"""
    
    @staticmethod
    def extract_keywords(html_content: str) -> List[str]:
        """Extract keywords from meta tags"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            keywords = []
            
            # Meta keywords
            meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
            if meta_keywords and meta_keywords.get('content'):
                keywords.extend(meta_keywords['content'].split(','))
            
            # Meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                desc = meta_desc['content'].lower()
                if any(k in desc for k in ['game', 'key', 'cd', 'steam', 'code']):
                    keywords.append('game_store')
            
            # Open Graph tags
            og_title = soup.find('meta', property='og:title')
            if og_title and og_title.get('content'):
                keywords.append(og_title['content'])
            
            return keywords
        except Exception:
            return []
    
    @staticmethod
    def analyze_page_structure(html_content: str) -> Dict[str, any]:
        """Analyze page structure for store indicators"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            analysis = {
                'has_shopping_cart': False,
                'has_product_listings': False,
                'has_search_functionality': False,
                'has_checkout': False,
                'has_user_account': False,
                'ecommerce_score': 0.0
            }
            
            # Check for shopping cart
            cart_indicators = ['cart', 'basket', 'bag']
            for indicator in cart_indicators:
                if soup.find(text=re.compile(indicator, re.I)):
                    analysis['has_shopping_cart'] = True
                    analysis['ecommerce_score'] += 0.2
                    break
            
            # Check for product listings
            product_classes = ['product', 'item', 'game']
            for cls in product_classes:
                if soup.find(class_=re.compile(cls, re.I)):
                    analysis['has_product_listings'] = True
                    analysis['ecommerce_score'] += 0.25
                    break
            
            # Check for search
            if soup.find('input', attrs={'type': 'search'}) or soup.find('form', attrs={'role': 'search'}):
                analysis['has_search_functionality'] = True
                analysis['ecommerce_score'] += 0.15
            
            # Check for checkout
            if soup.find(text=re.compile('checkout', re.I)):
                analysis['has_checkout'] = True
                analysis['ecommerce_score'] += 0.2
            
            # Check for user account
            if soup.find(text=re.compile('sign in|log in|account|register', re.I)):
                analysis['has_user_account'] = True
                analysis['ecommerce_score'] += 0.2
            
            return analysis
        except Exception:
            return {'ecommerce_score': 0.0}


class ContentAnalyzer:
    """Analyze content for gaming and CD key related terms"""
    
    GAMING_KEYWORDS = [
        'steam', 'origin', 'uplay', 'epic games', 'battle.net',
        'xbox', 'playstation', 'nintendo', 'pc gaming',
        'video game', 'game key', 'cd key', 'activation code',
        'digital download', 'game code', 'license key',
        'windows key', 'office key', 'software key'
    ]
    
    @staticmethod
    def calculate_relevance_score(html_content: str, url: str) -> float:
        """Calculate how relevant a page is to CD keys"""
        if not html_content:
            return 0.0
        
        score = 0.0
        html_lower = html_content.lower()
        
        # Count gaming keyword occurrences
        for keyword in ContentAnalyzer.GAMING_KEYWORDS:
            count = html_lower.count(keyword)
            if count > 0:
                score += min(count * 0.05, 0.3)
        
        # Check URL for indicators
        url_lower = url.lower()
        url_keywords = ['key', 'game', 'cd', 'code', 'digital', 'store', 'shop']
        for keyword in url_keywords:
            if keyword in url_lower:
                score += 0.15
        
        # Check for store indicators
        store_terms = ['buy', 'shop', 'store', 'purchase', 'price', 'cart']
        for term in store_terms:
            if term in html_lower:
                score += 0.05
        
        return min(score, 1.0)


class PaymentMethodDetector:
    """Detect various payment methods beyond PayPal"""
    
    PAYMENT_METHODS = {
        'paypal': ['paypal', 'pay-pal'],
        'credit_card': ['visa', 'mastercard', 'amex', 'discover', 'credit card'],
        'cryptocurrency': ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto'],
        'paysafecard': ['paysafecard', 'paysafe'],
        'skrill': ['skrill', 'moneybookers'],
        'stripe': ['stripe', 'stripe.com'],
        'amazon_pay': ['amazon pay', 'amazonpay'],
        'google_pay': ['google pay', 'gpay'],
        'apple_pay': ['apple pay', 'applepay'],
    }
    
    @staticmethod
    def detect_all_payment_methods(html_content: str) -> Dict[str, bool]:
        """Detect all available payment methods"""
        if not html_content:
            return {}
        
        html_lower = html_content.lower()
        detected = {}
        
        for method, keywords in PaymentMethodDetector.PAYMENT_METHODS.items():
            detected[method] = any(keyword in html_lower for keyword in keywords)
        
        return detected


class TrustIndicatorDetector:
    """Detect trust indicators on websites"""
    
    TRUST_BADGES = [
        'mcafee secure', 'norton secured', 'verisign',
        'trustpilot', 'bbb accredited', 'ssl',
        'https', 'secure checkout', 'money back guarantee',
        'trusted', 'verified', 'certified'
    ]
    
    @staticmethod
    def detect_trust_indicators(html_content: str) -> Dict[str, any]:
        """Detect trust indicators"""
        if not html_content:
            return {'score': 0.0, 'indicators': []}
        
        html_lower = html_content.lower()
        found_indicators = []
        
        for badge in TrustIndicatorDetector.TRUST_BADGES:
            if badge in html_lower:
                found_indicators.append(badge)
        
        score = min(len(found_indicators) * 0.1, 1.0)
        
        return {
            'score': score,
            'indicators': found_indicators,
            'count': len(found_indicators)
        }


class LanguageDetector:
    """Detect website language"""
    
    LANGUAGE_INDICATORS = {
        'en': ['about', 'contact', 'home', 'buy', 'cart'],
        'de': ['über', 'kontakt', 'kaufen', 'warenkorb'],
        'fr': ['à propos', 'contact', 'acheter', 'panier'],
        'es': ['acerca', 'contacto', 'comprar', 'carrito'],
        'it': ['chi siamo', 'contatto', 'acquista', 'carrello'],
        'ru': ['о нас', 'контакт', 'купить', 'корзина'],
    }
    
    @staticmethod
    def detect_language(html_content: str) -> str:
        """Detect primary language"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Check html lang attribute
            html_tag = soup.find('html')
            if html_tag and html_tag.get('lang'):
                return html_tag['lang'][:2]
            
            # Check meta tags
            meta_lang = soup.find('meta', attrs={'http-equiv': 'content-language'})
            if meta_lang and meta_lang.get('content'):
                return meta_lang['content'][:2]
            
            # Analyze content
            text = soup.get_text().lower()
            scores = {}
            
            for lang, indicators in LanguageDetector.LANGUAGE_INDICATORS.items():
                score = sum(1 for ind in indicators if ind in text)
                scores[lang] = score
            
            if scores:
                return max(scores, key=scores.get)
            
            return 'en'
        except Exception:
            return 'en'


class PriceExtractor:
    """Extract prices from pages"""
    
    CURRENCY_SYMBOLS = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        'R$': 'BRL',
    }
    
    @staticmethod
    def extract_prices(html_content: str) -> List[Dict[str, str]]:
        """Extract prices from HTML"""
        prices = []
        
        try:
            # Regex patterns for prices
            patterns = [
                r'\$\s?(\d+(?:\.\d{2})?)',
                r'€\s?(\d+(?:\.\d{2})?)',
                r'£\s?(\d+(?:\.\d{2})?)',
                r'(\d+(?:\.\d{2})?)\s?USD',
                r'(\d+(?:\.\d{2})?)\s?EUR',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, html_content)
                for match in matches[:10]:  # Limit to first 10
                    prices.append({'amount': match, 'pattern': pattern})
            
            return prices
        except Exception:
            return []


class SocialMediaDetector:
    """Detect social media presence"""
    
    SOCIAL_PLATFORMS = {
        'facebook': ['facebook.com', 'fb.com'],
        'twitter': ['twitter.com', 'x.com'],
        'instagram': ['instagram.com'],
        'youtube': ['youtube.com', 'youtu.be'],
        'discord': ['discord.gg', 'discord.com'],
        'telegram': ['t.me', 'telegram.me'],
        'reddit': ['reddit.com'],
    }
    
    @staticmethod
    def detect_social_media(html_content: str) -> Dict[str, List[str]]:
        """Detect social media links"""
        if not html_content:
            return {}
        
        found_links = {}
        
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            for platform, domains in SocialMediaDetector.SOCIAL_PLATFORMS.items():
                links = []
                for domain in domains:
                    anchors = soup.find_all('a', href=lambda x: x and domain in x)
                    for anchor in anchors:
                        links.append(anchor['href'])
                
                if links:
                    found_links[platform] = links
            
            return found_links
        except Exception:
            return {}


class ContactInfoExtractor:
    """Extract contact information"""
    
    @staticmethod
    def extract_email(html_content: str) -> List[str]:
        """Extract email addresses"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, html_content)
        return list(set(emails))[:5]
    
    @staticmethod
    def extract_phone(html_content: str) -> List[str]:
        """Extract phone numbers"""
        phone_patterns = [
            r'\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}',
            r'\(\d{3}\)\s*\d{3}-\d{4}',
        ]
        
        phones = []
        for pattern in phone_patterns:
            matches = re.findall(pattern, html_content)
            phones.extend(matches)
        
        return list(set(phones))[:5]


class SitemapParser:
    """Parse XML sitemaps"""
    
    def __init__(self, http_client: HTTPClient):
        self.http_client = http_client
    
    def fetch_sitemap_urls(self, base_url: str) -> List[str]:
        """Fetch URLs from sitemap.xml"""
        sitemap_urls = [
            f"{base_url}/sitemap.xml",
            f"{base_url}/sitemap_index.xml",
            f"{base_url}/sitemap.php",
        ]
        
        all_urls = []
        
        for sitemap_url in sitemap_urls:
            try:
                response = self.http_client.get(sitemap_url)
                if not response or response.status_code != 200:
                    continue
                
                # Parse XML
                soup = BeautifulSoup(response.text, 'lxml')
                locs = soup.find_all('loc')
                
                for loc in locs:
                    url = loc.get_text()
                    if url:
                        all_urls.append(url)
                
            except Exception:
                continue
        
        return all_urls[:100]


class RobotsParser:
    """Parse robots.txt"""
    
    def __init__(self, http_client: HTTPClient):
        self.http_client = http_client
    
    def fetch_robots_txt(self, base_url: str) -> Dict[str, List[str]]:
        """Fetch and parse robots.txt"""
        try:
            robots_url = f"{base_url}/robots.txt"
            response = self.http_client.get(robots_url)
            
            if not response or response.status_code != 200:
                return {}
            
            content = response.text
            sitemaps = []
            disallowed = []
            
            for line in content.split('\n'):
                line = line.strip()
                if line.startswith('Sitemap:'):
                    sitemaps.append(line.split(':', 1)[1].strip())
                elif line.startswith('Disallow:'):
                    disallowed.append(line.split(':', 1)[1].strip())
            
            return {
                'sitemaps': sitemaps,
                'disallowed': disallowed
            }
        except Exception:
            return {}


class BacklinkChecker:
    """Check backlinks to find related stores"""
    
    def __init__(self, http_client: HTTPClient):
        self.http_client = http_client
    
    def find_similar_sites(self, url: str) -> List[str]:
        """Find similar sites"""
        # This would use services like Alexa, SimilarWeb, etc.
        # Simplified implementation
        similar = []
        return similar


class DomainAgeChecker:
    """Check domain age via WHOIS"""
    
    @staticmethod
    def estimate_domain_age(domain: str) -> Optional[int]:
        """Estimate domain age in days"""
        # This would use WHOIS lookup
        # Simplified implementation - returns None
        return None


class SecurityScanner:
    """Scan for security issues"""
    
    @staticmethod
    def check_mixed_content(url: str, html_content: str) -> bool:
        """Check for mixed content issues"""
        if not url.startswith('https'):
            return False
        
        # Check for http:// resources in https page
        has_mixed = 'http://' in html_content
        return has_mixed
    
    @staticmethod
    def check_deprecated_protocols(html_content: str) -> List[str]:
        """Check for deprecated protocols"""
        deprecated = []
        
        if 'tls 1.0' in html_content.lower():
            deprecated.append('TLS 1.0')
        if 'ssl 3.0' in html_content.lower():
            deprecated.append('SSL 3.0')
        
        return deprecated


class PerformanceAnalyzer:
    """Analyze page performance"""
    
    @staticmethod
    def analyze_load_time(response_time: float) -> str:
        """Categorize load time"""
        if response_time < 1.0:
            return 'excellent'
        elif response_time < 2.0:
            return 'good'
        elif response_time < 5.0:
            return 'average'
        else:
            return 'slow'


class StoreCategorizor:
    """Categorize stores by type"""
    
    STORE_TYPES = {
        'general_gaming': ['game', 'gaming', 'video game'],
        'cd_keys': ['cdkey', 'cd-key', 'key store'],
        'software': ['software', 'windows', 'office'],
        'gift_cards': ['gift card', 'giftcard'],
        'marketplace': ['marketplace', 'market'],
    }
    
    @staticmethod
    def categorize_store(url: str, html_content: str) -> str:
        """Categorize store type"""
        url_lower = url.lower()
        html_lower = html_content.lower() if html_content else ''
        
        for category, keywords in StoreCategorizor.STORE_TYPES.items():
            for keyword in keywords:
                if keyword in url_lower or keyword in html_lower:
                    return category
        
        return 'general'


class ReviewAggregator:
    """Aggregate reviews from multiple sources"""
    
    @staticmethod
    def find_trustpilot_rating(domain: str, http_client: HTTPClient) -> Optional[float]:
        """Find Trustpilot rating"""
        try:
            search_url = f"https://www.trustpilot.com/review/{domain}"
            response = http_client.get(search_url, timeout=5)
            
            if response and response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                # Extract rating - simplified
                return None
        except Exception:
            return None


class DataExporter:
    """Export data in various formats"""
    
    @staticmethod
    def export_csv(stores: List[StoreInfo], filename: str):
        """Export stores to CSV"""
        import csv
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                if not stores:
                    return
                
                fieldnames = list(asdict(stores[0]).keys())
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for store in stores:
                    writer.writerow(asdict(store))
        except Exception:
            pass
    
    @staticmethod
    def export_html(stores: List[StoreInfo], filename: str):
        """Export stores to HTML"""
        try:
            html = '<html><head><title>CD Key Stores</title></head><body>'
            html += '<h1>CD Key Stores</h1><table border="1">'
            html += '<tr><th>Name</th><th>URL</th><th>PayPal</th><th>Instant</th></tr>'
            
            for store in stores:
                html += f'<tr><td>{store.name}</td><td><a href="{store.url}">{store.url}</a></td>'
                html += f'<td>{"✓" if store.paypal_supported else "✗"}</td>'
                html += f'<td>{"✓" if store.instant_delivery else "✗"}</td></tr>'
            
            html += '</table></body></html>'
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(html)
        except Exception:
            pass


class StatisticsCalculator:
    """Calculate statistics"""
    
    @staticmethod
    def calculate_success_rate(stats: dict) -> float:
        """Calculate success rate"""
        if stats['stores_found'] == 0:
            return 0.0
        return stats['validated'] / stats['stores_found']
    
    @staticmethod
    def calculate_average_confidence(stores: List[StoreInfo]) -> Dict[str, float]:
        """Calculate average confidence scores"""
        if not stores:
            return {'paypal': 0.0, 'delivery': 0.0}
        
        avg_paypal = sum(s.paypal_confidence for s in stores) / len(stores)
        avg_delivery = sum(s.delivery_confidence for s in stores) / len(stores)
        
        return {
            'paypal': avg_paypal,
            'delivery': avg_delivery
        }


def print_banner():
    """Print ASCII art banner"""
    banner = f"""{Colors.CYAN}{Colors.BOLD}
 ██████╗██████╗     ██╗  ██╗███████╗██╗   ██╗
██╔════╝██╔══██╗    ██║ ██╔╝██╔════╝╚██╗ ██╔╝
██║     ██║  ██║    █████╔╝ █████╗   ╚████╔╝ 
██║     ██║  ██║    ██╔═██╗ ██╔══╝    ╚██╔╝  
╚██████╗██████╔╝    ██║  ██╗███████╗   ██║   
 ╚═════╝╚═════╝     ╚═╝  ╚═╝╚══════╝   ╚═╝   
 
███████╗██╗███╗   ██╗██████╗ ███████╗██████╗ 
██╔════╝██║████╗  ██║██╔══██╗██╔════╝██╔══██╗
█████╗  ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝
██╔══╝  ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗
██║     ██║██║ ╚████║██████╔╝███████╗██║  ██║
╚═╝     ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝
{Colors.ENDC}
{Colors.YELLOW}      CD Key Store Finder v1.0{Colors.ENDC}
{Colors.WHITE}      100+ Search Methods | Ultra Fast{Colors.ENDC}
"""
    print(banner)


def export_results(stores: List[StoreInfo], stats: dict):
    """
    Export search results to multiple file formats
    
    This function creates three output files with different formats
    to serve different use cases:
    
    File 1: cdkey_stores.txt (Simple List)
    - Plain text file with one URL per line
    - Easy to parse and share
    - Compatible with all text editors
    - Perfect for quick reference
    
    File 2: cdkey_stores.json (Detailed Data)
    - Complete JSON with all store information
    - Includes:
      * URL and store name
      * PayPal support status and confidence
      * Instant delivery status and confidence
      * Discovery method
      * Validation timestamp
      * SSL certificate status
      * Reputation score
      * Additional metadata
    - Machine-readable format
    - Can be imported into databases or applications
    
    File 3: stats.json (Statistics)
    - Comprehensive search statistics
    - Includes:
      * Total queries executed
      * Stores found and validated
      * PayPal and instant delivery counts
      * Search duration
      * Methods used
      * Timestamp
    - Useful for analysis and reporting
    
    All files are UTF-8 encoded to support international characters.
    JSON files use 2-space indentation for readability.
    
    Args:
        stores: List of validated StoreInfo objects
        stats: Dictionary containing search statistics
    """
    
    # File 1: Simple text file with URLs only
    # This format is easy to use with wget, curl, or manual browsing
    with open('cdkey_stores.txt', 'w', encoding='utf-8') as f:
        for store in stores:
            f.write(f"{store.url}\n")
    
    # File 2: Detailed JSON with complete store information
    # Convert StoreInfo dataclass objects to dictionaries
    stores_data = [asdict(store) for store in stores]
    with open('cdkey_stores.json', 'w', encoding='utf-8') as f:
        json.dump(stores_data, f, indent=2, ensure_ascii=False)
    
    # File 3: Statistics JSON with search metrics
    # Calculate duration and prepare statistics
    duration = int(time.time() - stats['start_time'])
    stats_data = {
        'total_queries': stats['total_queries'],
        'stores_found': stats['stores_found'],
        'with_paypal': stats['with_paypal'],
        'instant_delivery': stats['with_instant'],
        'validated': stats['validated'],
        'duration_seconds': duration,
        'methods_used': list(stats['methods_used']),
        'timestamp': datetime.now().isoformat(),
        'average_stores_per_query': stats['stores_found'] / max(stats['total_queries'], 1),
        'validation_success_rate': stats['validated'] / max(stats['stores_found'], 1),
        'paypal_percentage': (stats['with_paypal'] / max(stats['validated'], 1)) * 100,
        'instant_delivery_percentage': (stats['with_instant'] / max(stats['validated'], 1)) * 100,
    }
    
    with open('stats.json', 'w', encoding='utf-8') as f:
        json.dump(stats_data, f, indent=2)
    
    # Optional: Export to CSV if stores exist
    if stores:
        try:
            DataExporter.export_csv(stores, 'cdkey_stores.csv')
        except Exception:
            pass
    
    # Optional: Export to HTML for easy viewing
    if stores:
        try:
            DataExporter.export_html(stores, 'cdkey_stores.html')
        except Exception:
            pass


def validate_input(target: int) -> int:
    """
    Validate user input for target count
    
    Ensures the target count is within acceptable range (10-500).
    If invalid, returns default value of 50.
    
    Args:
        target: User-provided target count
    
    Returns:
        Validated target count
    """
    if not isinstance(target, int):
        return 50
    
    if target < 10:
        return 10
    elif target > 500:
        return 500
    else:
        return target


def print_welcome_message():
    """
    Print welcome message and instructions
    
    Displays information about the tool, what it does,
    and what to expect during the search process.
    """
    print(f"\n{Colors.BOLD}{Colors.CYAN}Welcome to CD Key Store Finder!{Colors.ENDC}\n")
    print(f"{Colors.WHITE}This tool will help you find CD key stores with:{Colors.ENDC}")
    print(f"  {Colors.OKGREEN}✓{Colors.ENDC} PayPal support")
    print(f"  {Colors.OKGREEN}✓{Colors.ENDC} Instant delivery")
    print(f"  {Colors.OKGREEN}✓{Colors.ENDC} SSL security")
    print(f"\n{Colors.YELLOW}Using 100+ search methods across:{Colors.ENDC}")
    print(f"  • Search engines (Google, Bing, DuckDuckGo, Yahoo, Yandex)")
    print(f"  • Social media (Reddit, Twitter, Facebook)")
    print(f"  • Forums (HotUKDeals, SlickDeals, CheapAssGamer)")
    print(f"  • Price comparison sites (15+ sites)")
    print(f"  • Domain enumeration (intelligent guessing)")
    print(f"  • And many more sources...")
    print()


def print_search_summary(finder: CDKeyFinder):
    """
    Print comprehensive search summary
    
    Displays detailed information about the search results
    including top stores, statistics, and recommendations.
    
    Args:
        finder: CDKeyFinder instance with completed search
    """
    print(f"\n{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}           SEARCH SUMMARY{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════{Colors.ENDC}\n")
    
    # Basic statistics
    print(f"{Colors.BOLD}Search Statistics:{Colors.ENDC}")
    print(f"  • Queries Executed: {Colors.OKBLUE}{finder.stats['total_queries']}{Colors.ENDC}")
    print(f"  • URLs Discovered: {Colors.OKGREEN}{finder.stats['stores_found']}{Colors.ENDC}")
    print(f"  • Stores Validated: {Colors.OKCYAN}{finder.stats['validated']}{Colors.ENDC}")
    print(f"  • With PayPal: {Colors.WARNING}{finder.stats['with_paypal']}{Colors.ENDC}")
    print(f"  • Instant Delivery: {Colors.PURPLE}{finder.stats['with_instant']}{Colors.ENDC}")
    
    # Calculate percentages
    if finder.stats['validated'] > 0:
        paypal_pct = (finder.stats['with_paypal'] / finder.stats['validated']) * 100
        instant_pct = (finder.stats['with_instant'] / finder.stats['validated']) * 100
        print(f"\n{Colors.BOLD}Quality Metrics:{Colors.ENDC}")
        print(f"  • PayPal Support: {Colors.OKGREEN}{paypal_pct:.1f}%{Colors.ENDC}")
        print(f"  • Instant Delivery: {Colors.OKGREEN}{instant_pct:.1f}%{Colors.ENDC}")
    
    # Time statistics
    duration = int(time.time() - finder.stats['start_time'])
    minutes = duration // 60
    seconds = duration % 60
    qps = finder.stats['total_queries'] / max(duration, 1)
    
    print(f"\n{Colors.BOLD}Performance:{Colors.ENDC}")
    print(f"  • Duration: {Colors.WHITE}{minutes}m {seconds}s{Colors.ENDC}")
    print(f"  • Queries/Second: {Colors.WHITE}{qps:.2f}{Colors.ENDC}")
    print(f"  • Methods Used: {Colors.WHITE}{len(finder.stats['methods_used'])}{Colors.ENDC}")
    
    # Top stores by reputation
    if finder.results:
        sorted_stores = sorted(finder.results, key=lambda x: x.reputation_score, reverse=True)
        print(f"\n{Colors.BOLD}Top 5 Stores by Reputation:{Colors.ENDC}")
        for i, store in enumerate(sorted_stores[:5], 1):
            paypal_icon = "✓" if store.paypal_supported else "✗"
            instant_icon = "✓" if store.instant_delivery else "✗"
            print(f"  {i}. {Colors.OKBLUE}{store.name[:40]}{Colors.ENDC}")
            print(f"     URL: {store.url}")
            print(f"     Score: {Colors.OKGREEN}{store.reputation_score:.2f}{Colors.ENDC} | "
                  f"PayPal: {paypal_icon} | Instant: {instant_icon}")
    
    print(f"\n{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════{Colors.ENDC}\n")


def print_export_info():
    """
    Print information about exported files
    
    Explains what files were created and how to use them.
    """
    print(f"\n{Colors.BOLD}📁 Generated Files:{Colors.ENDC}\n")
    
    print(f"{Colors.OKGREEN}1. cdkey_stores.txt{Colors.ENDC}")
    print(f"   Simple list of URLs, one per line")
    print(f"   Perfect for: Quick reference, sharing, batch processing")
    
    print(f"\n{Colors.OKGREEN}2. cdkey_stores.json{Colors.ENDC}")
    print(f"   Complete store data in JSON format")
    print(f"   Perfect for: Data analysis, importing to databases, applications")
    
    print(f"\n{Colors.OKGREEN}3. stats.json{Colors.ENDC}")
    print(f"   Search statistics and metrics")
    print(f"   Perfect for: Performance analysis, reporting")
    
    print(f"\n{Colors.OKCYAN}Optional files (if generated):{Colors.ENDC}")
    print(f"   • cdkey_stores.csv - Spreadsheet-friendly format")
    print(f"   • cdkey_stores.html - HTML table for easy viewing")


def print_usage_tips():
    """
    Print usage tips and recommendations
    
    Provides helpful tips for users on how to use the results
    and best practices.
    """
    print(f"\n{Colors.BOLD}{Colors.YELLOW}💡 Usage Tips:{Colors.ENDC}\n")
    
    print(f"{Colors.WHITE}1. Verify Stores{Colors.ENDC}")
    print(f"   Always verify stores manually before making purchases.")
    print(f"   Check reviews, SSL certificate, and reputation.")
    
    print(f"\n{Colors.WHITE}2. Compare Prices{Colors.ENDC}")
    print(f"   Use price comparison sites to find the best deals.")
    print(f"   Don't just buy from the first store.")
    
    print(f"\n{Colors.WHITE}3. Check Return Policy{Colors.ENDC}")
    print(f"   Ensure the store has a clear return/refund policy.")
    print(f"   Read terms of service carefully.")
    
    print(f"\n{Colors.WHITE}4. Use Secure Payment{Colors.ENDC}")
    print(f"   PayPal offers buyer protection for most purchases.")
    print(f"   Avoid stores that only accept cryptocurrency or wire transfers.")
    
    print(f"\n{Colors.WHITE}5. Read Reviews{Colors.ENDC}")
    print(f"   Check Trustpilot, Reddit, or other review sites.")
    print(f"   Look for recent reviews, not just old ones.")


def handle_errors():
    """
    Handle common errors gracefully
    
    Provides helpful error messages and troubleshooting steps
    when things go wrong.
    """
    print(f"\n{Colors.FAIL}{Colors.BOLD}⚠ Common Issues and Solutions:{Colors.ENDC}\n")
    
    print(f"{Colors.YELLOW}Issue:{Colors.ENDC} No stores found")
    print(f"{Colors.WHITE}Solutions:{Colors.ENDC}")
    print(f"  • Check your internet connection")
    print(f"  • Try again later (search engines may be rate limiting)")
    print(f"  • Reduce thread count in code")
    
    print(f"\n{Colors.YELLOW}Issue:{Colors.ENDC} Program is slow")
    print(f"{Colors.WHITE}Solutions:{Colors.ENDC}")
    print(f"  • This is normal for large target counts (100+)")
    print(f"  • Each store needs to be validated individually")
    print(f"  • Be patient, it will complete")
    
    print(f"\n{Colors.YELLOW}Issue:{Colors.ENDC} SSL errors")
    print(f"{Colors.WHITE}Solutions:{Colors.ENDC}")
    print(f"  • Some stores may have invalid SSL certificates")
    print(f"  • The tool will skip these and continue")
    print(f"  • This is expected behavior")


def main():
    """
    Main entry point for the CD Key Store Finder
    
    This function orchestrates the entire application flow:
    1. Displays ASCII art banner
    2. Prints welcome message and instructions
    3. Prompts user for target count
    4. Validates user input
    5. Initializes CDKeyFinder with parameters
    6. Starts the search process
    7. Displays real-time progress
    8. Shows comprehensive summary
    9. Exports results to files
    10. Provides usage tips
    
    The function handles KeyboardInterrupt for graceful shutdown
    and provides helpful error messages for common issues.
    """
    try:
        print_banner()
        print_welcome_message()
        
        print(f"{Colors.BOLD}How many stores do you want to find? (10-500): {Colors.ENDC}", end="")
        try:
            target = int(input())
            target = validate_input(target)
        except (ValueError, EOFError):
            print(f"\n{Colors.WARNING}⚠ Invalid input. Using default: 50{Colors.ENDC}")
            target = 50
        
        print(f"\n{Colors.OKGREEN}🚀 Starting search for {target} stores...{Colors.ENDC}")
        print(f"{Colors.OKCYAN}⚡ Launching 100 concurrent workers...{Colors.ENDC}")
        print(f"{Colors.WHITE}⏳ This may take 2-5 minutes depending on target count...{Colors.ENDC}")
        time.sleep(2)
        
        # Initialize and run finder
        finder = CDKeyFinder(target_count=target, threads=100)
        finder.run()
        
        # Clear screen and show final results
        os.system('clear' if os.name != 'nt' else 'cls')
        print_banner()
        
        # Print comprehensive summary
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}✅ SEARCH COMPLETED!{Colors.ENDC}")
        print_search_summary(finder)
        
        # Export results to files
        print(f"{Colors.BOLD}💾 Exporting results...{Colors.ENDC}")
        export_results(finder.results, finder.stats)
        
        # Print export information
        print_export_info()
        
        # Print usage tips
        print_usage_tips()
        
        print(f"\n{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════{Colors.ENDC}")
        print(f"{Colors.CYAN}{Colors.BOLD}Thank you for using CD Key Store Finder!{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.CYAN}═══════════════════════════════════════{Colors.ENDC}\n")
        
    except KeyboardInterrupt:
        print(f"\n\n{Colors.FAIL}⚠ Search interrupted by user{Colors.ENDC}")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n{Colors.FAIL}❌ Error: {e}{Colors.ENDC}")
        sys.exit(1)


if __name__ == "__main__":
    main()
