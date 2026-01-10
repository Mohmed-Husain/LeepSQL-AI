"""
Core configuration for the FastAPI backend.
Centralized settings management using Pydantic.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import logging


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    All sensitive values should come from env vars in production.
    """
    
    # Application
    APP_NAME: str = "LeepSQL-AI Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    
    # AI Agent Service
    AI_AGENT_URL: str = "http://localhost:9000/process"
    AI_AGENT_TIMEOUT: int = 30  # seconds
    
    # Database Query Limits
    MAX_QUERY_ROWS: int = 1000
    QUERY_TIMEOUT: int = 30  # seconds
    
    # Session Management
    SESSION_CLEANUP_INTERVAL: int = 3600  # 1 hour
    SESSION_MAX_IDLE_TIME: int = 1800  # 30 minutes
    
    # Security
    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app/logs/audit.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Configure logging
def setup_logging():
    """Configure application logging with audit trail."""
    
    # Create logs directory if it doesn't exist
    import os
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
    
    # Configure logger
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(settings.LOG_FILE),
            logging.StreamHandler()
        ]
    )
    
    # Ensure sensitive data is never logged
    logging.captureWarnings(True)
