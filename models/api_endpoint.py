"""API Endpoint Model - Comprehensive endpoint representation"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
from datetime import datetime
import json


@dataclass
class APIEndpoint:
    """Comprehensive API endpoint model."""
    url: str
    method: str
    endpoint_type: str
    description: Optional[str] = None
    tested: bool = False
    accessible: Optional[bool] = None
    response_time: Optional[float] = None
    status_code: Optional[int] = None
    headers: Dict[str, str] = field(default_factory=dict)
    body_sample: Optional[str] = None
    requires_auth: bool = True
    auth_type: Optional[str] = None
    discovered_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'url': self.url,
            'method': self.method,
            'type': self.endpoint_type,
            'description': self.description,
            'tested': self.tested,
            'accessible': self.accessible,
            'response_time': self.response_time,
            'status_code': self.status_code,
            'headers': self.headers,
            'body_sample': self.body_sample,
            'requires_auth': self.requires_auth,
            'auth_type': self.auth_type,
            'discovered_at': self.discovered_at.isoformat()
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'APIEndpoint':
        """Create from dictionary."""
        discovered_at = datetime.now()
        if 'discovered_at' in data:
            discovered_at = datetime.fromisoformat(data['discovered_at'])
        
        return cls(
            url=data['url'],
            method=data['method'],
            endpoint_type=data.get('type', 'unknown'),
            description=data.get('description'),
            tested=data.get('tested', False),
            accessible=data.get('accessible'),
            response_time=data.get('response_time'),
            status_code=data.get('status_code'),
            headers=data.get('headers', {}),
            body_sample=data.get('body_sample'),
            requires_auth=data.get('requires_auth', True),
            auth_type=data.get('auth_type'),
            discovered_at=discovered_at
        )


__all__ = ['APIEndpoint']
