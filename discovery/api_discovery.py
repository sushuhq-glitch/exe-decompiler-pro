#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Discovery - Comprehensive Endpoint Discovery Module
=======================================================

This module discovers API endpoints by testing common paths
with valid authentication tokens.

Author: Telegram API Checker Bot Team
Version: 2.0.0
"""

import asyncio
import logging
import re
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin, urlparse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class APIDiscovery:
    """
    Discovers API endpoints by testing common paths with valid tokens.
    
    Tests various endpoint patterns to find accessible APIs.
    """
    
    def __init__(self, timeout: int = 10, max_retries: int = 2):
        """
        Initialize API Discovery.
        
        Args:
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.discovered_endpoints = []
        self.session = self._create_session()
        
        # Common API endpoint patterns to test
        self.common_patterns = [
            r'/api/[a-zA-Z0-9/_-]+',
            r'/v[0-9]+/[a-zA-Z0-9/_-]+',
            r'/graphql',
            r'/rest/[a-zA-Z0-9/_-]+'
        ]
    
    def _create_session(self) -> requests.Session:
        """Create a requests session with retry logic."""
        session = requests.Session()
        
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS", "TRACE"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    async def discover_endpoints(
        self,
        base_url: str,
        tokens: Dict[str, Any],
        intercepted_requests: Optional[List[Dict]] = None
    ) -> List[Dict[str, Any]]:
        """
        Discover API endpoints using valid authentication tokens.
        
        Args:
            base_url: Base URL of the website/API
            tokens: Authentication tokens from successful login
            intercepted_requests: Optional list of intercepted requests
            
        Returns:
            List of discovered endpoints with their details
        """
        logger.info(f"🔍 Starting API discovery for {base_url}")
        
        endpoints = []
        
        # Extract base API URL from login endpoint if available
        api_base = self._extract_api_base(base_url)
        
        # Discover from intercepted traffic
        if intercepted_requests:
            endpoints.extend(self._extract_from_requests(intercepted_requests))
        
        # Test common endpoint patterns
        logger.info("Testing common endpoints...")
        endpoints.extend(await self._discover_common_endpoints(api_base, tokens))
        
        # Test profile endpoints
        logger.info("Testing profile endpoints...")
        endpoints.extend(await self._discover_profile_endpoints(api_base, tokens))
        
        # Test order/purchase endpoints
        logger.info("Testing order endpoints...")
        endpoints.extend(await self._discover_order_endpoints(api_base, tokens))
        
        # Test address endpoints
        logger.info("Testing address endpoints...")
        endpoints.extend(await self._discover_address_endpoints(api_base, tokens))
        
        # Test payment endpoints
        logger.info("Testing payment endpoints...")
        endpoints.extend(await self._discover_payment_endpoints(api_base, tokens))
        
        # Remove duplicates
        unique_endpoints = self._deduplicate_endpoints(endpoints)
        
        logger.info(f"✅ Discovered {len(unique_endpoints)} unique endpoints")
        return unique_endpoints
    
    def _extract_api_base(self, base_url: str) -> str:
        """
        Extract API base URL from website URL.
        
        Args:
            base_url: Website base URL
            
        Returns:
            API base URL
        """
        parsed = urlparse(base_url)
        
        # Common API subdomain patterns
        if 'api.' not in parsed.netloc:
            # Try to use api subdomain
            api_netloc = parsed.netloc.replace('www.', 'api.')
            if not api_netloc.startswith('api.'):
                api_netloc = f"api.{api_netloc}"
            
            return f"{parsed.scheme}://{api_netloc}"
        
        return base_url
    
    def _extract_from_requests(self, requests: List[Dict]) -> List[Dict]:
        '''Extract endpoints from intercepted requests.'''
        endpoints = []
        for request in requests:
            url = request.get('url', '')
            method = request.get('method', 'GET')
            
            # Check if it's an API endpoint
            if self._is_api_endpoint(url):
                endpoints.append({
                    'url': url,
                    'method': method,
                    'type': self._classify_endpoint(url),
                    'headers': request.get('headers', {}),
                    'body': request.get('body')
                })
        
        return endpoints
    
    def _is_api_endpoint(self, url: str) -> bool:
        '''Check if URL is an API endpoint.'''
        api_indicators = ['/api/', '/v1/', '/v2/', '/v3/', '/graphql', '/rest/']
        return any(indicator in url.lower() for indicator in api_indicators)
    
    def _classify_endpoint(self, url: str) -> str:
        '''Classify endpoint type.'''
        url_lower = url.lower()
        
        if any(kw in url_lower for kw in ['profile', 'user', 'account']):
            return 'profile'
        elif any(kw in url_lower for kw in ['payment', 'card', 'billing']):
            return 'payment'
        elif any(kw in url_lower for kw in ['order', 'purchase', 'transaction']):
            return 'orders'
        elif any(kw in url_lower for kw in ['address', 'location', 'delivery']):
            return 'addresses'
        elif any(kw in url_lower for kw in ['wallet', 'balance', 'credit']):
            return 'wallet'
        else:
            return 'unknown'
    
    async def _discover_common_endpoints(
        self,
        base_url: str,
        tokens: Dict[str, Any]
    ) -> List[Dict]:
        '''Discover common API endpoints.'''
        common_paths = [
            '/api/user',
            '/api/profile',
            '/api/me',
            '/api/user/profile',
            '/api/account',
            '/api/v1/user',
            '/api/v1/profile'
        ]
        
        endpoints = []
        for path in common_paths:
            url = urljoin(base_url, path)
            if await self._test_endpoint(url, 'GET', tokens):
                endpoints.append({
                    'url': url,
                    'method': 'GET',
                    'type': 'profile',
                    'tested': True
                })
        
        return endpoints
    
    async def _discover_profile_endpoints(
        self,
        base_url: str,
        tokens: Dict[str, Any]
    ) -> List[Dict]:
        '''Discover profile-related endpoints.'''
        profile_paths = [
            '/api/user/profile',
            '/api/profile',
            '/api/me',
            '/api/user/me',
            '/api/account/profile',
            '/api/v1/user/profile',
            '/api/v1/profile',
            '/profile',
            '/user/profile'
        ]
        
        endpoints = []
        for path in profile_paths:
            url = urljoin(base_url, path)
            if await self._test_endpoint(url, 'GET', tokens):
                endpoints.append({
                    'url': url,
                    'method': 'GET',
                    'type': 'profile',
                    'tested': True,
                    'description': 'User profile information'
                })
        
        return endpoints
    
    async def _discover_payment_endpoints(
        self,
        base_url: str,
        tokens: Dict[str, Any]
    ) -> List[Dict]:
        '''Discover payment-related endpoints.'''
        payment_paths = [
            '/api/payment/methods',
            '/api/payment',
            '/api/billing',
            '/api/user/payment',
            '/api/wallet',
            '/api/cards',
            '/api/payment/cards',
            '/api/v1/payment/methods',
            '/api/v1/billing'
        ]
        
        endpoints = []
        for path in payment_paths:
            url = urljoin(base_url, path)
            if await self._test_endpoint(url, 'GET', tokens):
                endpoints.append({
                    'url': url,
                    'method': 'GET',
                    'type': 'payment',
                    'tested': True,
                    'description': 'Payment methods and billing'
                })
        
        return endpoints
    
    async def _discover_order_endpoints(
        self,
        base_url: str,
        tokens: Dict[str, Any]
    ) -> List[Dict]:
        """Discover order-related endpoints."""
        order_paths = [
            '/api/orders',
            '/api/user/orders',
            '/api/order/history',
            '/api/purchases',
            '/api/transactions',
            '/api/v1/orders',
            '/api/v1/user/orders',
            '/api/v2/orders',
            '/api/v3/orders',
            '/v1/user/orders',
            '/v2/user/orders',
            '/v3/user/orders'
        ]
        
        endpoints = []
        for path in order_paths:
            url = urljoin(base_url, path)
            result = await self._test_endpoint(url, 'GET', tokens)
            if result:
                endpoints.append({
                    'url': url,
                    'method': 'GET',
                    'type': 'orders',
                    'tested': True,
                    'status_code': result.get('status_code'),
                    'description': 'Order history and transactions'
                })
        
        return endpoints
    
    async def _discover_address_endpoints(
        self,
        base_url: str,
        tokens: Dict[str, Any]
    ) -> List[Dict]:
        """Discover address-related endpoints."""
        address_paths = [
            '/api/addresses',
            '/api/user/addresses',
            '/api/user/address',
            '/api/delivery/addresses',
            '/api/shipping/addresses',
            '/api/v1/addresses',
            '/api/v1/user/addresses',
            '/api/v2/addresses',
            '/api/v3/addresses',
            '/v1/user/addresses',
            '/v2/user/addresses',
            '/v3/user/addresses'
        ]
        
        endpoints = []
        for path in address_paths:
            url = urljoin(base_url, path)
            result = await self._test_endpoint(url, 'GET', tokens)
            if result:
                endpoints.append({
                    'url': url,
                    'method': 'GET',
                    'type': 'addresses',
                    'tested': True,
                    'status_code': result.get('status_code'),
                    'description': 'User addresses and delivery locations'
                })
        
        return endpoints
    
    async def _test_endpoint(
        self,
        url: str,
        method: str,
        tokens: Dict[str, Any]
    ) -> Optional[Dict]:
        """
        Test if endpoint exists and is accessible.
        
        Args:
            url: Endpoint URL to test
            method: HTTP method
            tokens: Authentication tokens
            
        Returns:
            Dict with status code if endpoint exists, None otherwise
        """
        try:
            headers = self._build_auth_headers(tokens)
            
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                timeout=self.timeout,
                allow_redirects=False
            )
            
            # Consider 200 as successful (endpoint exists and returns data)
            if response.status_code == 200:
                logger.info(f"✅ GET {url} (200 OK)")
                return {'status_code': 200, 'success': True}
            
            # 401/403 means endpoint exists but requires different auth
            elif response.status_code in [401, 403]:
                logger.debug(f"⚠️  GET {url} ({response.status_code})")
                return {'status_code': response.status_code, 'success': False}
            
            else:
                logger.debug(f"❌ GET {url} ({response.status_code})")
                return None
        
        except requests.exceptions.Timeout:
            logger.debug(f"⏱️  Timeout: {url}")
            return None
        except requests.exceptions.ConnectionError:
            logger.debug(f"🔌 Connection error: {url}")
            return None
        except Exception as e:
            logger.debug(f"❌ Test failed for {url}: {e}")
            return None
    
    def _build_auth_headers(self, tokens: Dict[str, Any]) -> Dict[str, str]:
        """
        Build authentication headers from tokens.
        
        Args:
            tokens: Dictionary of authentication tokens
            
        Returns:
            Headers dictionary with authentication
        """
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
        }
        
        # Add Bearer token if present
        access_token = tokens.get('access_token')
        if access_token:
            headers['Authorization'] = f'Bearer {access_token}'
        
        # Add cookies if present
        cookies = tokens.get('cookies', {})
        if cookies:
            cookie_str = '; '.join([f'{k}={v}' for k, v in cookies.items()])
            headers['Cookie'] = cookie_str
        
        return headers
    
    def _deduplicate_endpoints(self, endpoints: List[Dict]) -> List[Dict]:
        """
        Remove duplicate endpoints based on URL.
        
        Args:
            endpoints: List of endpoints
            
        Returns:
            List of unique endpoints
        """
        seen_urls = set()
        unique = []
        
        for endpoint in endpoints:
            url = endpoint.get('url')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique.append(endpoint)
        
        return unique


# Export
__all__ = ['APIDiscovery']
        if 'access_token' in tokens:
            headers['Authorization'] = f"Bearer {tokens['access_token']}"
        
        # Add custom headers
        if 'custom_headers' in tokens:
            headers.update(tokens['custom_headers'])
        
        return headers
    
    def _deduplicate_endpoints(self, endpoints: List[Dict]) -> List[Dict]:
        '''Remove duplicate endpoints.'''
        seen = set()
        unique = []
        
        for endpoint in endpoints:
            key = f"{endpoint['method']}:{endpoint['url']}"
            if key not in seen:
                seen.add(key)
                unique.append(endpoint)
        
        return unique
