"""
Database Migrations Manager
===========================

Handles database schema migrations and versioning.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import json

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from utils.logger import get_logger

logger = get_logger(__name__)


class Migration:
    """Represents a single database migration."""
    
    def __init__(self, version: int, name: str, up_sql: str, down_sql: str):
        self.version = version
        self.name = name
        self.up_sql = up_sql
        self.down_sql = down_sql
        self.applied_at: Optional[datetime] = None
    
    def __repr__(self):
        return f"Migration(version={self.version}, name={self.name})"


class MigrationManager:
    """
    Manages database migrations with versioning.
    
    Features:
    - Version tracking
    - Forward migrations (upgrade)
    - Backward migrations (downgrade)
    - Migration history
    - Automatic rollback on failure
    """
    
    # Define all migrations
    MIGRATIONS = [
        Migration(
            version=1,
            name="create_users_table",
            up_sql="""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id INTEGER UNIQUE NOT NULL,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    language_code TEXT DEFAULT 'en',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX idx_users_telegram_id ON users(telegram_id);
            """,
            down_sql="DROP TABLE IF EXISTS users;"
        ),
        Migration(
            version=2,
            name="create_projects_table",
            up_sql="""
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    target_url TEXT NOT NULL,
                    login_url TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_projects_user_id ON projects(user_id);
                CREATE INDEX idx_projects_status ON projects(status);
            """,
            down_sql="DROP TABLE IF EXISTS projects;"
        ),
        Migration(
            version=3,
            name="create_api_endpoints_table",
            up_sql="""
                CREATE TABLE IF NOT EXISTS api_endpoints (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL,
                    endpoint_type TEXT NOT NULL,
                    url TEXT NOT NULL,
                    method TEXT NOT NULL,
                    headers TEXT,
                    payload TEXT,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_endpoints_project_id ON api_endpoints(project_id);
                CREATE INDEX idx_endpoints_type ON api_endpoints(endpoint_type);
            """,
            down_sql="DROP TABLE IF EXISTS api_endpoints;"
        ),
        Migration(
            version=4,
            name="create_sessions_table",
            up_sql="""
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    project_id INTEGER,
                    session_data TEXT,
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                );
                CREATE INDEX idx_sessions_user_id ON sessions(user_id);
                CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
            """,
            down_sql="DROP TABLE IF EXISTS sessions;"
        ),
        Migration(
            version=5,
            name="create_migration_history_table",
            up_sql="""
                CREATE TABLE IF NOT EXISTS migration_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version INTEGER UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """,
            down_sql="DROP TABLE IF EXISTS migration_history;"
        )
    ]
    
    def __init__(self, engine: AsyncEngine):
        self.engine = engine
        self.logger = logger
    
    async def initialize(self) -> None:
        """Initialize migration system."""
        self.logger.info("Initializing migration system...")
        await self._ensure_migration_table()
    
    async def _ensure_migration_table(self) -> None:
        """Ensure migration history table exists."""
        async with self.engine.begin() as conn:
            await conn.execute(text(self.MIGRATIONS[4].up_sql))
            await conn.commit()
    
    async def get_current_version(self) -> int:
        """Get current database version."""
        try:
            async with self.engine.begin() as conn:
                result = await conn.execute(
                    text("SELECT MAX(version) as version FROM migration_history")
                )
                row = result.fetchone()
                return row[0] if row and row[0] else 0
        except Exception:
            return 0
    
    async def get_migration_history(self) -> List[Dict[str, Any]]:
        """Get migration history."""
        try:
            async with self.engine.begin() as conn:
                result = await conn.execute(
                    text("SELECT version, name, applied_at FROM migration_history ORDER BY version")
                )
                return [
                    {"version": row[0], "name": row[1], "applied_at": row[2]}
                    for row in result.fetchall()
                ]
        except Exception:
            return []
    
    async def migrate(self, target_version: Optional[int] = None) -> bool:
        """
        Run migrations up to target version.
        
        Args:
            target_version: Target version (None = latest)
        
        Returns:
            True if successful
        """
        current_version = await self.get_current_version()
        target_version = target_version or len(self.MIGRATIONS)
        
        if current_version >= target_version:
            self.logger.info(f"Database already at version {current_version}")
            return True
        
        self.logger.info(f"Migrating from version {current_version} to {target_version}")
        
        for migration in self.MIGRATIONS:
            if migration.version <= current_version:
                continue
            if migration.version > target_version:
                break
            
            try:
                await self._apply_migration(migration)
                self.logger.info(f"✅ Applied migration {migration.version}: {migration.name}")
            except Exception as e:
                self.logger.error(f"❌ Failed to apply migration {migration.version}: {e}")
                return False
        
        return True
    
    async def _apply_migration(self, migration: Migration) -> None:
        """Apply a single migration."""
        async with self.engine.begin() as conn:
            # Execute migration SQL
            await conn.execute(text(migration.up_sql))
            
            # Record in history
            await conn.execute(
                text(
                    "INSERT INTO migration_history (version, name) VALUES (:version, :name)"
                ),
                {"version": migration.version, "name": migration.name}
            )
            
            await conn.commit()
    
    async def rollback(self, target_version: int) -> bool:
        """
        Rollback to target version.
        
        Args:
            target_version: Target version to rollback to
        
        Returns:
            True if successful
        """
        current_version = await self.get_current_version()
        
        if current_version <= target_version:
            self.logger.info(f"Database already at version {current_version}")
            return True
        
        self.logger.info(f"Rolling back from version {current_version} to {target_version}")
        
        for migration in reversed(self.MIGRATIONS):
            if migration.version <= target_version:
                break
            if migration.version > current_version:
                continue
            
            try:
                await self._rollback_migration(migration)
                self.logger.info(f"✅ Rolled back migration {migration.version}: {migration.name}")
            except Exception as e:
                self.logger.error(f"❌ Failed to rollback migration {migration.version}: {e}")
                return False
        
        return True
    
    async def _rollback_migration(self, migration: Migration) -> None:
        """Rollback a single migration."""
        async with self.engine.begin() as conn:
            # Execute rollback SQL
            await conn.execute(text(migration.down_sql))
            
            # Remove from history
            await conn.execute(
                text("DELETE FROM migration_history WHERE version = :version"),
                {"version": migration.version}
            )
            
            await conn.commit()
