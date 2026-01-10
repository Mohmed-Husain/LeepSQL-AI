"""
Database connection manager.
Handles secure session-based database connections with credential isolation.

Security Principles:
- Credentials stored in memory only
- No credential logging
- Session-based access control
- Automatic cleanup of idle connections
"""

import uuid
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
import logging
from threading import Lock

from app.schemas.request import DatabaseType

logger = logging.getLogger(__name__)


class DatabaseSession:
    """
    Represents a single database connection session.
    Credentials are encapsulated and never exposed.
    """
    
    def __init__(
        self,
        session_id: str,
        engine: Engine,
        db_type: DatabaseType,
        database_name: str
    ):
        self.session_id = session_id
        self.engine = engine
        self.db_type = db_type
        self.database_name = database_name
        self.created_at = datetime.utcnow()
        self.last_accessed = datetime.utcnow()
        self.pending_approval: Optional[str] = None  # For dev mode queries
    
    def update_access_time(self):
        """Update last accessed timestamp."""
        self.last_accessed = datetime.utcnow()
    
    def is_expired(self, max_idle_seconds: int) -> bool:
        """Check if session has expired due to inactivity."""
        idle_time = datetime.utcnow() - self.last_accessed
        return idle_time.total_seconds() > max_idle_seconds


class ConnectionManager:
    """
    Singleton connection manager for database sessions.
    Thread-safe session management with automatic cleanup.
    """
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._sessions: Dict[str, DatabaseSession] = {}
        self._sessions_lock = Lock()
        self._initialized = True
        
        logger.info("ConnectionManager initialized")
    
    def create_connection(
        self,
        db_type: DatabaseType,
        host: str,
        port: int,
        database: str,
        username: str,
        password: str
    ) -> Tuple[str, Optional[str]]:
        """
        Create a new database connection and return session ID.
        
        Args:
            db_type: Database type (postgres/mysql)
            host: Database host
            port: Database port
            database: Database name
            username: Database username
            password: Database password (never logged)
        
        Returns:
            Tuple of (session_id, error_message)
            - session_id: Unique session identifier if successful, None if failed
            - error_message: Error description if failed, None if successful
        """
        
        try:
            # Build connection string (credentials only used here)
            connection_string = self._build_connection_string(
                db_type, host, port, database, username, password
            )
            
            # Create SQLAlchemy engine
            engine = create_engine(
                connection_string,
                pool_pre_ping=True,  # Verify connections before using
                pool_recycle=3600,   # Recycle connections after 1 hour
                echo=False  # Never log SQL in production
            )
            
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            # Generate session ID
            session_id = str(uuid.uuid4())
            
            # Create session object
            session = DatabaseSession(
                session_id=session_id,
                engine=engine,
                db_type=db_type,
                database_name=database
            )
            
            # Store session
            with self._sessions_lock:
                self._sessions[session_id] = session
            
            # Log connection (without credentials)
            logger.info(
                f"New database session created: {session_id} "
                f"[{db_type.value}://{host}:{port}/{database}]"
            )
            
            return session_id, None
            
        except SQLAlchemyError as e:
            error_msg = f"Database connection failed: {str(e)}"
            logger.error(f"Connection error: {error_msg}")
            return None, error_msg
        
        except Exception as e:
            error_msg = f"Unexpected error during connection: {str(e)}"
            logger.error(error_msg)
            return None, error_msg
    
    def get_session(self, session_id: str) -> Optional[DatabaseSession]:
        """
        Retrieve a database session by ID.
        
        Args:
            session_id: Session identifier
        
        Returns:
            DatabaseSession if found and valid, None otherwise
        """
        
        with self._sessions_lock:
            session = self._sessions.get(session_id)
            
            if session:
                session.update_access_time()
                return session
            
            return None
    
    def close_session(self, session_id: str) -> bool:
        """
        Close and remove a database session.
        
        Args:
            session_id: Session identifier
        
        Returns:
            True if session was found and closed, False otherwise
        """
        
        with self._sessions_lock:
            session = self._sessions.get(session_id)
            
            if not session:
                return False
            
            try:
                session.engine.dispose()
                del self._sessions[session_id]
                logger.info(f"Session closed: {session_id}")
                return True
            
            except Exception as e:
                logger.error(f"Error closing session {session_id}: {str(e)}")
                return False
    
    def cleanup_expired_sessions(self, max_idle_seconds: int):
        """
        Remove expired sessions based on idle time.
        
        Args:
            max_idle_seconds: Maximum idle time before session expires
        """
        
        with self._sessions_lock:
            expired_sessions = [
                session_id
                for session_id, session in self._sessions.items()
                if session.is_expired(max_idle_seconds)
            ]
            
            for session_id in expired_sessions:
                try:
                    session = self._sessions[session_id]
                    session.engine.dispose()
                    del self._sessions[session_id]
                    logger.info(f"Expired session cleaned up: {session_id}")
                except Exception as e:
                    logger.error(f"Error cleaning up session {session_id}: {str(e)}")
    
    @staticmethod
    def _build_connection_string(
        db_type: DatabaseType,
        host: str,
        port: int,
        database: str,
        username: str,
        password: str
    ) -> str:
        """
        Build database connection string.
        
        Note: This method handles credentials but never logs them.
        """
        
        # URL encode password to handle special characters
        from urllib.parse import quote_plus
        encoded_password = quote_plus(password)
        
        if db_type == DatabaseType.POSTGRES:
            driver = "postgresql+psycopg2"
        elif db_type == DatabaseType.MYSQL:
            driver = "mysql+pymysql"
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
        
        connection_string = (
            f"{driver}://{username}:{encoded_password}@{host}:{port}/{database}"
        )
        
        return connection_string
    
    def get_session_count(self) -> int:
        """Get the number of active sessions."""
        with self._sessions_lock:
            return len(self._sessions)


# Global connection manager instance
connection_manager = ConnectionManager()
