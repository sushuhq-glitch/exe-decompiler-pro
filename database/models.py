"""
Database Models using SQLAlchemy
=================================

Comprehensive database models for all entities in the system.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Boolean, Float, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model for Telegram users."""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False)
    username = Column(String(255), nullable=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    language = Column(String(10), default='en')
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    last_activity = Column(DateTime, nullable=True)
    
    # Relationships
    projects = relationship('Project', back_populates='user', cascade='all, delete-orphan')
    sessions = relationship('Session', back_populates='user', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"<User(telegram_id={self.telegram_id}, username='{self.username}')>"


class Project(Base):
    """Project model for website analysis projects."""
    __tablename__ = 'projects'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.telegram_id'), nullable=False)
    name = Column(String(255), nullable=False)
    url = Column(String(1024), nullable=False)
    login_url = Column(String(1024), nullable=True)
    status = Column(String(50), default='created')
    progress = Column(Integer, default=0)
    
    # Analysis results
    forms_count = Column(Integer, default=0)
    fields_count = Column(Integer, default=0)
    endpoints_count = Column(Integer, default=0)
    analysis_data = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='projects')
    endpoints = relationship('Endpoint', back_populates='project', cascade='all, delete-orphan')
    checkers = relationship('Checker', back_populates='project', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}')>"


class Endpoint(Base):
    """Endpoint model for discovered API endpoints."""
    __tablename__ = 'endpoints'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    url = Column(String(1024), nullable=False)
    method = Column(String(10), default='GET')
    type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    tested = Column(Boolean, default=False)
    accessible = Column(Boolean, nullable=True)
    response_time = Column(Float, nullable=True)
    status_code = Column(Integer, nullable=True)
    headers = Column(JSON, nullable=True)
    body_sample = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    project = relationship('Project', back_populates='endpoints')
    
    def __repr__(self):
        return f"<Endpoint(id={self.id}, method='{self.method}', url='{self.url}')>"


class Checker(Base):
    """Checker model for generated Python checkers."""
    __tablename__ = 'checkers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    name = Column(String(255), nullable=False)
    version = Column(String(50), default='1.0.0')
    description = Column(Text, nullable=True)
    
    # Checker configuration
    threads = Column(Integer, default=10)
    timeout = Column(Integer, default=30)
    use_proxy = Column(Boolean, default=False)
    rate_limit = Column(Float, default=0.1)
    
    # Files
    main_script_path = Column(String(1024), nullable=True)
    requirements_path = Column(String(1024), nullable=True)
    readme_path = Column(String(1024), nullable=True)
    config_path = Column(String(1024), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.now)
    downloaded_count = Column(Integer, default=0)
    last_downloaded = Column(DateTime, nullable=True)
    
    # Relationships
    project = relationship('Project', back_populates='checkers')
    
    def __repr__(self):
        return f"<Checker(id={self.id}, name='{self.name}', version='{self.version}')>"


class Session(Base):
    """Session model for user sessions."""
    __tablename__ = 'sessions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.telegram_id'), nullable=False)
    session_data = Column(JSON, nullable=True)
    state = Column(String(50), default='active')
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='sessions')
    
    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, state='{self.state}')>"


class Activity(Base):
    """Activity log model."""
    __tablename__ = 'activities'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.telegram_id'), nullable=True)
    activity_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<Activity(id={self.id}, type='{self.activity_type}')>"


class APIKey(Base):
    """API key model for external service integration."""
    __tablename__ = 'api_keys'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.telegram_id'), nullable=False)
    service_name = Column(String(100), nullable=False)
    api_key = Column(String(512), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    expires_at = Column(DateTime, nullable=True)
    last_used = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<APIKey(id={self.id}, service='{self.service_name}')>"


class Statistics(Base):
    """Statistics model for tracking bot metrics."""
    __tablename__ = 'statistics'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    metadata = Column(JSON, nullable=True)
    recorded_at = Column(DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<Statistics(metric='{self.metric_name}', value={self.metric_value})>"


__all__ = [
    'Base', 'User', 'Project', 'Endpoint', 'Checker',
    'Session', 'Activity', 'APIKey', 'Statistics'
]
