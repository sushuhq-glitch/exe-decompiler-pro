'''Advanced Endpoint Scanner'''
import asyncio
import logging
from typing import Dict, List, Optional
import requests

class EndpointScanner:
    '''Scans and tests API endpoints.'''
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.timeout = 10
    
    async def scan(
        self,
        endpoints: List[str],
        auth_headers: Optional[Dict] = None
    ) -> List[Dict]:
        '''Scan multiple endpoints.'''
        results = []
        
        for endpoint in endpoints:
            result = await self._scan_single(endpoint, auth_headers)
            results.append(result)
        
        return results
    
    async def _scan_single(
        self,
        endpoint: str,
        auth_headers: Optional[Dict] = None
    ) -> Dict:
        '''Scan a single endpoint.'''
        try:
            response = requests.get(
                endpoint,
                headers=auth_headers or {},
                timeout=self.timeout
            )
            
            return {
                'endpoint': endpoint,
                'status': response.status_code,
                'accessible': 200 <= response.status_code < 300,
                'response_time': response.elapsed.total_seconds(),
                'content_type': response.headers.get('Content-Type', ''),
                'size': len(response.content)
            }
        
        except Exception as e:
            self.logger.error(f"Scan failed for {endpoint}: {e}")
            return {
                'endpoint': endpoint,
                'accessible': False,
                'error': str(e)
            }
    
    async def test_authentication(
        self,
        endpoint: str,
        tokens: Dict
    ) -> bool:
        '''Test if authentication works.'''
        headers = {'Authorization': f"Bearer {tokens.get('access_token', '')}"}
        
        try:
            response = requests.get(endpoint, headers=headers, timeout=self.timeout)
            return response.status_code == 200
        except:
            return False

    async def scan_for_hidden_endpoints(self, base_url: str) -> List[str]:
        """
        Scan for hidden or undocumented endpoints.
        
        Args:
            base_url: Base URL to scan
        
        Returns:
            List of discovered endpoints
        """
        endpoints = []
        
        # Common hidden endpoints
        hidden_paths = [
            "/api/internal", "/api/admin", "/api/debug", "/api/test",
            "/internal", "/admin", "/debug", "/test", "/dev",
            "/.well-known", "/health", "/status", "/metrics",
            "/api/v1", "/api/v2", "/api/v3", "/v1", "/v2", "/v3"
        ]
        
        for path in hidden_paths:
            url = urljoin(base_url, path)
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, timeout=5) as resp:
                        if resp.status < 500:
                            endpoints.append(url)
                            self.logger.info(f"Found hidden endpoint: {url}")
            except Exception:
                continue
        
        return endpoints
    
    async def scan_rest_patterns(self, base_url: str, resource: str) -> Dict[str, Any]:
        """
        Scan for RESTful API patterns.
        
        Args:
            base_url: Base API URL
            resource: Resource name (e.g., "users", "products")
        
        Returns:
            Dictionary of discovered endpoints
        """
        patterns = {
            "list": f"{base_url}/{resource}",
            "create": f"{base_url}/{resource}",
            "read": f"{base_url}/{resource}/{{id}}",
            "update": f"{base_url}/{resource}/{{id}}",
            "delete": f"{base_url}/{resource}/{{id}}",
            "search": f"{base_url}/{resource}/search",
            "batch": f"{base_url}/{resource}/batch"
        }
        
        discovered = {}
        
        for operation, endpoint in patterns.items():
            method = "GET" if operation in ["list", "read", "search"] else "POST"
            if operation == "update":
                method = "PUT"
            elif operation == "delete":
                method = "DELETE"
            
            # Test endpoint
            test_endpoint = endpoint.replace("{id}", "1")
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.request(method, test_endpoint, timeout=5) as resp:
                        if resp.status < 500:
                            discovered[operation] = {
                                "endpoint": endpoint,
                                "method": method,
                                "status": resp.status
                            }
            except Exception:
                continue
        
        return discovered
    
    async def scan_graphql_introspection(self, graphql_endpoint: str) -> Dict[str, Any]:
        """
        Perform GraphQL introspection query.
        
        Args:
            graphql_endpoint: GraphQL endpoint URL
        
        Returns:
            Dictionary of schema information
        """
        introspection_query = {
            "query": """
            {
                __schema {
                    types {
                        name
                        kind
                        description
                    }
                    queryType {
                        name
                        fields {
                            name
                            description
                            type {
                                name
                            }
                        }
                    }
                    mutationType {
                        name
                        fields {
                            name
                            description
                            type {
                                name
                            }
                        }
                    }
                }
            }
            """
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(graphql_endpoint, json=introspection_query, timeout=10) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("data", {}).get("__schema", {})
        except Exception as e:
            self.logger.error(f"GraphQL introspection failed: {e}")
        
        return {}
    
    async def fuzz_parameters(self, endpoint: str, method: str = "GET",
                            base_params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Fuzz endpoint parameters to discover additional functionality.
        
        Args:
            endpoint: Endpoint URL
            method: HTTP method
            base_params: Base parameters to fuzz
        
        Returns:
            List of interesting findings
        """
        findings = []
        base_params = base_params or {}
        
        # Common parameter names to try
        test_params = [
            "id", "limit", "offset", "page", "per_page", "sort", "order",
            "filter", "search", "q", "query", "include", "fields", "expand"
        ]
        
        for param in test_params:
            test_params_dict = base_params.copy()
            test_params_dict[param] = "test"
            
            try:
                async with aiohttp.ClientSession() as session:
                    if method.upper() == "GET":
                        async with session.get(endpoint, params=test_params_dict, timeout=5) as resp:
                            if resp.status < 400:
                                findings.append({
                                    "param": param,
                                    "status": resp.status,
                                    "response_size": len(await resp.text())
                                })
            except Exception:
                continue
        
        return findings
