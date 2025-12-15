"""
Project Model - Complete project representation
================================================

This module provides a comprehensive model for representing
analysis projects, including all metadata, endpoints, and status tracking.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum
import json


class ProjectStatus(Enum):
    """Project status enumeration."""
    CREATED = 'created'
    ANALYZING = 'analyzing'
    ANALYZED = 'analyzed'
    VALIDATING = 'validating'
    VALIDATED = 'validated'
    DISCOVERING = 'discovering'
    DISCOVERED = 'discovered'
    GENERATING = 'generating'
    COMPLETE = 'complete'
    FAILED = 'failed'


class Project:
    """
    Comprehensive project model.
    
    Represents a complete website analysis project with all
    discovered endpoints, tokens, and generated checkers.
    """
    
    def __init__(
        self,
        name: str,
        url: str,
        user_id: Optional[int] = None
    ):
        """
        Initialize a new project.
        
        Args:
            name: Project name
            url: Target website URL
            user_id: Owner user ID
        """
        self.name = name
        self.url = url
        self.user_id = user_id
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.completed_at: Optional[datetime] = None
        
        # Status tracking
        self.status = ProjectStatus.CREATED
        self.progress = 0
        
        # Analysis results
        self.login_url: Optional[str] = None
        self.forms: List[Dict] = []
        self.endpoints: List[Dict] = []
        self.tokens: Dict[str, Any] = {}
        self.cookies: List[Dict] = []
        self.headers: Dict[str, str] = {}
        
        # Discovery results
        self.profile_endpoints: List[Dict] = []
        self.payment_endpoints: List[Dict] = []
        self.order_endpoints: List[Dict] = []
        self.address_endpoints: List[Dict] = []
        self.wallet_endpoints: List[Dict] = []
        
        # Generated files
        self.checker_path: Optional[str] = None
        self.requirements_path: Optional[str] = None
        self.readme_path: Optional[str] = None
        self.config_path: Optional[str] = None
        
        # Statistics
        self.analysis_duration: Optional[float] = None
        self.validation_attempts: int = 0
        self.endpoints_discovered: int = 0
        self.generation_duration: Optional[float] = None
    
    def update_status(self, status: ProjectStatus):
        """Update project status."""
        self.status = status
        self.updated_at = datetime.now()
        
        if status == ProjectStatus.COMPLETE:
            self.completed_at = datetime.now()
            self.progress = 100
    
    def update_progress(self, progress: int):
        """Update project progress (0-100)."""
        self.progress = max(0, min(100, progress))
        self.updated_at = datetime.now()
    
    def add_endpoint(self, endpoint: Dict):
        """Add discovered endpoint."""
        self.endpoints.append(endpoint)
        self.endpoints_discovered = len(self.endpoints)
        self.updated_at = datetime.now()
        
        # Categorize endpoint
        endpoint_type = endpoint.get('type', '')
        if 'profile' in endpoint_type:
            self.profile_endpoints.append(endpoint)
        elif 'payment' in endpoint_type:
            self.payment_endpoints.append(endpoint)
        elif 'order' in endpoint_type:
            self.order_endpoints.append(endpoint)
        elif 'address' in endpoint_type:
            self.address_endpoints.append(endpoint)
        elif 'wallet' in endpoint_type:
            self.wallet_endpoints.append(endpoint)
    
    def set_analysis_results(
        self,
        login_url: str,
        forms: List[Dict],
        tokens: Dict,
        duration: float
    ):
        """Set analysis results."""
        self.login_url = login_url
        self.forms = forms
        self.tokens = tokens
        self.analysis_duration = duration
        self.updated_at = datetime.now()
    
    def set_generated_files(
        self,
        checker_path: str,
        requirements_path: str,
        readme_path: str,
        config_path: str
    ):
        """Set generated file paths."""
        self.checker_path = checker_path
        self.requirements_path = requirements_path
        self.readme_path = readme_path
        self.config_path = config_path
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert project to dictionary."""
        return {
            'name': self.name,
            'url': self.url,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'status': self.status.value,
            'progress': self.progress,
            'login_url': self.login_url,
            'forms': self.forms,
            'endpoints': self.endpoints,
            'tokens': self.tokens,
            'cookies': self.cookies,
            'headers': self.headers,
            'profile_endpoints': self.profile_endpoints,
            'payment_endpoints': self.payment_endpoints,
            'order_endpoints': self.order_endpoints,
            'address_endpoints': self.address_endpoints,
            'wallet_endpoints': self.wallet_endpoints,
            'checker_path': self.checker_path,
            'requirements_path': self.requirements_path,
            'readme_path': self.readme_path,
            'config_path': self.config_path,
            'statistics': {
                'analysis_duration': self.analysis_duration,
                'validation_attempts': self.validation_attempts,
                'endpoints_discovered': self.endpoints_discovered,
                'generation_duration': self.generation_duration
            }
        }
    
    def to_json(self) -> str:
        """Convert project to JSON string."""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Project':
        """Create project from dictionary."""
        project = cls(
            name=data['name'],
            url=data['url'],
            user_id=data.get('user_id')
        )
        
        project.created_at = datetime.fromisoformat(data['created_at'])
        project.updated_at = datetime.fromisoformat(data['updated_at'])
        
        if data.get('completed_at'):
            project.completed_at = datetime.fromisoformat(data['completed_at'])
        
        project.status = ProjectStatus(data.get('status', 'created'))
        project.progress = data.get('progress', 0)
        project.login_url = data.get('login_url')
        project.forms = data.get('forms', [])
        project.endpoints = data.get('endpoints', [])
        project.tokens = data.get('tokens', {})
        project.cookies = data.get('cookies', [])
        project.headers = data.get('headers', {})
        
        project.profile_endpoints = data.get('profile_endpoints', [])
        project.payment_endpoints = data.get('payment_endpoints', [])
        project.order_endpoints = data.get('order_endpoints', [])
        project.address_endpoints = data.get('address_endpoints', [])
        project.wallet_endpoints = data.get('wallet_endpoints', [])
        
        project.checker_path = data.get('checker_path')
        project.requirements_path = data.get('requirements_path')
        project.readme_path = data.get('readme_path')
        project.config_path = data.get('config_path')
        
        stats = data.get('statistics', {})
        project.analysis_duration = stats.get('analysis_duration')
        project.validation_attempts = stats.get('validation_attempts', 0)
        project.endpoints_discovered = stats.get('endpoints_discovered', 0)
        project.generation_duration = stats.get('generation_duration')
        
        return project
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Project':
        """Create project from JSON string."""
        data = json.loads(json_str)
        return cls.from_dict(data)
    
    def get_summary(self) -> str:
        """Get project summary."""
        return f"""
Project: {self.name}
URL: {self.url}
Status: {self.status.value}
Progress: {self.progress}%
Endpoints Discovered: {self.endpoints_discovered}
Forms Found: {len(self.forms)}
Generated Files: {'Yes' if self.checker_path else 'No'}
        """.strip()


__all__ = ['Project', 'ProjectStatus']
