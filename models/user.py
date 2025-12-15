"""User Model - Telegram user representation"""

from datetime import datetime
from typing import Dict, Any, Optional


class User:
    """User model for Telegram users."""
    
    def __init__(
        self,
        user_id: int,
        username: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ):
        """Initialize user."""
        self.user_id = user_id
        self.username = username
        self.first_name = first_name
        self.last_name = last_name
        self.language = 'en'
        self.is_admin = False
        self.is_active = True
        self.created_at = datetime.now()
        self.last_activity = None
        self.projects_count = 0
        self.checkers_generated = 0
    
    @property
    def full_name(self) -> str:
        """Get full name."""
        parts = [self.first_name, self.last_name]
        return ' '.join(p for p in parts if p)
    
    @property
    def display_name(self) -> str:
        """Get display name."""
        return self.username or self.full_name or f"User{self.user_id}"
    
    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'user_id': self.user_id,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'display_name': self.display_name,
            'language': self.language,
            'is_admin': self.is_admin,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'projects_count': self.projects_count,
            'checkers_generated': self.checkers_generated
        }


__all__ = ['User']
