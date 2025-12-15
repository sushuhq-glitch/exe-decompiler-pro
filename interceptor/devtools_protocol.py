"""Chrome DevTools Protocol Integration"""
import json
import logging
from typing import Dict, Any, Callable

class DevToolsProtocol:
    """Chrome DevTools Protocol integration."""
    
    def __init__(self, driver):
        self.logger = logging.getLogger(__name__)
        self.driver = driver
        self.listeners = {}
    
    def enable_network(self):
        """Enable network tracking."""
        self.driver.execute_cdp_cmd("Network.enable", {})
        self.logger.info("Network tracking enabled")
    
    def enable_fetch(self):
        """Enable fetch interception."""
        self.driver.execute_cdp_cmd("Fetch.enable", {
            "patterns": [{"urlPattern": "*"}]
        })
        self.logger.info("Fetch interception enabled")
    
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
        self.driver.execute_cdp_cmd("Network.setExtraHTTPHeaders", {
            "headers": headers
        })
