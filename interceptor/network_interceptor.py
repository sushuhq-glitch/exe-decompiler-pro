#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Network Interceptor - Chrome DevTools Protocol Integration
==========================================================

This module intercepts network traffic using Chrome DevTools Protocol (CDP).
It captures API calls during fake login execution to extract:
- Request URL and method
- Request headers
- Request payload
- Response data
- Cookies and tokens

Author: Telegram API Checker Bot Team
Version: 2.0.0
"""

import asyncio
import json
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from urllib.parse import urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

logger = logging.getLogger(__name__)


class NetworkInterceptor:
    """
    Intercepts network traffic using Chrome DevTools Protocol.
    
    This class uses Selenium with CDP to capture all network requests
    and responses during page interactions, especially login attempts.
    """
    
    def __init__(self, driver: webdriver.Chrome):
        """
        Initialize the network interceptor.
        
        Args:
            driver: Selenium Chrome WebDriver with logging enabled
        """
        self.driver = driver
        self.requests: List[Dict[str, Any]] = []
        self.responses: List[Dict[str, Any]] = []
        self.captured_api: Optional[Dict[str, Any]] = None
    
    async def intercept_login(
        self,
        url: str,
        email_selector: str,
        password_selector: str,
        submit_selector: Optional[str] = None,
        test_email: str = "test@example.com",
        test_password: str = "TestPassword123"
    ) -> Optional[Dict[str, Any]]:
        """
        Execute fake login and intercept API call.
        
        Args:
            url: Login page URL
            email_selector: CSS selector for email input
            password_selector: CSS selector for password input
            submit_selector: CSS selector for submit button (optional)
            test_email: Fake email for testing
            test_password: Fake password for testing
            
        Returns:
            Captured API details or None
        """
        try:
            logger.info(f"Starting fake login on: {url}")
            
            # Enable Chrome DevTools Protocol Network domain
            self.driver.execute_cdp_cmd('Network.enable', {})
            logger.info("CDP Network enabled")
            
            # Navigate to login page
            self.driver.get(url)
            time.sleep(2)  # Wait for page load
            
            # Clear previous captures
            self.requests.clear()
            self.responses.clear()
            
            # Fill email field
            logger.info(f"Filling email field: {email_selector}")
            email_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, email_selector))
            )
            email_input.clear()
            email_input.send_keys(test_email)
            
            # Fill password field
            logger.info(f"Filling password field: {password_selector}")
            password_input = self.driver.find_element(By.CSS_SELECTOR, password_selector)
            password_input.clear()
            password_input.send_keys(test_password)
            
            time.sleep(1)  # Brief pause before submit
            
            # Submit form
            if submit_selector:
                logger.info(f"Clicking submit button: {submit_selector}")
                submit_button = self.driver.find_element(By.CSS_SELECTOR, submit_selector)
                submit_button.click()
            else:
                # Try to submit by pressing Enter
                logger.info("Submitting by pressing Enter")
                password_input.send_keys('\n')
            
            # Wait for network activity
            logger.info("Waiting for network activity...")
            await asyncio.sleep(5)
            
            # Parse performance logs to find API calls
            self.captured_api = self._parse_performance_logs()
            
            if self.captured_api:
                logger.info(f"✅ Captured login API: {self.captured_api['url']}")
            else:
                logger.warning("⚠️ No login API captured")
            
            return self.captured_api
            
        except TimeoutException:
            logger.error("Timeout waiting for elements")
            return None
        except NoSuchElementException as e:
            logger.error(f"Element not found: {e}")
            return None
        except Exception as e:
            logger.exception(f"Error during fake login: {e}")
            return None
    
    def _parse_performance_logs(self) -> Optional[Dict[str, Any]]:
        """
        Parse Chrome performance logs to extract network requests.
        
        Returns:
            Login API details or None
        """
        try:
            logs = self.driver.get_log('performance')
            logger.info(f"Retrieved {len(logs)} performance log entries")
            
            captured_requests = []
            
            for entry in logs:
                try:
                    log_data = json.loads(entry['message'])
                    message = log_data.get('message', {})
                    method = message.get('method', '')
                    
                    # Look for Network.requestWillBeSent (outgoing requests)
                    if method == 'Network.requestWillBeSent':
                        params = message.get('params', {})
                        request = params.get('request', {})
                        
                        url = request.get('url', '')
                        http_method = request.get('method', '')
                        
                        # Filter for POST requests to likely authentication endpoints
                        if self._is_auth_request(url, http_method, request):
                            captured_request = {
                                'url': url,
                                'method': http_method,
                                'headers': request.get('headers', {}),
                                'postData': request.get('postData', ''),
                                'timestamp': params.get('timestamp', time.time())
                            }
                            captured_requests.append(captured_request)
                            logger.info(f"Captured potential auth request: {http_method} {url}")
                
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    logger.debug(f"Error parsing log entry: {e}")
                    continue
            
            # Find the best match (most likely login API)
            if captured_requests:
                return self._select_best_auth_request(captured_requests)
            
            return None
            
        except Exception as e:
            logger.error(f"Error parsing performance logs: {e}")
            return None
    
    def _is_auth_request(self, url: str, method: str, request: Dict) -> bool:
        """
        Check if a request is likely an authentication request.
        
        Args:
            url: Request URL
            method: HTTP method
            request: Request details
            
        Returns:
            True if likely an auth request
        """
        # Must be POST or PUT
        if method not in ['POST', 'PUT']:
            return False
        
        # Check URL for auth-related keywords
        url_lower = url.lower()
        auth_keywords = [
            'login', 'signin', 'sign-in', 'auth', 'authenticate',
            'session', 'token', 'oauth', 'sso'
        ]
        
        url_match = any(keyword in url_lower for keyword in auth_keywords)
        
        # Check if it's a JSON API call
        headers = request.get('headers', {})
        content_type = headers.get('Content-Type', '').lower()
        is_json = 'application/json' in content_type
        
        # Check if request has payload
        has_payload = bool(request.get('postData'))
        
        return url_match and (is_json or has_payload)
    
    def _select_best_auth_request(self, requests: List[Dict]) -> Optional[Dict]:
        """
        Select the most likely authentication request from candidates.
        
        Args:
            requests: List of potential auth requests
            
        Returns:
            Best matching auth request
        """
        if not requests:
            return None
        
        # Score each request
        scored_requests = []
        for req in requests:
            score = 0
            url_lower = req['url'].lower()
            
            # Higher score for specific auth paths
            if '/auth/' in url_lower or '/api/auth' in url_lower:
                score += 10
            if 'login' in url_lower:
                score += 8
            if 'signin' in url_lower:
                score += 8
            if 'token' in url_lower:
                score += 5
            if 'session' in url_lower:
                score += 5
            
            # Bonus for JSON content type
            headers = req.get('headers', {})
            content_type = headers.get('Content-Type', '').lower()
            if 'application/json' in content_type:
                score += 3
            
            # Bonus for having postData
            if req.get('postData'):
                score += 5
                
                # Extra bonus if postData looks like credentials
                post_data = req.get('postData', '').lower()
                if 'email' in post_data or 'password' in post_data:
                    score += 10
                if 'username' in post_data or 'user' in post_data:
                    score += 8
            
            scored_requests.append((score, req))
        
        # Sort by score (highest first)
        scored_requests.sort(key=lambda x: x[0], reverse=True)
        
        # Return the highest scoring request
        best_score, best_request = scored_requests[0]
        logger.info(f"Selected auth request with score {best_score}")
        
        # Parse and format the request
        return self._format_auth_request(best_request)
    
    def _format_auth_request(self, request: Dict) -> Dict[str, Any]:
        """
        Format the captured auth request for easy use.
        
        Args:
            request: Raw captured request
            
        Returns:
            Formatted auth request
        """
        formatted = {
            'url': request['url'],
            'method': request['method'],
            'headers': self._clean_headers(request.get('headers', {})),
            'payload': None,
            'timestamp': request.get('timestamp')
        }
        
        # Parse payload
        post_data = request.get('postData', '')
        if post_data:
            try:
                # Try to parse as JSON
                formatted['payload'] = json.loads(post_data)
            except json.JSONDecodeError:
                # Keep as string if not JSON
                formatted['payload'] = post_data
        
        return formatted
    
    def _clean_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """
        Clean and filter important headers.
        
        Args:
            headers: Raw headers dictionary
            
        Returns:
            Cleaned headers
        """
        # Keep only important headers
        important_headers = [
            'Content-Type', 'Accept', 'Authorization',
            'X-CSRF-Token', 'X-Requested-With', 'User-Agent',
            'Referer', 'Origin'
        ]
        
        cleaned = {}
        for key, value in headers.items():
            if any(imp.lower() in key.lower() for imp in important_headers):
                cleaned[key] = value
        
        return cleaned
    
    def get_captured_api(self) -> Optional[Dict[str, Any]]:
        """
        Get the captured API details.
        
        Returns:
            Captured API details or None
        """
        return self.captured_api
    
    def clear(self):
        """Clear all captured data."""
        self.requests.clear()
        self.responses.clear()
        self.captured_api = None
        logger.info("Network interceptor data cleared")


# Export
__all__ = ['NetworkInterceptor']
