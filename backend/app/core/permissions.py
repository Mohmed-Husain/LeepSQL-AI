"""
SQL permission and safety validation module.
Implements strict read-only enforcement and query safety checks.
"""

import re
from typing import Tuple
import sqlparse
from sqlparse.sql import Statement
from sqlparse.tokens import Keyword, DML


class SQLPermissionChecker:
    """
    Validates SQL queries against safety rules.
    Default: READ-ONLY mode with strict enforcement.
    """
    
    # Dangerous keywords that should be blocked
    BLOCKED_KEYWORDS = {
        'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 
        'GRANT', 'REVOKE', 'EXECUTE', 'EXEC',
        'INSERT', 'UPDATE'  # Can be allowed in future versions
    }
    
    # DELETE is special - only blocked without WHERE
    CONDITIONAL_BLOCKS = {'DELETE'}
    
    @staticmethod
    def validate_sql(sql: str) -> Tuple[bool, str]:
        """
        Validate SQL for safety.
        
        Args:
            sql: SQL query string to validate
            
        Returns:
            Tuple of (is_safe, reason)
            - is_safe: True if query passes all safety checks
            - reason: Explanation if query is unsafe, None otherwise
        """
        
        if not sql or not sql.strip():
            return False, "Empty SQL query"
        
        try:
            # Parse SQL
            parsed = sqlparse.parse(sql)
            
            if not parsed:
                return False, "Invalid SQL syntax"
            
            # Check each statement (handle multiple statements)
            for statement in parsed:
                is_safe, reason = SQLPermissionChecker._validate_statement(statement)
                if not is_safe:
                    return False, reason
            
            return True, None
            
        except Exception as e:
            return False, f"SQL parsing error: {str(e)}"
    
    @staticmethod
    def _validate_statement(statement: Statement) -> Tuple[bool, str]:
        """Validate a single SQL statement."""
        
        # Convert to uppercase for checking
        sql_upper = str(statement).upper().strip()
        
        # Check for blocked keywords
        for keyword in SQLPermissionChecker.BLOCKED_KEYWORDS:
            if re.search(rf'\b{keyword}\b', sql_upper):
                return False, f"Operation '{keyword}' is not allowed in read-only mode"
        
        # Check DELETE without WHERE
        if 'DELETE' in sql_upper:
            if not re.search(r'\bWHERE\b', sql_upper):
                return False, "DELETE without WHERE clause is not allowed"
        
        # Ensure it's a SELECT statement
        first_token = statement.get_type()
        if first_token != 'SELECT':
            # Allow WITH (CTE) statements that end in SELECT
            if not sql_upper.strip().startswith('WITH'):
                return False, f"Only SELECT queries are allowed in read-only mode"
        
        # Check for dangerous functions
        dangerous_patterns = [
            r'pg_sleep',
            r'waitfor\s+delay',
            r'benchmark\s*\(',
            r'load_file',
            r'into\s+outfile',
            r'into\s+dumpfile'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, sql_upper):
                return False, f"Potentially dangerous function detected"
        
        return True, None
    
    @staticmethod
    def sanitize_for_logging(sql: str, max_length: int = 200) -> str:
        """
        Sanitize SQL for safe logging.
        Removes potential sensitive data and truncates.
        """
        
        # Remove string literals (potential sensitive data)
        sanitized = re.sub(r"'[^']*'", "'***'", sql)
        sanitized = re.sub(r'"[^"]*"', '"***"', sanitized)
        
        # Truncate if too long
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length] + "..."
        
        return sanitized


class QueryLimiter:
    """Enforces query execution limits."""
    
    @staticmethod
    def add_row_limit(sql: str, max_rows: int) -> str:
        """
        Add LIMIT clause to SQL if not present.
        
        Args:
            sql: Original SQL query
            max_rows: Maximum number of rows to return
            
        Returns:
            Modified SQL with LIMIT clause
        """
        
        sql_upper = sql.upper().strip()
        
        # Check if LIMIT already exists
        if re.search(r'\bLIMIT\b', sql_upper):
            # Extract existing limit
            limit_match = re.search(r'\bLIMIT\s+(\d+)', sql_upper)
            if limit_match:
                existing_limit = int(limit_match.group(1))
                if existing_limit > max_rows:
                    # Replace with safer limit
                    sql = re.sub(
                        r'\bLIMIT\s+\d+\b',
                        f'LIMIT {max_rows}',
                        sql,
                        flags=re.IGNORECASE
                    )
            return sql
        
        # Add LIMIT clause
        # Handle queries with semicolon at the end
        sql = sql.rstrip('; \n\t')
        return f"{sql} LIMIT {max_rows}"
