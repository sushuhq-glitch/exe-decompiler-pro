'''Pattern Matching for endpoint discovery'''
import re

class PatternMatcher:
    '''Matches patterns in URLs and responses.'''
    
    def __init__(self):
        self.api_pattern = re.compile(r'/api/[a-zA-Z0-9/_-]+')
        self.version_pattern = re.compile(r'/v[0-9]+/')
    
    def is_api_url(self, url: str) -> bool:
        '''Check if URL is an API endpoint.'''
        return bool(self.api_pattern.search(url))
    
    def extract_api_paths(self, text: str) -> List[str]:
        '''Extract API paths from text.'''
        return self.api_pattern.findall(text)
