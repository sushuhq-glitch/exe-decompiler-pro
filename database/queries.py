"""
Common Database Queries
=======================

Provides reusable database query functions.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from utils.logger import get_logger

logger = get_logger(__name__)


class DatabaseQueries:
    """Common database queries."""
    
    def __init__(self, engine: AsyncEngine):
        self.engine = engine
    
    async def get_user_by_telegram_id(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        """Get user by Telegram ID."""
        async with self.engine.begin() as conn:
            result = await conn.execute(
                text("SELECT * FROM users WHERE telegram_id = :telegram_id"),
                {"telegram_id": telegram_id}
            )
            row = result.fetchone()
            return dict(row._mapping) if row else None
    
    async def create_user(self, telegram_id: int, **kwargs) -> int:
        """Create new user."""
        async with self.engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO users (telegram_id, username, first_name, last_name, language_code)
                    VALUES (:telegram_id, :username, :first_name, :last_name, :language_code)
                    RETURNING id
                """),
                {
                    "telegram_id": telegram_id,
                    "username": kwargs.get("username"),
                    "first_name": kwargs.get("first_name"),
                    "last_name": kwargs.get("last_name"),
                    "language_code": kwargs.get("language_code", "en")
                }
            )
            await conn.commit()
            return result.scalar()
    
    async def get_user_projects(self, user_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get user's projects."""
        async with self.engine.begin() as conn:
            if status:
                result = await conn.execute(
                    text("SELECT * FROM projects WHERE user_id = :user_id AND status = :status ORDER BY created_at DESC"),
                    {"user_id": user_id, "status": status}
                )
            else:
                result = await conn.execute(
                    text("SELECT * FROM projects WHERE user_id = :user_id ORDER BY created_at DESC"),
                    {"user_id": user_id}
                )
            return [dict(row._mapping) for row in result.fetchall()]
    
    async def create_project(self, user_id: int, name: str, target_url: str, **kwargs) -> int:
        """Create new project."""
        async with self.engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO projects (user_id, name, target_url, login_url, status)
                    VALUES (:user_id, :name, :target_url, :login_url, :status)
                    RETURNING id
                """),
                {
                    "user_id": user_id,
                    "name": name,
                    "target_url": target_url,
                    "login_url": kwargs.get("login_url"),
                    "status": kwargs.get("status", "pending")
                }
            )
            await conn.commit()
            return result.scalar()
    
    async def update_project_status(self, project_id: int, status: str) -> bool:
        """Update project status."""
        async with self.engine.begin() as conn:
            await conn.execute(
                text("UPDATE projects SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :project_id"),
                {"project_id": project_id, "status": status}
            )
            await conn.commit()
            return True
    
    async def get_project_endpoints(self, project_id: int, endpoint_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get project's API endpoints."""
        async with self.engine.begin() as conn:
            if endpoint_type:
                result = await conn.execute(
                    text("SELECT * FROM api_endpoints WHERE project_id = :project_id AND endpoint_type = :endpoint_type"),
                    {"project_id": project_id, "endpoint_type": endpoint_type}
                )
            else:
                result = await conn.execute(
                    text("SELECT * FROM api_endpoints WHERE project_id = :project_id"),
                    {"project_id": project_id}
                )
            return [dict(row._mapping) for row in result.fetchall()]
    
    async def save_endpoint(self, project_id: int, endpoint_type: str, url: str, method: str, **kwargs) -> int:
        """Save API endpoint."""
        async with self.engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO api_endpoints (project_id, endpoint_type, url, method, headers, payload, description)
                    VALUES (:project_id, :endpoint_type, :url, :method, :headers, :payload, :description)
                    RETURNING id
                """),
                {
                    "project_id": project_id,
                    "endpoint_type": endpoint_type,
                    "url": url,
                    "method": method,
                    "headers": kwargs.get("headers"),
                    "payload": kwargs.get("payload"),
                    "description": kwargs.get("description")
                }
            )
            await conn.commit()
            return result.scalar()
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions."""
        async with self.engine.begin() as conn:
            result = await conn.execute(
                text("DELETE FROM sessions WHERE expires_at < :now"),
                {"now": datetime.now()}
            )
            await conn.commit()
            return result.rowcount
