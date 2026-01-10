"""
Query processing service.
Orchestrates the complete query workflow from natural language to execution.
"""

from typing import Dict, Optional
import logging

from app.services.ai_service import AIAgentService
from app.db.connection_manager import connection_manager
from app.db.metadata import MetadataExtractor
from app.schemas.request import QueryMode

logger = logging.getLogger(__name__)


class QueryService:
    """
    High-level query processing service.
    Coordinates AI agent, metadata extraction, and session management.
    """
    
    @staticmethod
    async def process_natural_query(
        session_id: str,
        natural_query: str,
        mode: QueryMode
    ) -> Dict:
        """
        Process a natural language query through the complete pipeline.
        
        Workflow:
        1. Validate session
        2. Extract database schema
        3. Send to AI agent
        4. Validate AI response
        5. Return appropriate response based on mode
        
        Args:
            session_id: Database session ID
            natural_query: User's natural language query
            mode: Execution mode (user or dev)
        
        Returns:
            Dictionary with query processing result
        """
        
        # Step 1: Get database session
        session = connection_manager.get_session(session_id)
        if not session:
            logger.warning(f"Invalid session ID: {session_id}")
            return {
                "status": "failed",
                "message": "Invalid or expired session ID"
            }
        
        logger.info(
            f"Processing query for session {session_id} in {mode.value} mode"
        )
        
        # Step 2: Extract database schema
        try:
            schema_info = MetadataExtractor.get_schema_info(
                session.engine,
                session.db_type
            )
            
            if not schema_info:
                return {
                    "status": "failed",
                    "message": "Failed to extract database schema"
                }
            
            schema_text = MetadataExtractor.format_schema_for_ai(schema_info)
        
        except Exception as e:
            logger.error(f"Schema extraction error for session {session_id}: {str(e)}")
            return {
                "status": "failed",
                "message": f"Schema extraction failed: {str(e)}"
            }
        
        # Step 3: Call AI agent
        success, ai_response, error_msg = await AIAgentService.process_query(
            natural_query=natural_query,
            schema=schema_text,
            session_id=session_id
        )
        
        if not success:
            return {
                "status": "failed",
                "message": error_msg or "AI service error"
            }
        
        # Step 4: Validate AI response
        is_valid, validation_error = AIAgentService.validate_ai_response(ai_response)
        if not is_valid:
            logger.error(f"Invalid AI response for session {session_id}: {validation_error}")
            return {
                "status": "failed",
                "message": f"AI response validation failed: {validation_error}"
            }
        
        # Step 5: Handle AI safety verdict
        if not ai_response["is_safe"]:
            # AI determined query is unsafe
            reason = ai_response.get("reason", "AI safety check failed")
            logger.warning(f"Query blocked by AI for session {session_id}: {reason}")
            return {
                "status": "blocked",
                "reason": reason
            }
        
        # Step 6: Return based on mode
        sql = ai_response["sql"]
        
        if mode == QueryMode.DEV:
            # Dev mode: Store for approval, don't execute
            session.pending_approval = sql
            logger.info(f"Query pending approval for session {session_id}")
            return {
                "status": "pending_approval",
                "sql": sql
            }
        
        else:
            # User mode: Will be executed by execution service
            return {
                "status": "ready_for_execution",
                "sql": sql
            }
