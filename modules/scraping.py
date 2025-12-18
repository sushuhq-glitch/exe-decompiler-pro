"""
Scraping Module - Web Scraping and Crawling

This module implements deep web scraping and crawling techniques.
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import List, Set


class WebCrawler:
    """Deep web crawler for API discovery"""
    
    def __init__(self, target: str, max_depth: int = 3):
        self.target = target
        self.max_depth = max_depth
        self.visited = set()
        self.session = requests.Session()
    
    def crawl(self, url: str = None, depth: int = 0) -> List[str]:
        """Recursively crawl website for API endpoints"""
        if url is None:
            url = f"https://{self.target}"
        
        if depth > self.max_depth or url in self.visited:
            return []
        
        self.visited.add(url)
        found_apis = []
        
        try:
            resp = self.session.get(url, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.content, 'html.parser')
                
                # Extract links
                for link in soup.find_all('a', href=True):
                    href = urljoin(url, link['href'])
                    if '/api' in href.lower():
                        found_apis.append(href)
                    
                    # Recursive crawl
                    if href.startswith(f"https://{self.target}"):
                        found_apis.extend(self.crawl(href, depth + 1))
        except:
            pass
        
        return found_apis


class JavaScriptAnalyzer:
    """Analyze JavaScript files for API endpoints"""
    
    @staticmethod
    def extract_endpoints(js_content: str) -> List[str]:
        """Extract API endpoints from JavaScript code"""
        import re
        
        patterns = [
            r'["\']([/\w\-]+/api[/\w\-]*)["\']',
            r'["\']([/\w\-]+/v\d+[/\w\-]*)["\']',
            r'apiUrl\s*[:=]\s*["\']([^"\']+)["\']',
            r'endpoint\s*[:=]\s*["\']([^"\']+)["\']'
        ]
        
        endpoints = []
        for pattern in patterns:
            matches = re.findall(pattern, js_content)
            endpoints.extend(matches)
        
        return list(set(endpoints))


class DNSEnumerator:
    """DNS enumeration for subdomain discovery"""
    
    @staticmethod
    def enumerate_subdomains(domain: str) -> List[str]:
        """Enumerate subdomains using DNS"""
        try:
            import dns.resolver
            
            subdomains = ['api', 'api-v1', 'rest', 'graphql', 'ws']
            found = []
            
            for sub in subdomains:
                try:
                    full_domain = f"{sub}.{domain}"
                    answers = dns.resolver.resolve(full_domain, 'A')
                    if answers:
                        found.append(full_domain)
                except:
                    pass
            
            return found
        except ImportError:
            return []
