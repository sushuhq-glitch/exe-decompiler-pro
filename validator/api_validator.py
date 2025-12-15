'''API Endpoint Validator'''
import logging
import requests

class APIValidator:
    '''Validates API endpoints.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def validate_endpoint(self, url: str, method: str = 'GET') -> bool:
        '''Validate if endpoint exists and is accessible.'''
        try:
            response = requests.request(method, url, timeout=5)
            return response.status_code < 500
        except:
            return False

    async def validate_api_response(self, response: Dict[str, Any]) -> bool:
        """Validate API response structure and content."""
        if not response:
            return False
        
        # Check status code
        if "status_code" not in response:
            return False
        
        status = response["status_code"]
        if not (200 <= status < 300):
            self.logger.warning(f"Invalid status code: {status}")
            return False
        
        # Check response body
        if "body" not in response or not response["body"]:
            self.logger.warning("Empty response body")
            return False
        
        return True
    
    async def validate_auth_response(self, response: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Validate authentication response and extract tokens.
        
        Args:
            response: Authentication response dictionary
        
        Returns:
            Tuple of (is_valid, extracted_tokens)
        """
        if not await self.validate_api_response(response):
            return False, None
        
        tokens = {}
        body = response.get("body", {})
        
        # Try to parse JSON body
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                self.logger.warning("Failed to parse response body as JSON")
                return False, None
        
        # Look for common token fields
        token_fields = [
            "token", "access_token", "accessToken", "auth_token", "authToken",
            "jwt", "bearer", "session", "sessionId", "session_id"
        ]
        
        for field in token_fields:
            if field in body:
                tokens[field] = body[field]
        
        # Look for refresh tokens
        refresh_fields = ["refresh_token", "refreshToken", "refresh"]
        for field in refresh_fields:
            if field in body:
                tokens[field] = body[field]
        
        # Extract from headers
        headers = response.get("headers", {})
        auth_header = headers.get("Authorization", headers.get("authorization"))
        if auth_header:
            tokens["authorization_header"] = auth_header
        
        # Extract Set-Cookie headers
        set_cookie = headers.get("Set-Cookie", headers.get("set-cookie"))
        if set_cookie:
            tokens["cookies"] = set_cookie
        
        if not tokens:
            self.logger.warning("No tokens found in response")
            return False, None
        
        return True, tokens
    
    async def validate_endpoint_accessibility(self, endpoint: str, method: str = "GET", 
                                            headers: Optional[Dict[str, str]] = None) -> bool:
        """
        Validate that an endpoint is accessible.
        
        Args:
            endpoint: API endpoint URL
            method: HTTP method
            headers: Optional headers
        
        Returns:
            True if accessible, False otherwise
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(method, endpoint, headers=headers, timeout=10) as resp:
                    return resp.status < 500
        except Exception as e:
            self.logger.error(f"Endpoint accessibility check failed: {e}")
            return False
    
    async def validate_token_format(self, token: str, token_type: str = "jwt") -> bool:
        """
        Validate token format.
        
        Args:
            token: Token string
            token_type: Type of token (jwt, bearer, session, etc.)
        
        Returns:
            True if valid format, False otherwise
        """
        if not token:
            return False
        
        if token_type.lower() == "jwt":
            # JWT should have 3 parts separated by dots
            parts = token.split(".")
            if len(parts) != 3:
                return False
            
            # Each part should be base64-encoded
            try:
                import base64
                for part in parts[:2]:  # Header and payload
                    # Add padding if necessary
                    padded = part + "=" * (4 - len(part) % 4)
                    base64.urlsafe_b64decode(padded)
                return True
            except Exception:
                return False
        
        elif token_type.lower() in ["bearer", "session"]:
            # Should be a reasonably long string
            return len(token) >= 20
        
        return True
    
    async def validate_api_structure(self, api_spec: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate API specification structure.
        
        Args:
            api_spec: API specification dictionary
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Check required fields
        required_fields = ["endpoint", "method", "description"]
        for field in required_fields:
            if field not in api_spec:
                errors.append(f"Missing required field: {field}")
        
        # Validate endpoint format
        if "endpoint" in api_spec:
            endpoint = api_spec["endpoint"]
            if not endpoint.startswith("/") and not endpoint.startswith("http"):
                errors.append(f"Invalid endpoint format: {endpoint}")
        
        # Validate HTTP method
        if "method" in api_spec:
            method = api_spec["method"].upper()
            valid_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
            if method not in valid_methods:
                errors.append(f"Invalid HTTP method: {method}")
        
        return len(errors) == 0, errors
