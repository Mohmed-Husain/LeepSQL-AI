"""
Database connection API endpoint.
Handles secure database connection establishment and session management.
"""

from fastapi import APIRouter, HTTPException, status
import logging

from app.schemas.request import DBConnectRequest
from app.schemas.response import DBConnectResponse
from app.db.connection_manager import connection_manager

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/connect", response_model=DBConnectResponse, status_code=status.HTTP_201_CREATED)
async def connect_database(request: DBConnectRequest):
    """
    Establish a new database connection session.
    
    **Security Features:**
    - Credentials validated but never logged
    - Stored in memory only (not persisted)
    - Session-based access control
    - Automatic connection pooling
    
    **Request Body:**
    - `db_type`: Database type (postgres or mysql)
    - `host`: Database host address
    - `port`: Database port number
    - `database`: Database name
    - `username`: Database username
    - `password`: Database password (never logged or returned)
    
    **Response:**
    - `session_id`: Unique session identifier for subsequent requests
    - `status`: Connection status
    - `message`: Additional information
    
    **Example:**
    ```json
    {
        "db_type": "postgres",
        "host": "db.example.com",
        "port": 5432,
        "database": "sales",
        "username": "user",
        "password": "secure_password"
    }
    ```
    
    **Returns:** Session ID to use for all subsequent operations
    """
    
    try:
        # Create database connection
        # Note: Credentials are handled securely and never logged
        session_id, error_msg = connection_manager.create_connection(
            db_type=request.db_type,
            host=request.host,
            port=request.port,
            database=request.database,
            username=request.username,
            password=request.password  # Handled securely, never logged
        )
        
        if not session_id:
            # Connection failed
            logger.warning(f"Database connection failed: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database connection failed: {error_msg}"
            )
        
        # Connection successful
        return DBConnectResponse(
            session_id=session_id,
            status="connected",
            message=f"Successfully connected to {request.db_type.value} database"
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Unexpected error in /db/connect: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during database connection"
        )


@router.delete("/disconnect/{session_id}")
async def disconnect_database(session_id: str):
    """
    Close a database connection session.
    
    **Path Parameters:**
    - `session_id`: Session ID to close
    
    **Returns:** Status message
    """
    
    try:
        success = connection_manager.close_session(session_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or already closed"
            )
        
        return {
            "status": "disconnected",
            "message": f"Session {session_id} closed successfully"
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error disconnecting session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error closing database session"
        )


@router.get("/sessions/count")
async def get_active_sessions():
    """
    Get count of active database sessions.
    
    **Returns:** Number of active sessions
    """
    
    try:
        count = connection_manager.get_session_count()
        return {
            "active_sessions": count
        }
    
    except Exception as e:
        logger.error(f"Error getting session count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving session count"
        )
