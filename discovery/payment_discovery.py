'''Payment Endpoint Discovery'''
import logging
from typing import Dict, List

class PaymentDiscovery:
    '''Discovers payment-related API endpoints.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.payment_patterns = [
            '/api/payment',
            '/api/billing',
            '/api/wallet',
            '/api/cards',
            '/api/payment/methods'
        ]
    
    async def discover(self, base_url: str, tokens: Dict) -> List[Dict]:
        '''Discover payment endpoints.'''
        endpoints = []
        
        for pattern in self.payment_patterns:
            endpoint = {
                'path': pattern,
                'method': 'GET',
                'type': 'payment',
                'description': 'Payment and billing data'
            }
            endpoints.append(endpoint)
        
        return endpoints

    async def discover_payment_methods_endpoint(self, base_url: str, session_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Discover payment methods endpoint.
        
        Args:
            base_url: Base URL
            session_data: Session/auth data
        
        Returns:
            Payment methods endpoint info or None
        """
        patterns = [
            "/api/payment/methods", "/api/payment-methods", "/api/user/payment-methods",
            "/api/wallet", "/api/user/wallet", "/api/cards",
            "/api/billing/methods", "/api/billing/cards",
            "/payment/methods", "/payment-methods", "/wallet"
        ]
        
        headers = self._build_auth_headers(session_data)
        
        for pattern in patterns:
            url = urljoin(base_url, pattern)
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers, timeout=5) as resp:
                        if 200 <= resp.status < 300:
                            data = await resp.json()
                            return {
                                "endpoint": url,
                                "method": "GET",
                                "type": "payment_methods",
                                "status": resp.status,
                                "sample_data": data
                            }
            except Exception:
                continue
        
        return None
    
    async def discover_transaction_endpoints(self, base_url: str, session_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Discover transaction/order history endpoints.
        
        Args:
            base_url: Base URL
            session_data: Session/auth data
        
        Returns:
            List of discovered endpoints
        """
        endpoints = []
        
        patterns = [
            "/api/transactions", "/api/orders", "/api/purchases",
            "/api/user/transactions", "/api/user/orders", "/api/user/purchases",
            "/api/history", "/api/user/history", "/api/payment/history",
            "/transactions", "/orders", "/purchases"
        ]
        
        headers = self._build_auth_headers(session_data)
        
        for pattern in patterns:
            url = urljoin(base_url, pattern)
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers, timeout=5) as resp:
                        if 200 <= resp.status < 300:
                            endpoints.append({
                                "endpoint": url,
                                "method": "GET",
                                "type": "transactions",
                                "status": resp.status
                            })
            except Exception:
                continue
        
        return endpoints
    
    def _build_auth_headers(self, session_data: Dict[str, Any]) -> Dict[str, str]:
        """Build authentication headers from session data."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        if "token" in session_data:
            headers["Authorization"] = f"Bearer {session_data['token']}"
        elif "access_token" in session_data:
            headers["Authorization"] = f"Bearer {session_data['access_token']}"
        
        if "cookies" in session_data:
            headers["Cookie"] = session_data["cookies"]
        
        return headers
