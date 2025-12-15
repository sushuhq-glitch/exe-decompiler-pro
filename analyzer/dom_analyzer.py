"""DOM Analyzer"""
import re
from typing import Dict, List

class DOMAnalyzer:
    """Analyzes DOM structure and JavaScript."""
    
    def analyze(self, html: str) -> Dict:
        """Analyze DOM structure."""
        analysis = {
            "scripts": self._extract_scripts(html),
            "api_calls": self._find_api_calls(html),
            "endpoints": self._extract_endpoints(html)
        }
        return analysis
    
    def _extract_scripts(self, html: str) -> List[str]:
        """Extract JavaScript from HTML."""
        pattern = r'<script[^>]*>(.*?)</script>'
        return re.findall(pattern, html, re.DOTALL)
    
    def _find_api_calls(self, html: str) -> List[str]:
        """Find API calls in JavaScript."""
        patterns = [
            r'fetch\(['"]([^'"]+)['"]',
            r'\.get\(['"]([^'"]+)['"]',
            r'\.post\(['"]([^'"]+)['"]',
            r'axios\.[a-z]+\(['"]([^'"]+)['"]'
        ]
        
        api_calls = []
        for pattern in patterns:
            api_calls.extend(re.findall(pattern, html))
        
        return list(set(api_calls))
    
    def _extract_endpoints(self, html: str) -> List[str]:
        """Extract API endpoints from HTML."""
        pattern = r'['"]/(api|v1|v2|v3|graphql|rest)/[a-zA-Z0-9/_-]+['"]'
        return list(set(re.findall(pattern, html)))
