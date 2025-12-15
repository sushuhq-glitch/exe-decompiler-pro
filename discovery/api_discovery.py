'''Comprehensive API Endpoint Discovery System'''
import asyncio
import logging
import re
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin, urlparse
import requests

class APIDiscovery:
    '''Discovers API endpoints by analyzing traffic and patterns.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.discovered_endpoints = []
        self.common_patterns = [
            r'/api/[a-zA-Z0-9/_-]+',
            r'/v[0-9]+/[a-zA-Z0-9/_-]+',
            r'/graphql',
            r'/rest/[a-zA-Z0-9/_-]+'
        ]
    
    async def discover_endpoints(
        self,
        base_url: str,
        tokens: Dict[str, Any],
        intercepted_requests: Optional[List[Dict]] = None
    ) -> List[Dict[str, Any]]:
        '''Discover API endpoints.'''
        self.logger.info(f"Starting API discovery for {base_url}")
        
        endpoints = []
        
        # Discover from intercepted traffic
        if intercepted_requests:
            endpoints.extend(self._extract_from_requests(intercepted_requests))
        
        # Discover common endpoints
        endpoints.extend(await self._discover_common_endpoints(base_url, tokens))
        
        # Discover profile endpoints
        endpoints.extend(await self._discover_profile_endpoints(base_url, tokens))
        
        # Discover payment endpoints
        endpoints.extend(await self._discover_payment_endpoints(base_url, tokens))
        
        # Discover order endpoints
        endpoints.extend(await self._discover_order_endpoints(base_url, tokens))
        
        # Remove duplicates
        unique_endpoints = self._deduplicate_endpoints(endpoints)
        
        self.logger.info(f"Discovered {len(unique_endpoints)} unique endpoints")
        return unique_endpoints
    
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
        '''Discover order-related endpoints.'''
        order_paths = [
            '/api/orders',
            '/api/user/orders',
            '/api/order/history',
            '/api/purchases',
            '/api/transactions',
            '/api/v1/orders',
            '/api/v1/user/orders'
        ]
        
        endpoints = []
        for path in order_paths:
            url = urljoin(base_url, path)
            if await self._test_endpoint(url, 'GET', tokens):
                endpoints.append({
                    'url': url,
                    'method': 'GET',
                    'type': 'orders',
                    'tested': True,
                    'description': 'Order history and transactions'
                })
        
        return endpoints
    
    async def _test_endpoint(
        self,
        url: str,
        method: str,
        tokens: Dict[str, Any]
    ) -> bool:
        '''Test if endpoint exists and is accessible.'''
        try:
            headers = self._build_auth_headers(tokens)
            
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                timeout=5
            )
            
            # Consider 200, 401, 403 as existing endpoints
            return response.status_code in [200, 401, 403]
        
        except Exception as e:
            self.logger.debug(f"Endpoint test failed for {url}: {e}")
            return False
    
    def _build_auth_headers(self, tokens: Dict[str, Any]) -> Dict[str, str]:
        '''Build authentication headers from tokens.'''
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json'
        }
        
        # Add Bearer token if present
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
