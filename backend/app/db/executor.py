"""
SQL query executor with safety enforcement and monitoring.
Handles secure query execution with timeouts, limits, and auditing.
"""

from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.engine import Engine
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError, TimeoutError
import logging
import time

from app.core.permissions import SQLPermissionChecker, QueryLimiter
from app.core.config import settings

logger = logging.getLogger(__name__)


class QueryExecutor:
    """
    Executes SQL queries with comprehensive safety checks.
    Enforces read-only mode, row limits, and timeouts.
    """
    
    @staticmethod
    def execute_query(
        engine: Engine,
        sql: str,
        session_id: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Execute SQL query with safety enforcement.
        
        Args:
            engine: SQLAlchemy engine
            sql: SQL query to execute
            session_id: Session ID for logging (credentials never logged)
        
        Returns:
            Tuple of (success, result_data, error_message)
            - success: True if query executed successfully
            - result_data: Query results with metadata if successful, None otherwise
            - error_message: Error description if failed, None if successful
        """
        
        # Step 1: Validate SQL safety
        is_safe, reason = SQLPermissionChecker.validate_sql(sql)
        if not is_safe:
            logger.warning(
                f"Query blocked for session {session_id}: {reason}"
            )
            return False, None, f"Query blocked: {reason}"
        
        # Step 2: Add row limit
        limited_sql = QueryLimiter.add_row_limit(sql, settings.MAX_QUERY_ROWS)
        
        # Step 3: Execute query with timeout
        try:
            start_time = time.time()
            
            with engine.connect() as conn:
                # Set query timeout
                if hasattr(conn.connection, 'set_query_timeout'):
                    conn.connection.set_query_timeout(settings.QUERY_TIMEOUT)
                
                # Execute query
                result = conn.execute(text(limited_sql))
                
                # Fetch results
                rows = result.fetchall()
                columns = list(result.keys()) if result.keys() else []
                
                # Convert to list of dictionaries
                data = [
                    {col: QueryExecutor._serialize_value(row[i]) 
                     for i, col in enumerate(columns)}
                    for row in rows
                ]
                
                # Calculate execution time
                execution_time = (time.time() - start_time) * 1000  # milliseconds
                
                # Build result
                result_data = {
                    "data": data,
                    "columns": columns,
                    "row_count": len(data),
                    "execution_time_ms": round(execution_time, 2)
                }
                
                # Log successful execution (sanitized SQL)
                sanitized_sql = SQLPermissionChecker.sanitize_for_logging(sql)
                logger.info(
                    f"Query executed for session {session_id}: "
                    f"{len(data)} rows, {execution_time:.2f}ms - {sanitized_sql}"
                )
                
                return True, result_data, None
        
        except TimeoutError:
            error_msg = f"Query timeout after {settings.QUERY_TIMEOUT} seconds"
            logger.error(f"Query timeout for session {session_id}")
            return False, None, error_msg
        
        except SQLAlchemyError as e:
            error_msg = f"Query execution failed: {str(e)}"
            logger.error(f"Execution error for session {session_id}: {error_msg}")
            return False, None, error_msg
        
        except Exception as e:
            error_msg = f"Unexpected error during execution: {str(e)}"
            logger.error(f"Unexpected error for session {session_id}: {error_msg}")
            return False, None, error_msg
    
    @staticmethod
    def _serialize_value(value: Any) -> Any:
        """
        Serialize database values for JSON response.
        Handles special types like datetime, Decimal, etc.
        """
        
        # Handle None
        if value is None:
            return None
        
        # Handle datetime objects
        from datetime import datetime, date, time as dt_time
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, dt_time):
            return value.isoformat()
        
        # Handle Decimal
        from decimal import Decimal
        if isinstance(value, Decimal):
            return float(value)
        
        # Handle bytes
        if isinstance(value, bytes):
            try:
                return value.decode('utf-8')
            except:
                return str(value)
        
        # Handle other types
        try:
            # Try to convert to JSON-serializable type
            import json
            json.dumps(value)
            return value
        except:
            return str(value)
    
    @staticmethod
    def test_connection(engine: Engine) -> Tuple[bool, Optional[str]]:
        """
        Test database connection.
        
        Args:
            engine: SQLAlchemy engine
        
        Returns:
            Tuple of (success, error_message)
        """
        
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True, None
        
        except Exception as e:
            return False, str(e)
