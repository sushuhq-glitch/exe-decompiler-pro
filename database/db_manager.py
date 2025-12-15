"""Database Manager for SQLAlchemy operations."""
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from pathlib import Path

Base = declarative_base()
logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages database connections and operations."""

    def __init__(self, database_url: str):
        """
        Initialize the database manager.

        Args:
            database_url: SQLAlchemy database URL
        """
        self.database_url = database_url
        
        # Convert sqlite:/// to sqlite+aiosqlite:///
        if database_url.startswith("sqlite:///"):
            self.database_url = database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
        
        self.engine: Optional[object] = None
        self.session_factory: Optional[async_sessionmaker] = None
        logger.info(f"DatabaseManager initialized with URL: {self.database_url}")

    async def initialize(self) -> None:
        """Initialize database engine and session factory."""
        try:
            # Ensure database directory exists for SQLite
            if self.database_url.startswith("sqlite"):
                db_path = self.database_url.replace("sqlite+aiosqlite:///", "")
                db_dir = Path(db_path).parent
                db_dir.mkdir(parents=True, exist_ok=True)
                logger.info(f"Database directory created: {db_dir}")

            # Create async engine
            self.engine = create_async_engine(
                self.database_url,
                echo=False,
                future=True,
            )

            # Create session factory
            self.session_factory = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
            )

            logger.info("Database engine and session factory initialized")

        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    async def migrate(self) -> None:
        """Run database migrations."""
        try:
            # Create all tables
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database migrations completed successfully")
        except Exception as e:
            logger.error(f"Database migration failed: {e}")
            raise

    async def close(self) -> None:
        """Close database connections."""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connections closed")

    def get_session(self) -> AsyncSession:
        """
        Get a new database session.

        Returns:
            AsyncSession: New database session
        """
        if not self.session_factory:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        return self.session_factory()
    
    async def get_user_projects(self, user_id: int):
        """
        Get all projects for a user.
        
        Args:
            user_id: User ID to get projects for
            
        Returns:
            List of projects (empty for now - not implemented yet)
        """
        # TODO: Implement when project model is ready
        return []


__all__ = ['DatabaseManager', 'Base']
