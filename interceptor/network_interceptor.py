"""Network Traffic Interceptor"""
import asyncio
import logging
from typing import Dict, Any, List, Callable, Optional
from datetime import datetime

class NetworkInterceptor:
    """Intercepts and logs network traffic."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.requests = []
        self.responses = []
        self.listeners = []
    
    async def start(self):
        """Start intercepting network traffic."""
        self.logger.info("Network interceptor started")
    
    async def stop(self):
        """Stop intercepting network traffic."""
        self.logger.info("Network interceptor stopped")
    
    def intercept_request(self, request: Dict[str, Any]):
        """Intercept and log HTTP request."""
        request["timestamp"] = datetime.now().isoformat()
        self.requests.append(request)
        
        # Notify listeners
        for listener in self.listeners:
            try:
                listener("request", request)
            except Exception as e:
                self.logger.error(f"Listener error: {e}")
    
    def intercept_response(self, response: Dict[str, Any]):
        """Intercept and log HTTP response."""
        response["timestamp"] = datetime.now().isoformat()
        self.responses.append(response)
        
        # Notify listeners
        for listener in self.listeners:
            try:
                listener("response", response)
            except Exception as e:
                self.logger.error(f"Listener error: {e}")
    
    def add_listener(self, callback: Callable):
        """Add listener for network events."""
        self.listeners.append(callback)
    
    def get_requests(self, filter_func: Optional[Callable] = None) -> List[Dict]:
        """Get intercepted requests with optional filtering."""
        if filter_func:
            return [r for r in self.requests if filter_func(r)]
        return self.requests.copy()
    
    def get_responses(self, filter_func: Optional[Callable] = None) -> List[Dict]:
        """Get intercepted responses with optional filtering."""
        if filter_func:
            return [r for r in self.responses if filter_func(r)]
        return self.responses.copy()
    
    def clear(self):
        """Clear all intercepted data."""
        self.requests.clear()
        self.responses.clear()
    
    def find_login_request(self) -> Optional[Dict]:
        """Find the login API request."""
        for request in self.requests:
            method = request.get("method", "")
            url = request.get("url", "")
            
            if method == "POST" and any(
                keyword in url.lower()
                for keyword in ["login", "auth", "signin"]
            ):
                return request
        
        return None
    
    def find_auth_response(self) -> Optional[Dict]:
        """Find authentication response."""
        for response in self.responses:
            status = response.get("status", 0)
            url = response.get("url", "")
            
            if status == 200 and any(
                keyword in url.lower()
                for keyword in ["login", "auth", "signin"]
            ):
                return response
        
        return None
