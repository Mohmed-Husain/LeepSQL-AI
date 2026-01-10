"""
FastAPI application entry point.
Production-grade configuration with security, monitoring, and extensibility.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
import uvicorn
from datetime import datetime

from app.core.config import settings, setup_logging
from app.api import db_connect, user_query, dev_control
from app.db.connection_manager import connection_manager

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"AI Agent URL: {settings.AI_AGENT_URL}")
    logger.info(f"Max query rows: {settings.MAX_QUERY_ROWS}")
    logger.info(f"Query timeout: {settings.QUERY_TIMEOUT}s")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    
    # Cleanup: Close all active database connections
    try:
        session_count = connection_manager.get_session_count()
        if session_count > 0:
            logger.info(f"Cleaning up {session_count} active sessions")
            # Note: In production, implement proper cleanup in connection_manager
    except Exception as e:
        logger.error(f"Error during shutdown cleanup: {str(e)}")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## LeepSQL-AI Backend
    
    Production-grade Natural Language to SQL system with multi-layer validation.
    
    ### Features
    - 🔐 Secure session-based database connections
    - 🤖 AI-powered SQL generation with safety analysis
    - 🛡️ Multi-layer safety validation (AI + Backend)
    - 👨‍💻 Developer approval mode (Human-in-the-Loop)
    - 📊 Read-only enforcement with query limits
    - 📝 Comprehensive audit logging
    
    ### Architecture
    - Frontend → Backend → AI Agent
    - Backend → Database
    - AI Agent NEVER accesses database directly
    
    ### Security
    - Credentials stored in memory only
    - No credential logging
    - Session-based access control
    - Multi-layer SQL validation
    - Automatic row limits and timeouts
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors with detailed messages."""
    
    logger.warning(f"Validation error: {exc.errors()}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "message": "Invalid request data",
            "details": exc.errors(),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint.
    Returns application status and metadata.
    """
    
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "active_sessions": connection_manager.get_session_count()
    }


# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """
    Root endpoint with API information.
    """
    
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# Register API routes
app.include_router(
    db_connect.router,
    prefix="/db",
    tags=["Database Connection"]
)

app.include_router(
    user_query.router,
    prefix="/query",
    tags=["Query Processing"]
)

app.include_router(
    dev_control.router,
    prefix="/approve",
    tags=["Developer Control"]
)


# Development server
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
