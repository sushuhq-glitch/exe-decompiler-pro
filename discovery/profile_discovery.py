'''Profile Endpoint Discovery'''
import logging
from typing import Dict, List

class ProfileDiscovery:
    '''Discovers profile-related API endpoints.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.profile_patterns = [
            '/api/user',
            '/api/profile',
            '/api/me',
            '/api/account',
            '/user/profile',
            '/profile/me'
        ]
    
    async def discover(self, base_url: str, tokens: Dict) -> List[Dict]:
        '''Discover profile endpoints.'''
        endpoints = []
        
        for pattern in self.profile_patterns:
            endpoint = {
                'path': pattern,
                'method': 'GET',
                'type': 'profile',
                'description': 'User profile data'
            }
            endpoints.append(endpoint)
        
        return endpoints

    async def discover_user_endpoints(self, base_url: str, session_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Discover user profile-related endpoints.
        
        Args:
            base_url: Base URL
            session_data: Session/auth data
        
        Returns:
            List of discovered endpoints
        """
        endpoints = []
        
        # Common profile endpoint patterns
        patterns = [
            "/api/user", "/api/users/me", "/api/profile", "/api/account",
            "/api/me", "/api/user/profile", "/api/account/profile",
            "/user", "/profile", "/account", "/me",
            "/api/v1/user", "/api/v1/profile", "/api/v1/me"
        ]
        
        headers = self._build_auth_headers(session_data)
        
        for pattern in patterns:
            url = urljoin(base_url, pattern)
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers, timeout=5) as resp:
                        if 200 <= resp.status < 300:
                            data = await resp.json()
                            endpoints.append({
                                "endpoint": url,
                                "method": "GET",
                                "type": "profile",
                                "status": resp.status,
                                "fields": list(data.keys()) if isinstance(data, dict) else []
                            })
                            self.logger.info(f"Found profile endpoint: {url}")
            except Exception as e:
                continue
        
        return endpoints
    
    async def discover_settings_endpoints(self, base_url: str, session_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Discover user settings endpoints.
        
        Args:
            base_url: Base URL
            session_data: Session/auth data
        
        Returns:
            List of discovered endpoints
        """
        endpoints = []
        
        patterns = [
            "/api/settings", "/api/user/settings", "/api/account/settings",
            "/api/preferences", "/api/user/preferences",
            "/settings", "/preferences",
            "/api/v1/settings", "/api/v1/preferences"
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
                                "type": "settings",
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
