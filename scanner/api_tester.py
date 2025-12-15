'''API Endpoint Tester'''
import logging
import requests
from typing import Dict, Any

class APITester:
    '''Tests API endpoints with various methods.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def test_endpoint(
        self,
        url: str,
        method: str,
        headers: Dict = None,
        data: Any = None
    ) -> Dict:
        '''Test an API endpoint.'''
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers or {},
                json=data if method in ['POST', 'PUT', 'PATCH'] else None,
                timeout=10
            )
            
            return {
                'success': 200 <= response.status_code < 300,
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds(),
                'headers': dict(response.headers),
                'body': response.text[:1000]  # First 1000 chars
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
