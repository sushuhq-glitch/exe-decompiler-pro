#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Credential Validator - Real Credentials Testing Module
======================================================

This module validates real user credentials against the captured API.
It tests login with actual credentials and extracts access tokens.

Author: Telegram API Checker Bot Team
Version: 2.0.0
"""

import asyncio
import logging
from typing import Dict, Optional, Tuple
import json

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class CredentialValidator:
    """
    Validates user credentials against API endpoints.
    
    Tests real credentials and extracts authentication tokens/cookies.
    """
    
    def __init__(self, timeout: int = 30, max_retries: int = 3):
        """
        Initialize the credential validator.
        
        Args:
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = self._create_session()
    
    def _create_session(self) -> requests.Session:
        """
        Create a requests session with retry logic.
        
        Returns:
            Configured requests session
        """
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS", "TRACE"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    async def validate(
        self,
        api_data: Dict,
        email: str,
        password: str
    ) -> Dict:
        """
        Validate credentials using the captured API data.
        
        Args:
            api_data: Captured API information (URL, headers, payload structure)
            email: Real user email
            password: Real user password
            
        Returns:
            Validation result with tokens and session data
        """
        logger.info(f"✅ Testing credentials for {email}")
        
        try:
            # Extract API details
            url = api_data.get('url')
            method = api_data.get('method', 'POST')
            headers = api_data.get('headers', {})
            payload_template = api_data.get('payload', {})
            
            if not url:
                return {
                    'success': False,
                    'error': 'No API URL provided'
                }
            
            # Prepare payload with real credentials
            payload = self._prepare_payload(payload_template, email, password)
            
            # Prepare headers
            request_headers = self._prepare_headers(headers)
            
            logger.info(f"Sending {method} request to {url}")
            logger.debug(f"Headers: {request_headers}")
            logger.debug(f"Payload: {self._safe_log_payload(payload)}")
            
            # Make the request
            response = self.session.request(
                method=method,
                url=url,
                json=payload if isinstance(payload, dict) else None,
                data=payload if not isinstance(payload, dict) else None,
                headers=request_headers,
                timeout=self.timeout,
                allow_redirects=True
            )
            
            logger.info(f"Response status: {response.status_code}")
            
            # Parse response
            if response.status_code in [200, 201]:
                return await self._parse_success_response(response, email)
            else:
                return await self._parse_error_response(response)
        
        except requests.exceptions.Timeout:
            logger.error("Request timeout")
            return {
                'success': False,
                'error': 'Request timeout'
            }
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error: {e}")
            return {
                'success': False,
                'error': f'Connection error: {str(e)}'
            }
        except Exception as e:
            logger.exception(f"Validation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _prepare_payload(self, template: Dict, email: str, password: str) -> Dict:
        """
        Prepare request payload with real credentials.
        
        Args:
            template: Payload template from captured request
            email: Real email
            password: Real password
            
        Returns:
            Prepared payload
        """
        if isinstance(template, dict):
            # Replace test credentials with real ones
            payload = template.copy()
            
            # Common email field names
            email_fields = ['email', 'username', 'user', 'login', 'Email', 'Username']
            for field in email_fields:
                if field in payload:
                    payload[field] = email
            
            # Common password field names
            password_fields = ['password', 'pass', 'pwd', 'Password']
            for field in password_fields:
                if field in payload:
                    payload[field] = password
            
            return payload
        else:
            # If template is not a dict, create a simple one
            return {
                'email': email,
                'password': password
            }
    
    def _prepare_headers(self, headers: Dict) -> Dict:
        """
        Prepare request headers.
        
        Args:
            headers: Headers from captured request
            
        Returns:
            Cleaned headers
        """
        # Start with captured headers
        request_headers = headers.copy()
        
        # Ensure Content-Type for JSON
        if 'Content-Type' not in request_headers:
            request_headers['Content-Type'] = 'application/json'
        
        # Add User-Agent if not present
        if 'User-Agent' not in request_headers:
            request_headers['User-Agent'] = (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            )
        
        return request_headers
    
    def _safe_log_payload(self, payload: Dict) -> Dict:
        """
        Create safe version of payload for logging (masks password).
        
        Args:
            payload: Original payload
            
        Returns:
            Payload with masked password
        """
        if isinstance(payload, dict):
            safe_payload = payload.copy()
            password_fields = ['password', 'pass', 'pwd', 'Password']
            for field in password_fields:
                if field in safe_payload:
                    safe_payload[field] = '***MASKED***'
            return safe_payload
        return payload
    
    async def _parse_success_response(self, response, email: str) -> Dict:
        """
        Parse successful response and extract tokens.
        
        Args:
            response: Successful HTTP response
            email: User email (for logging)
            
        Returns:
            Success result with tokens
        """
        logger.info(f"✅ Login successful for {email}")
        
        # Parse JSON response
        data = {}
        try:
            if response.headers.get('Content-Type', '').startswith('application/json'):
                data = response.json()
        except json.JSONDecodeError:
            logger.warning("Response is not valid JSON")
        
        # Extract tokens
        tokens = self._extract_tokens(response, data)
        
        result = {
            'success': True,
            'email': email,
            'tokens': tokens,
            'cookies': response.cookies.get_dict(),
            'headers': dict(response.headers),
            'status_code': response.status_code,
            'response_data': data
        }
        
        logger.info(f"🎫 Access token extracted: {tokens.get('access_token', 'N/A')[:50]}...")
        
        return result
    
    async def _parse_error_response(self, response) -> Dict:
        """
        Parse error response.
        
        Args:
            response: Error HTTP response
            
        Returns:
            Error result
        """
        error_message = f"Login failed with status {response.status_code}"
        
        # Try to get error details from response
        try:
            if response.headers.get('Content-Type', '').startswith('application/json'):
                data = response.json()
                if 'error' in data:
                    error_message = data['error']
                elif 'message' in data:
                    error_message = data['message']
        except:
            pass
        
        logger.error(f"❌ {error_message}")
        
        return {
            'success': False,
            'error': error_message,
            'status_code': response.status_code
        }
    
    def _extract_tokens(self, response, data: Dict) -> Dict:
        """
        Extract authentication tokens from response.
        
        Args:
            response: HTTP response object
            data: Parsed JSON response data
            
        Returns:
            Dictionary of extracted tokens
        """
        tokens = {}
        
        # Common token field names in response body
        token_fields = [
            'access_token', 'accessToken', 'token',
            'auth_token', 'authToken', 'jwt',
            'bearer_token', 'bearerToken', 'bearer',
            'id_token', 'idToken', 'sessionToken'
        ]
        
        # Search in response data
        for field in token_fields:
            if field in data:
                tokens['access_token'] = data[field]
                break
        
        # Search in nested data
        if 'data' in data and isinstance(data['data'], dict):
            for field in token_fields:
                if field in data['data']:
                    tokens['access_token'] = data['data'][field]
                    break
        
        # Search in user object
        if 'user' in data and isinstance(data['user'], dict):
            for field in token_fields:
                if field in data['user']:
                    tokens['user_token'] = data['user'][field]
        
        # Extract from Authorization header
        auth_header = response.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            tokens['access_token'] = auth_header.replace('Bearer ', '')
        elif auth_header.startswith('Token '):
            tokens['access_token'] = auth_header.replace('Token ', '')
        
        # Extract refresh token if present
        refresh_fields = ['refresh_token', 'refreshToken']
        for field in refresh_fields:
            if field in data:
                tokens['refresh_token'] = data[field]
                break
        
        # Store cookies as potential tokens
        if response.cookies:
            tokens['cookies'] = response.cookies.get_dict()
        
        return tokens
    
    def parse_credentials(self, credentials_str: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Parse credentials string in format email:password.
        
        Args:
            credentials_str: Credentials string
            
        Returns:
            Tuple of (email, password) or (None, None) if invalid
        """
        try:
            if ':' in credentials_str:
                parts = credentials_str.strip().split(':', 1)
                if len(parts) == 2:
                    email = parts[0].strip()
                    password = parts[1].strip()
                    
                    if email and password:
                        return email, password
            
            logger.error("Invalid credentials format. Expected: email:password")
            return None, None
        
        except Exception as e:
            logger.error(f"Error parsing credentials: {e}")
            return None, None


# Export
__all__ = ['CredentialValidator']
