"""
Pydantic schemas for API requests.
Defines input validation and type safety for all endpoints.
"""

from pydantic import BaseModel, Field, validator
from typing import Literal, Optional
from enum import Enum


class DatabaseType(str, Enum):
    """Supported database types."""
    POSTGRES = "postgres"
    MYSQL = "mysql"


class QueryMode(str, Enum):
    """Query execution modes."""
    USER = "user"  # Auto-execute safe queries
    DEV = "dev"    # Require manual approval


class DBConnectRequest(BaseModel):
    """
    Database connection request schema.
    
    Security: Credentials are validated but never logged.
    """
    
    db_type: DatabaseType = Field(
        ...,
        description="Database type (postgres or mysql)"
    )
    host: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Database host address"
    )
    port: int = Field(
        ...,
        ge=1,
        le=65535,
        description="Database port number"
    )
    database: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Database name"
    )
    username: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Database username"
    )
    password: str = Field(
        ...,
        description="Database password"
    )
    
    @validator('host')
    def validate_host(cls, v):
        """Validate host format."""
        if not v or v.isspace():
            raise ValueError("Host cannot be empty")
        return v.strip()
    
    @validator('database', 'username')
    def validate_non_empty(cls, v):
        """Validate non-empty strings."""
        if not v or v.isspace():
            raise ValueError("Field cannot be empty")
        return v.strip()
    
    class Config:
        # Prevent password from appearing in string representation
        json_schema_extra = {
            "example": {
                "db_type": "postgres",
                "host": "db.example.com",
                "port": 5432,
                "database": "sales",
                "username": "user",
                "password": "********"
            }
        }


class UserQueryRequest(BaseModel):
    """
    Natural language query request schema.
    """
    
    session_id: str = Field(
        ...,
        min_length=1,
        description="Database session ID from /db/connect"
    )
    query: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Natural language query"
    )
    mode: QueryMode = Field(
        default=QueryMode.USER,
        description="Execution mode: user (auto) or dev (manual approval)"
    )
    
    @validator('query')
    def validate_query(cls, v):
        """Validate query string."""
        if not v or v.isspace():
            raise ValueError("Query cannot be empty")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "query": "Show total sales for January",
                "mode": "user"
            }
        }


class ApprovalRequest(BaseModel):
    """
    Developer approval request schema.
    Used in dev mode to approve/reject AI-generated SQL.
    """
    
    session_id: str = Field(
        ...,
        min_length=1,
        description="Database session ID"
    )
    sql: str = Field(
        ...,
        min_length=1,
        description="SQL query to execute (must match pending query)"
    )
    approved: bool = Field(
        ...,
        description="Whether to execute the query (true) or reject (false)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "sql": "SELECT SUM(amount) FROM sales WHERE month = 'January'",
                "approved": True
            }
        }
