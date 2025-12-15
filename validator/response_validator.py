'''Response Validator'''
import logging

class ResponseValidator:
    '''Validates API responses.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def validate(self, response: Dict) -> bool:
        '''Validate response structure.'''
        return 'status' in response and 'body' in response
