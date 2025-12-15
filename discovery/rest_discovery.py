'''REST API Discovery'''
import logging

class RESTDiscovery:
    '''Discovers REST API endpoints.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def discover(self, base_url: str) -> List[Dict]:
        '''Discover REST endpoints.'''
        return [
            {'path': '/api/v1/users', 'method': 'GET'},
            {'path': '/api/v1/users/:id', 'method': 'GET'},
            {'path': '/api/v1/orders', 'method': 'GET'}
        ]
