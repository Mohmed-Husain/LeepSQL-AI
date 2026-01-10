"""
Query execution service.
Handles SQL execution with safety validation and result formatting.
"""

from typing import Dict, Optional
import logging

from app.db.connection_manager import connection_manager
from app.db.executor import QueryExecutor
from app.core.permissions import SQLPermissionChecker

logger = logging.getLogger(__name__)


class ExecutionService:
    """
    Service for executing SQL queries with safety enforcement.
    Provides additional validation layer on top of AI agent verdicts.
    """
    
    @staticmethod
    def execute_sql(session_id: str, sql: str) -> Dict:
        """
        Execute SQL query with comprehensive safety checks.
        
        This provides a second layer of validation beyond AI agent checks.
        Backend always has final say on query execution.
        
        Args:
            session_id: Database session ID
            sql: SQL query to execute
        
        Returns:
            Dictionary with execution result
        """
        
        # Step 1: Get database session
        session = connection_manager.get_session(session_id)
        if not session:
            logger.warning(f"Invalid session ID: {session_id}")
            return {
                "status": "failed",
                "message": "Invalid or expired session ID"
            }
        
        # Step 2: Backend-level safety validation
        # This is independent of AI agent - backend always validates
        is_safe, reason = SQLPermissionChecker.validate_sql(sql)
        if not is_safe:
            logger.warning(
                f"Backend safety check failed for session {session_id}: {reason}"
            )
            return {
                "status": "blocked",
                "reason": f"Backend safety check: {reason}"
            }
        
        # Step 3: Execute query
        success, result_data, error_msg = QueryExecutor.execute_query(
            engine=session.engine,
            sql=sql,
            session_id=session_id
        )
        
        if not success:
            logger.error(f"Query execution failed for session {session_id}: {error_msg}")
            return {
                "status": "failed",
                "message": error_msg or "Query execution failed"
            }
        
        # Step 4: Return successful result
        return {
            "status": "executed",
            **result_data  # Includes data, columns, row_count, execution_time_ms
        }
    
    @staticmethod
    def execute_approved_query(
        session_id: str,
        sql: str,
        approved: bool
    ) -> Dict:
        """
        Execute a query that was pending approval in dev mode.
        
        Args:
            session_id: Database session ID
            sql: SQL query to execute (must match pending query)
            approved: Whether developer approved execution
        
        Returns:
            Dictionary with execution result
        """
        
        # Step 1: Get database session
        session = connection_manager.get_session(session_id)
        if not session:
            logger.warning(f"Invalid session ID: {session_id}")
            return {
                "status": "failed",
                "message": "Invalid or expired session ID"
            }
        
        # Step 2: Check if there's a pending query
        if not session.pending_approval:
            logger.warning(f"No pending query for session {session_id}")
            return {
                "status": "failed",
                "message": "No query pending approval"
            }
        
        # Step 3: Verify SQL matches pending query
        if sql.strip() != session.pending_approval.strip():
            logger.warning(
                f"SQL mismatch for session {session_id}: "
                f"provided SQL does not match pending query"
            )
            return {
                "status": "failed",
                "message": "Provided SQL does not match pending query"
            }
        
        # Step 4: Clear pending query
        session.pending_approval = None
        
        # Step 5: Handle rejection
        if not approved:
            logger.info(f"Query rejected by developer for session {session_id}")
            return {
                "status": "rejected",
                "message": "Query execution rejected by developer"
            }
        
        # Step 6: Execute approved query
        logger.info(f"Executing approved query for session {session_id}")
        return ExecutionService.execute_sql(session_id, sql)
