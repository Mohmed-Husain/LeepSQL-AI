"""
User query API endpoint.
Handles natural language queries with AI processing and execution.
"""

from fastapi import APIRouter, HTTPException, status
import logging

from app.schemas.request import UserQueryRequest, QueryMode
from app.schemas.response import QueryResponse
from app.services.query_service import QueryService
from app.services.execution_service import ExecutionService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=QueryResponse)
async def process_query(request: UserQueryRequest):
    """
    Process a natural language query.
    
    **Workflow:**
    1. Validate session
    2. Extract database schema
    3. Send to AI agent for SQL generation
    4. Validate AI response
    5. Execute (user mode) or return for approval (dev mode)
    
    **Request Body:**
    - `session_id`: Database session ID from /db/connect
    - `query`: Natural language query (e.g., "Show total sales for January")
    - `mode`: Execution mode
        - `user`: Auto-execute if safe (default)
        - `dev`: Require manual approval via /approve endpoint
    
    **Response Scenarios:**
    
    1. **Blocked (unsafe query):**
    ```json
    {
        "status": "blocked",
        "reason": "Query contains unsafe operation: DROP"
    }
    ```
    
    2. **Pending Approval (dev mode):**
    ```json
    {
        "status": "pending_approval",
        "sql": "SELECT SUM(amount) FROM sales WHERE month = 'January'"
    }
    ```
    
    3. **Executed (user mode, safe query):**
    ```json
    {
        "status": "executed",
        "data": [{"total_sales": 15000}],
        "columns": ["total_sales"],
        "row_count": 1,
        "execution_time_ms": 45.2
    }
    ```
    
    **Security:**
    - AI output is treated as untrusted
    - Backend performs independent safety validation
    - Read-only enforcement
    - Row limits and timeouts applied
    """
    
    try:
        # Step 1: Process query through AI agent
        result = await QueryService.process_natural_query(
            session_id=request.session_id,
            natural_query=request.query,
            mode=request.mode
        )
        
        # Step 2: Handle different statuses
        status_value = result.get("status")
        
        if status_value == "failed":
            # Processing failed (invalid session, AI error, etc.)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Query processing failed")
            )
        
        elif status_value == "blocked":
            # Query deemed unsafe
            return QueryResponse(
                status="blocked",
                reason=result.get("reason", "Query blocked by safety check")
            )
        
        elif status_value == "pending_approval":
            # Dev mode - return SQL for approval
            return QueryResponse(
                status="pending_approval",
                sql=result.get("sql")
            )
        
        elif status_value == "ready_for_execution":
            # User mode - execute immediately
            sql = result.get("sql")
            
            execution_result = ExecutionService.execute_sql(
                session_id=request.session_id,
                sql=sql
            )
            
            exec_status = execution_result.get("status")
            
            if exec_status == "blocked":
                # Backend safety check failed
                return QueryResponse(
                    status="blocked",
                    reason=execution_result.get("reason", "Backend safety check failed")
                )
            
            elif exec_status == "failed":
                # Execution error
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=execution_result.get("message", "Query execution failed")
                )
            
            elif exec_status == "executed":
                # Success
                return QueryResponse(
                    status="executed",
                    data=execution_result.get("data"),
                    columns=execution_result.get("columns"),
                    row_count=execution_result.get("row_count"),
                    execution_time_ms=execution_result.get("execution_time_ms")
                )
        
        # Unknown status
        logger.error(f"Unknown query status: {status_value}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error processing query"
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Unexpected error in /query: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
