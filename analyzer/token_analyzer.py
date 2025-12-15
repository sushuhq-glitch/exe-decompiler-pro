"""Token and Cookie Analyzer"""
import re
import json
import base64
from typing import Dict, Any, List, Optional

class TokenAnalyzer:
    """Analyzes and extracts tokens and cookies."""
    
    def __init__(self):
        self.jwt_pattern = re.compile(r'[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*')
        self.bearer_pattern = re.compile(r'Bearer\s+([A-Za-z0-9-_.+/=]+)')
    
    def analyze_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze HTTP response for tokens."""
        tokens = {
            "jwt_tokens": [],
            "bearer_tokens": [],
            "cookies": [],
            "custom_tokens": [],
            "csrf_tokens": []
        }
        
        # Extract from headers
        headers = response.get("headers", {})
        tokens["bearer_tokens"].extend(self._extract_bearer_tokens(headers))
        tokens["cookies"].extend(self._extract_cookies(headers))
        
        # Extract from body
        body = response.get("body", "")
        if isinstance(body, str):
            tokens["jwt_tokens"].extend(self._extract_jwt_tokens(body))
        elif isinstance(body, dict):
            tokens["jwt_tokens"].extend(self._extract_jwt_from_json(body))
        
        return tokens
    
    def _extract_bearer_tokens(self, headers: Dict) -> List[str]:
        """Extract Bearer tokens from headers."""
        tokens = []
        auth_header = headers.get("Authorization", "")
        if auth_header:
            match = self.bearer_pattern.search(auth_header)
            if match:
                tokens.append(match.group(1))
        return tokens
    
    def _extract_cookies(self, headers: Dict) -> List[Dict]:
        """Extract cookies from headers."""
        cookies = []
        set_cookie = headers.get("Set-Cookie", "")
        if set_cookie:
            for cookie in set_cookie.split(";"):
                if "=" in cookie:
                    name, value = cookie.split("=", 1)
                    cookies.append({"name": name.strip(), "value": value.strip()})
        return cookies
    
    def _extract_jwt_tokens(self, text: str) -> List[str]:
        """Extract JWT tokens from text."""
        return self.jwt_pattern.findall(text)
    
    def _extract_jwt_from_json(self, data: Dict) -> List[str]:
        """Recursively extract JWT tokens from JSON."""
        tokens = []
        for key, value in data.items():
            if isinstance(value, str):
                tokens.extend(self._extract_jwt_tokens(value))
            elif isinstance(value, dict):
                tokens.extend(self._extract_jwt_from_json(value))
        return tokens
    
    def decode_jwt(self, token: str) -> Optional[Dict]:
        """Decode JWT token."""
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return None
            
            # Decode payload
            payload = parts[1]
            # Add padding if needed
            padding = 4 - len(payload) % 4
            if padding != 4:
                payload += '=' * padding
            
            decoded = base64.urlsafe_b64decode(payload)
            return json.loads(decoded)
        except:
            return None
