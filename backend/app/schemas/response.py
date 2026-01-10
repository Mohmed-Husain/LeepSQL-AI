"""
Pydantic schemas for API responses.
Defines output structure and type safety for all endpoints.
"""

from pydantic import BaseModel, Field
from typing import Any, Optional, List, Dict
from datetime import datetime


class DBConnectResponse(BaseModel):
    """Response for database connection endpoint."""
    
    session_id: str = Field(
        ...,
        description="Unique session identifier for this connection"
    )
    status: str = Field(
        ...,
        description="Connection status (e.g., 'connected', 'failed')"
    )
    message: Optional[str] = Field(
        None,
        description="Additional information or error message"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "connected",
                "message": "Successfully connected to database"
            }
        }


class QueryResponse(BaseModel):
    """
    Response for query endpoint.
    Structure varies based on execution mode and safety verdict.
    """
    
    status: str = Field(
        ...,
        description="Query status: 'blocked', 'pending_approval', 'executed', 'failed'"
    )
    
    # For blocked queries
    reason: Optional[str] = Field(
        None,
        description="Reason why query was blocked (if status='blocked')"
    )
    
    # For dev mode pending approval
    sql: Optional[str] = Field(
        None,
        description="Generated SQL (if status='pending_approval')"
    )
    
    # For successfully executed queries
    data: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Query results (if status='executed')"
    )
    columns: Optional[List[str]] = Field(
        None,
        description="Column names (if status='executed')"
    )
    row_count: Optional[int] = Field(
        None,
        description="Number of rows returned (if status='executed')"
    )
    
    # Metadata
    execution_time_ms: Optional[float] = Field(
        None,
        description="Query execution time in milliseconds"
    )
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "name": "Blocked Query",
                    "value": {
                        "status": "blocked",
                        "reason": "Query contains unsafe operation: DROP"
                    }
                },
                {
                    "name": "Pending Approval",
                    "value": {
                        "status": "pending_approval",
                        "sql": "SELECT SUM(amount) FROM sales WHERE month = 'January'"
                    }
                },
                {
                    "name": "Executed Query",
                    "value": {
                        "status": "executed",
                        "data": [{"total_sales": 15000}],
                        "columns": ["total_sales"],
                        "row_count": 1,
                        "execution_time_ms": 45.2
                    }
                }
            ]
        }


class ApprovalResponse(BaseModel):
    """Response for approval endpoint."""
    
    status: str = Field(
        ...,
        description="Approval status: 'executed', 'rejected', 'failed'"
    )
    
    # For executed queries
    data: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Query results (if approved and executed)"
    )
    columns: Optional[List[str]] = Field(
        None,
        description="Column names (if approved and executed)"
    )
    row_count: Optional[int] = Field(
        None,
        description="Number of rows returned"
    )
    
    # For rejected or failed queries
    message: Optional[str] = Field(
        None,
        description="Status message or error details"
    )
    
    execution_time_ms: Optional[float] = Field(
        None,
        description="Query execution time in milliseconds"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "executed",
                "data": [{"total_sales": 15000}],
                "columns": ["total_sales"],
                "row_count": 1,
                "execution_time_ms": 42.8
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response schema."""
    
    error: str = Field(
        ...,
        description="Error type or category"
    )
    message: str = Field(
        ...,
        description="Human-readable error message"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Error timestamp"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid session ID format",
                "timestamp": "2026-01-10T12:34:56.789Z"
            }
        }
