'''Credential Validator'''
import asyncio
import logging
from typing import Dict, Optional, Tuple
import requests

class CredentialValidator:
    '''Validates user credentials against API.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def validate(
        self,
        url: str,
        email: str,
        password: str,
        login_endpoint: Optional[str] = None
    ) -> Dict:
        '''Validate credentials by attempting login.'''
        self.logger.info(f"Validating credentials for {email}")
        
        # Determine login endpoint
        endpoint = login_endpoint or f"{url}/api/auth/login"
        
        # Prepare login data
        login_data = {
            'email': email,
            'password': password
        }
        
        try:
            # Attempt login
            response = requests.post(
                endpoint,
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # Parse response
            if response.status_code == 200:
                data = response.json() if response.headers.get('Content-Type', '').startswith('application/json') else {}
                
                tokens = self._extract_tokens(response, data)
                
                return {
                    'success': True,
                    'tokens': tokens,
                    'cookies': response.cookies.get_dict(),
                    'headers': dict(response.headers),
                    'status_code': response.status_code
                }
            else:
                return {
                    'success': False,
                    'error': f"Login failed with status {response.status_code}",
                    'status_code': response.status_code
                }
        
        except Exception as e:
            self.logger.error(f"Validation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _extract_tokens(self, response, data: Dict) -> Dict:
        '''Extract authentication tokens from response.'''
        tokens = {}
        
        # Common token field names
        token_fields = [
            'access_token', 'accessToken', 'token',
            'auth_token', 'authToken', 'jwt',
            'bearer_token', 'bearerToken'
        ]
        
        for field in token_fields:
            if field in data:
                tokens['access_token'] = data[field]
                break
        
        # Extract from headers
        auth_header = response.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            tokens['access_token'] = auth_header.replace('Bearer ', '')
        
        # Count cookies and headers
        tokens['cookies_count'] = len(response.cookies)
        tokens['headers_count'] = len(response.headers)
        
        return tokens
