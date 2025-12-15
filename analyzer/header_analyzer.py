"""HTTP Header Analyzer"""
from typing import Dict, List

class HeaderAnalyzer:
    """Analyzes HTTP headers."""
    
    def analyze(self, headers: Dict[str, str]) -> Dict:
        """Analyze HTTP headers."""
        analysis = {
            "security_headers": self._check_security_headers(headers),
            "cors_enabled": self._check_cors(headers),
            "custom_headers": self._find_custom_headers(headers),
            "auth_headers": self._find_auth_headers(headers)
        }
        return analysis
    
    def _check_security_headers(self, headers: Dict) -> List[str]:
        """Check for security headers."""
        security_headers = [
            "X-Frame-Options", "X-Content-Type-Options",
            "X-XSS-Protection", "Strict-Transport-Security",
            "Content-Security-Policy"
        ]
        return [h for h in security_headers if h in headers]
    
    def _check_cors(self, headers: Dict) -> bool:
        """Check if CORS is enabled."""
        return "Access-Control-Allow-Origin" in headers
    
    def _find_custom_headers(self, headers: Dict) -> List[str]:
        """Find custom headers (starting with X-)."""
        return [k for k in headers.keys() if k.startswith("X-")]
    
    def _find_auth_headers(self, headers: Dict) -> List[str]:
        """Find authentication-related headers."""
        auth_keywords = ["auth", "token", "key", "session"]
        return [
            k for k in headers.keys()
            if any(keyword in k.lower() for keyword in auth_keywords)
        ]
