"""Request/Response Logger"""
import logging
import json
from datetime import datetime
from pathlib import Path

class RequestLogger:
    """Logs HTTP requests and responses."""
    
    def __init__(self, log_dir: str = "./logs/requests"):
        self.logger = logging.getLogger(__name__)
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
    
    def log_request(self, request: dict):
        """Log HTTP request."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.log_dir / f"request_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(request, f, indent=2)
        
        self.logger.debug(f"Logged request to {filename}")
    
    def log_response(self, response: dict):
        """Log HTTP response."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.log_dir / f"response_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(response, f, indent=2)
        
        self.logger.debug(f"Logged response to {filename}")
