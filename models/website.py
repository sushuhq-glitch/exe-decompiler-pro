"""
Website Data Model
==================

Comprehensive data model for representing website information,
login pages, forms, and related metadata.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
import json


@dataclass
class Form:
    """Represents an HTML form found on a website."""
    action: str
    method: str
    fields: List[Dict[str, Any]] = field(default_factory=list)
    buttons: List[Dict[str, str]] = field(default_factory=list)
    is_login_form: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert form to dictionary."""
        return {
            'action': self.action,
            'method': self.method,
            'fields': self.fields,
            'buttons': self.buttons,
            'is_login_form': self.is_login_form
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Form':
        """Create form from dictionary."""
        return cls(
            action=data.get('action', ''),
            method=data.get('method', 'POST'),
            fields=data.get('fields', []),
            buttons=data.get('buttons', []),
            is_login_form=data.get('is_login_form', False)
        )


@dataclass
class Website:
    """Comprehensive website data model."""
    url: str
    name: Optional[str] = None
    created_at: Optional[datetime] = None
    login_url: Optional[str] = None
    forms: List[Form] = field(default_factory=list)
    meta_tags: List[Dict[str, str]] = field(default_factory=list)
    csrf_token: Optional[str] = None
    api_endpoints: List[str] = field(default_factory=list)
    cookies: List[Dict[str, str]] = field(default_factory=list)
    headers: Dict[str, str] = field(default_factory=dict)
    status: str = 'created'
    
    def __post_init__(self):
        """Post initialization processing."""
        if self.name is None:
            self.name = self.url
        if self.created_at is None:
            self.created_at = datetime.now()
    
    def add_form(self, form: Form):
        """Add a form to the website."""
        self.forms.append(form)
    
    def get_login_form(self) -> Optional[Form]:
        """Get the login form if one exists."""
        for form in self.forms:
            if form.is_login_form:
                return form
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert website to dictionary."""
        return {
            'url': self.url,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'login_url': self.login_url,
            'forms': [f.to_dict() for f in self.forms],
            'meta_tags': self.meta_tags,
            'csrf_token': self.csrf_token,
            'api_endpoints': self.api_endpoints,
            'cookies': self.cookies,
            'headers': self.headers,
            'status': self.status
        }
    
    def to_json(self) -> str:
        """Convert website to JSON string."""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Website':
        """Create website from dictionary."""
        created_at = None
        if 'created_at' in data and data['created_at']:
            created_at = datetime.fromisoformat(data['created_at'])
        
        forms = [Form.from_dict(f) for f in data.get('forms', [])]
        
        return cls(
            url=data.get('url', ''),
            name=data.get('name'),
            created_at=created_at,
            login_url=data.get('login_url'),
            forms=forms,
            meta_tags=data.get('meta_tags', []),
            csrf_token=data.get('csrf_token'),
            api_endpoints=data.get('api_endpoints', []),
            cookies=data.get('cookies', []),
            headers=data.get('headers', {}),
            status=data.get('status', 'created')
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Website':
        """Create website from JSON string."""
        data = json.loads(json_str)
        return cls.from_dict(data)


__all__ = ['Website', 'Form']
