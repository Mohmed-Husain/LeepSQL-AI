"""
Developer control API endpoint.
Handles manual approval/rejection of queries in dev mode.
"""

from fastapi import APIRouter, HTTPException, status
import logging

from app.schemas.request import ApprovalRequest
from app.schemas.response import ApprovalResponse
from app.services.execution_service import ExecutionService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=ApprovalResponse)
async def approve_query(request: ApprovalRequest):
    """
    Approve or reject a query pending execution.
    
    **Use Case:**
    When a query is submitted in `dev` mode, it returns with status `pending_approval`
    and the generated SQL. Developer can review the SQL and use this endpoint to
    approve or reject execution.
    
    **Request Body:**
    - `session_id`: Database session ID
    - `sql`: SQL query to execute (must match the pending query)
    - `approved`: True to execute, False to reject
    
    **Response Scenarios:**
    
    1. **Approved and Executed:**
    ```json
    {
        "status": "executed",
        "data": [{"total_sales": 15000}],
        "columns": ["total_sales"],
        "row_count": 1,
        "execution_time_ms": 42.8
    }
    ```
    
    2. **Rejected:**
    ```json
    {
        "status": "rejected",
        "message": "Query execution rejected by developer"
    }
    ```
    
    3. **Blocked (failed backend safety check):**
    ```json
    {
        "status": "blocked",
        "message": "Backend safety check: Operation 'DROP' is not allowed"
    }
    ```
    
    **Security:**
    - SQL must exactly match pending query
    - Backend performs additional safety validation before execution
    - All standard safety rules apply (read-only, timeouts, limits)
    
    **Workflow:**
    1. User submits query in dev mode → receives SQL
    2. Developer reviews SQL
    3. Developer calls /approve with approved=true/false
    4. If approved, backend validates and executes
    5. Results returned
    """
    
    try:
        # Execute approved query (or handle rejection)
        result = ExecutionService.execute_approved_query(
            session_id=request.session_id,
            sql=request.sql,
            approved=request.approved
        )
        
        result_status = result.get("status")
        
        if result_status == "failed":
            # Session not found, no pending query, SQL mismatch, etc.
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Approval processing failed")
            )
        
        elif result_status == "rejected":
            # Developer rejected execution
            return ApprovalResponse(
                status="rejected",
                message=result.get("message", "Query execution rejected")
            )
        
        elif result_status == "blocked":
            # Backend safety check failed
            return ApprovalResponse(
                status="blocked",
                message=result.get("reason", "Backend safety check failed")
            )
        
        elif result_status == "executed":
            # Successfully executed
            return ApprovalResponse(
                status="executed",
                data=result.get("data"),
                columns=result.get("columns"),
                row_count=result.get("row_count"),
                execution_time_ms=result.get("execution_time_ms"),
                message="Query executed successfully"
            )
        
        # Unknown status
        logger.error(f"Unknown approval status: {result_status}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error processing approval"
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Unexpected error in /approve: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
