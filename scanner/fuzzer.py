'''API Fuzzer for endpoint discovery'''
import logging

class APIFuzzer:
    '''Fuzzes API endpoints to find hidden resources.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.common_paths = [
            'users', 'user', 'profile', 'account',
            'orders', 'order', 'payment', 'billing',
            'addresses', 'address', 'wallet', 'balance'
        ]
    
    async def fuzz(self, base_url: str) -> List[str]:
        '''Fuzz for additional endpoints.'''
        candidates = []
        
        for path in self.common_paths:
            candidates.append(f"{base_url}/api/{path}")
            candidates.append(f"{base_url}/api/v1/{path}")
            candidates.append(f"{base_url}/api/v2/{path}")
        
        return candidates
