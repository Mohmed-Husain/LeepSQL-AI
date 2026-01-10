"""
AI Agent service integration.
Communicates with external AI service for SQL generation and safety analysis.
"""

import httpx
from typing import Dict, Optional, Tuple
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIAgentService:
    """
    Client for external AI Agent service.
    Handles natural language to SQL conversion with safety analysis.
    
    Security: Treats all AI output as untrusted and requires validation.
    """
    
    @staticmethod
    async def process_query(
        natural_query: str,
        schema: str,
        session_id: str
    ) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Send natural language query to AI agent for processing.
        
        Args:
            natural_query: User's natural language query
            schema: Database schema context
            session_id: Session ID for logging
        
        Returns:
            Tuple of (success, ai_response, error_message)
            - success: True if AI service responded successfully
            - ai_response: Dictionary with 'sql', 'is_safe', 'reason' if successful
            - error_message: Error description if failed, None if successful
        """
        
        try:
            # Prepare request payload
            payload = {
                "query": natural_query,
                "schema": schema
            }
            
            # Log request (without sensitive data)
            logger.info(
                f"Sending query to AI agent for session {session_id}: "
                f"query_length={len(natural_query)}, schema_length={len(schema)}"
            )
            
            # Call AI service with timeout
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.AI_AGENT_URL,
                    json=payload,
                    timeout=settings.AI_AGENT_TIMEOUT
                )
                
                # Check response status
                if response.status_code != 200:
                    error_msg = f"AI service returned status {response.status_code}"
                    logger.error(f"AI service error for session {session_id}: {error_msg}")
                    return False, None, error_msg
                
                # Parse response
                ai_response = response.json()
                
                # Validate response structure
                if not isinstance(ai_response, dict):
                    error_msg = "AI service returned invalid response format"
                    logger.error(f"AI service error for session {session_id}: {error_msg}")
                    return False, None, error_msg
                
                # Ensure required fields
                required_fields = ["sql", "is_safe"]
                for field in required_fields:
                    if field not in ai_response:
                        error_msg = f"AI service response missing field: {field}"
                        logger.error(f"AI service error for session {session_id}: {error_msg}")
                        return False, None, error_msg
                
                # Log successful response
                is_safe = ai_response.get("is_safe", False)
                status = "safe" if is_safe else "unsafe"
                logger.info(
                    f"AI agent response for session {session_id}: status={status}, "
                    f"sql_length={len(ai_response.get('sql', ''))}"
                )
                
                return True, ai_response, None
        
        except httpx.TimeoutException:
            error_msg = f"AI service timeout after {settings.AI_AGENT_TIMEOUT} seconds"
            logger.error(f"AI service timeout for session {session_id}")
            return False, None, error_msg
        
        except httpx.RequestError as e:
            error_msg = f"AI service connection error: {str(e)}"
            logger.error(f"AI service error for session {session_id}: {error_msg}")
            return False, None, error_msg
        
        except Exception as e:
            error_msg = f"Unexpected error calling AI service: {str(e)}"
            logger.error(f"AI service error for session {session_id}: {error_msg}")
            return False, None, error_msg
    
    @staticmethod
    def validate_ai_response(ai_response: Dict) -> Tuple[bool, Optional[str]]:
        """
        Validate AI agent response structure and content.
        
        Args:
            ai_response: Response dictionary from AI service
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        
        # Check required fields
        if "sql" not in ai_response or "is_safe" not in ai_response:
            return False, "AI response missing required fields"
        
        # Validate types
        if not isinstance(ai_response["sql"], str):
            return False, "AI response 'sql' must be a string"
        
        if not isinstance(ai_response["is_safe"], bool):
            return False, "AI response 'is_safe' must be a boolean"
        
        # Validate SQL not empty
        if not ai_response["sql"].strip():
            return False, "AI response 'sql' is empty"
        
        # Validate reason if unsafe
        if not ai_response["is_safe"]:
            if "reason" not in ai_response or not ai_response["reason"]:
                return False, "AI response must include 'reason' when is_safe=False"
        
        return True, None
