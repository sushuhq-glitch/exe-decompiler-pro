"""Session Model - User session management"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import json


class Session:
    """User session model."""
    
    def __init__(self, user_id: int, timeout: int = 3600):
        """Initialize session."""
        self.user_id = user_id
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.timeout = timeout
        self.data = {}
        self.state = 'active'
    
    def update(self, key: str, value: Any):
        """Update session data."""
        self.data[key] = value
        self.last_activity = datetime.now()
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get session data."""
        return self.data.get(key, default)
    
    def is_expired(self) -> bool:
        """Check if session is expired."""
        if self.state != 'active':
            return True
        
        elapsed = (datetime.now() - self.last_activity).total_seconds()
        return elapsed > self.timeout
    
    def renew(self):
        """Renew session."""
        self.last_activity = datetime.now()
        self.state = 'active'
    
    def close(self):
        """Close session."""
        self.state = 'closed'
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'timeout': self.timeout,
            'data': self.data,
            'state': self.state
        }
    
    def to_json(self) -> str:
        """Convert to JSON."""
        return json.dumps(self.to_dict(), indent=2)


__all__ = ['Session']
