"""Chrome DevTools Protocol Integration"""
import json
import logging
from typing import Dict, Any, Callable, List, Optional

class DevToolsProtocol:
    """Chrome DevTools Protocol integration."""
    
    def __init__(self, driver):
        self.logger = logging.getLogger(__name__)
        self.driver = driver
        self.listeners = {}
        self.network_logs = []
        self.request_map = {}
    
    def enable_network(self):
        """Enable network tracking."""
        try:
            self.driver.execute_cdp_cmd("Network.enable", {})
            self.logger.info("✅ Network tracking enabled via CDP")
        except Exception as e:
            self.logger.error(f"Failed to enable network tracking: {e}")
    
    def enable_fetch(self):
        """Enable fetch interception."""
        try:
            self.driver.execute_cdp_cmd("Fetch.enable", {
                "patterns": [{"urlPattern": "*"}]
            })
            self.logger.info("✅ Fetch interception enabled via CDP")
        except Exception as e:
            self.logger.error(f"Failed to enable fetch: {e}")
    
    def add_request_interceptor(self, callback: Callable):
        """Add request interceptor."""
        self.listeners["request"] = callback
    
    def add_response_interceptor(self, callback: Callable):
        """Add response interceptor."""
        self.listeners["response"] = callback
    
    def get_response_body(self, request_id: str) -> str:
        """Get response body for request ID."""
        try:
            response = self.driver.execute_cdp_cmd("Network.getResponseBody", {
                "requestId": request_id
            })
            return response.get("body", "")
        except Exception as e:
            self.logger.error(f"Failed to get response body: {e}")
            return ""
    
    def set_extra_headers(self, headers: Dict[str, str]):
        """Set extra HTTP headers."""
        try:
            self.driver.execute_cdp_cmd("Network.setExtraHTTPHeaders", {
                "headers": headers
            })
            self.logger.info("✅ Extra headers set via CDP")
        except Exception as e:
            self.logger.error(f"Failed to set extra headers: {e}")
    
    def get_network_events(self) -> List[Dict[str, Any]]:
        """
        Get all network events from performance logs.
        
        Returns:
            List of network event dictionaries
        """
        events = []
        try:
            logs = self.driver.get_log('performance')
            for entry in logs:
                try:
                    log = json.loads(entry['message'])['message']
                    if 'Network.' in log.get('method', ''):
                        events.append(log)
                except Exception:
                    continue
        except Exception as e:
            self.logger.error(f"Failed to get network events: {e}")
        
        return events
    
    def extract_requests(self, network_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract request details from network events.
        
        Args:
            network_events: List of network event logs
        
        Returns:
            List of request dictionaries
        """
        requests = []
        
        for event in network_events:
            method = event.get('method', '')
            params = event.get('params', {})
            
            if method == 'Network.requestWillBeSent':
                request = params.get('request', {})
                request_id = params.get('requestId', '')
                
                requests.append({
                    'request_id': request_id,
                    'url': request.get('url', ''),
                    'method': request.get('method', 'GET'),
                    'headers': request.get('headers', {}),
                    'post_data': request.get('postData', ''),
                    'timestamp': params.get('timestamp', 0)
                })
        
        return requests
    
    def extract_responses(self, network_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract response details from network events.
        
        Args:
            network_events: List of network event logs
        
        Returns:
            List of response dictionaries
        """
        responses = []
        
        for event in network_events:
            method = event.get('method', '')
            params = event.get('params', {})
            
            if method == 'Network.responseReceived':
                response = params.get('response', {})
                request_id = params.get('requestId', '')
                
                responses.append({
                    'request_id': request_id,
                    'url': response.get('url', ''),
                    'status': response.get('status', 0),
                    'status_text': response.get('statusText', ''),
                    'headers': response.get('headers', {}),
                    'mime_type': response.get('mimeType', ''),
                    'timestamp': params.get('timestamp', 0)
                })
        
        return responses
    
    def find_login_api(self, requests: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Find the login API endpoint from requests.
        
        Args:
            requests: List of request dictionaries
        
        Returns:
            Login API request dictionary or None
        """
        login_keywords = ['login', 'signin', 'auth', 'authenticate', 'session/new']
        
        for request in requests:
            url = request.get('url', '').lower()
            method = request.get('method', '')
            
            # Look for POST requests with login keywords
            if method == 'POST' and any(keyword in url for keyword in login_keywords):
                self.logger.info(f"✅ Found login API: {request['url']}")
                return request
        
        return None
    
    def discover_endpoints(self, requests: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Discover and categorize API endpoints.
        
        Args:
            requests: List of request dictionaries
        
        Returns:
            Dictionary categorizing endpoints by type
        """
        endpoints = {
            'login': [],
            'profile': [],
            'orders': [],
            'payment': [],
            'api': [],
            'other': []
        }
        
        for request in requests:
            url = request.get('url', '').lower()
            method = request.get('method', '')
            
            # Categorize by URL patterns
            if any(kw in url for kw in ['login', 'signin', 'auth', 'authenticate']):
                endpoints['login'].append(request)
            elif any(kw in url for kw in ['profile', 'user', 'account', 'me']):
                endpoints['profile'].append(request)
            elif any(kw in url for kw in ['order', 'orders', 'purchase']):
                endpoints['orders'].append(request)
            elif any(kw in url for kw in ['payment', 'pay', 'checkout', 'transaction']):
                endpoints['payment'].append(request)
            elif any(kw in url for kw in ['/api/', '/v1/', '/v2/', '/v3/', '/graphql']):
                endpoints['api'].append(request)
            else:
                endpoints['other'].append(request)
        
        # Log discoveries
        for category, reqs in endpoints.items():
            if reqs:
                self.logger.info(f"✅ Found {len(reqs)} {category} endpoints")
        
        return endpoints
