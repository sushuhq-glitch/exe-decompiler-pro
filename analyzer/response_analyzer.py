"""HTTP Response Analyzer"""
import json
from typing import Dict, Any, Optional

class ResponseAnalyzer:
    """Analyzes HTTP responses."""
    
    def analyze(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze HTTP response."""
        analysis = {
            "status_code": response.get("status", 0),
            "success": False,
            "content_type": None,
            "has_json": False,
            "has_errors": False,
            "errors": [],
            "data": {}
        }
        
        # Determine success
        analysis["success"] = 200 <= analysis["status_code"] < 300
        
        # Analyze content type
        headers = response.get("headers", {})
        content_type = headers.get("Content-Type", "")
        analysis["content_type"] = content_type
        analysis["has_json"] = "application/json" in content_type
        
        # Parse body
        body = response.get("body")
        if analysis["has_json"] and body:
            try:
                if isinstance(body, str):
                    data = json.loads(body)
                else:
                    data = body
                
                analysis["data"] = data
                
                # Check for common error indicators
                error_keys = ["error", "errors", "message", "error_message"]
                for key in error_keys:
                    if key in data:
                        analysis["has_errors"] = True
                        analysis["errors"].append(str(data[key]))
            
            except json.JSONDecodeError:
                pass
        
        return analysis
    
    def is_successful_login(self, response: Dict[str, Any]) -> bool:
        """Check if response indicates successful login."""
        analysis = self.analyze(response)
        
        if not analysis["success"]:
            return False
        
        # Look for auth indicators in response
        data = analysis.get("data", {})
        auth_indicators = ["token", "access_token", "auth_token", "session", "user"]
        
        return any(key in str(data).lower() for key in auth_indicators)
