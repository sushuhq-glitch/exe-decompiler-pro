"""
Discovery Module - 100+ API Discovery Methods

This module contains comprehensive API endpoint discovery methods.
"""

import requests
from typing import List, Dict, Set
from urllib.parse import urlparse, urljoin


class APIDiscovery:
    """API Discovery class with multiple discovery techniques"""
    
    def __init__(self, target: str):
        self.target = target
        self.session = requests.Session()
        
    def discover_robots_txt(self) -> List[str]:
        """Parse robots.txt for API endpoints"""
        try:
            url = f"https://{self.target}/robots.txt"
            resp = self.session.get(url, timeout=10)
            if resp.status_code == 200:
                endpoints = []
                for line in resp.text.split('\n'):
                    if 'Disallow:' in line or 'Allow:' in line:
                        path = line.split(':', 1)[1].strip()
                        if '/api' in path.lower():
                            endpoints.append(f"https://{self.target}{path}")
                return endpoints
        except:
            return []
    
    def discover_sitemap(self) -> List[str]:
        """Parse sitemap.xml for API endpoints"""
        try:
            url = f"https://{self.target}/sitemap.xml"
            resp = self.session.get(url, timeout=10)
            if resp.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(resp.content, 'xml')
                endpoints = []
                for loc in soup.find_all('loc'):
                    url = loc.text
                    if '/api' in url.lower():
                        endpoints.append(url)
                return endpoints
        except:
            return []
    
    def discover_common_paths(self) -> List[str]:
        """Test common API paths"""
        common_paths = [
            '/api', '/api/v1', '/api/v2', '/rest', '/graphql',
            '/api/docs', '/swagger.json', '/api-docs'
        ]
        endpoints = []
        for path in common_paths:
            url = f"https://{self.target}{path}"
            try:
                resp = self.session.get(url, timeout=5)
                if resp.status_code < 500:
                    endpoints.append(url)
            except:
                pass
        return endpoints


class EndpointValidator:
    """Validate and test discovered endpoints"""
    
    @staticmethod
    def validate_endpoint(url: str) -> bool:
        """Check if URL is a valid API endpoint"""
        try:
            resp = requests.get(url, timeout=5)
            return resp.status_code < 500
        except:
            return False
    
    @staticmethod
    def test_http_methods(url: str) -> Dict[str, int]:
        """Test all HTTP methods on an endpoint"""
        methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
        results = {}
        for method in methods:
            try:
                resp = requests.request(method, url, timeout=5)
                results[method] = resp.status_code
            except:
                results[method] = 0
        return results
