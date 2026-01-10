# LeepSQL-AI: Backend Architecture

## 📌 Overview

The backend is the **central control plane** of LeepSQL-AI, built with FastAPI. It orchestrates all operations between the frontend, AI agents, and database while enforcing strict security policies.

---

## 🏗️ Architecture Diagram

```
                         ┌─────────────────────────────┐
                         │        FRONTEND             │
                         │    (React Application)      │
                         └─────────────┬───────────────┘
                                       │ HTTP/REST
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                               │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                        API LAYER                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │  │ db_connect   │  │ user_query   │  │ dev_control  │           │ │
│  │  │   Router     │  │   Router     │  │   Router     │           │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                      │
│  ┌─────────────────────────────▼───────────────────────────────────┐ │
│  │                      SERVICE LAYER                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │  │ ai_service   │  │query_service │  │execution_svc │           │ │
│  │  │ (AI Client)  │  │(Orchestrator)│  │(SQL Runner)  │           │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                      │
│  ┌─────────────────────────────▼───────────────────────────────────┐ │
│  │                     DATABASE LAYER                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │  │ connection   │  │  metadata    │  │  executor    │           │ │
│  │  │  _manager    │  │ (Schema)     │  │ (Runner)     │           │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                      │
│  ┌─────────────────────────────▼───────────────────────────────────┐ │
│  │                       CORE LAYER                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐                              │ │
│  │  │   config     │  │ permissions  │                              │ │
│  │  │ (Settings)   │  │ (Security)   │                              │ │
│  │  └──────────────┘  └──────────────┘                              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
              │                                    │
              ▼                                    ▼
    ┌─────────────────┐                  ┌─────────────────┐
    │   AI AGENTS     │                  │    DATABASE     │
    │   (External)    │                  │  (PostgreSQL)   │
    └─────────────────┘                  └─────────────────┘
```

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── main.py                    # Application entry point
│   ├── api/                       # API endpoint routers
│   │   ├── db_connect.py         # Database connection endpoints
│   │   ├── user_query.py         # Query processing endpoints
│   │   └── dev_control.py        # Developer approval endpoints
│   ├── services/                  # Business logic layer
│   │   ├── ai_service.py         # AI agent communication
│   │   ├── query_service.py      # Query orchestration
│   │   └── execution_service.py  # SQL execution
│   ├── db/                        # Database operations
│   │   ├── connection_manager.py # Session management
│   │   ├── metadata.py           # Schema extraction
│   │   └── executor.py           # Query runner
│   ├── schemas/                   # Pydantic models
│   │   ├── request.py            # Request validation
│   │   └── response.py           # Response formatting
│   ├── core/                      # Core configuration
│   │   ├── config.py             # App settings
│   │   └── permissions.py        # SQL safety validation
│   └── logs/                      # Audit logs
│       └── audit.log
├── requirements.txt
└── README.md
```

---

## 🔧 Component Deep Dive

### 1. Main Application (`main.py`)

The entry point that bootstraps the FastAPI application with:

```python
# Key Features Configured:
- Lifespan management (startup/shutdown)
- CORS middleware for frontend access
- Custom exception handlers
- API router registration
- Swagger/ReDoc documentation
```

**Key Responsibilities:**
- Application lifecycle management
- Middleware configuration
- Global error handling
- Route registration

### 2. API Layer (`api/`)

#### `db_connect.py` - Database Connection Management
```
POST /db/connect    → Create new database session
POST /db/disconnect → Close database session
GET  /db/status     → Check session status
```

#### `user_query.py` - Query Processing
```
POST /query         → Process natural language query
```

#### `dev_control.py` - Developer Approval
```
POST /approve       → Approve pending SQL query
POST /reject        → Reject pending SQL query
```

### 3. Service Layer (`services/`)

#### `ai_service.py` - AI Agent Communication

```python
class AIAgentService:
    """Handles communication with external AI agents"""
    
    async def process_query(
        natural_query: str,
        schema: str,
        session_id: str
    ) -> Tuple[bool, Optional[Dict], Optional[str]]:
        # Sends query to AI agent
        # Returns: (success, ai_response, error_message)
```

**Key Features:**
- Async HTTP communication with AI service
- Timeout handling (default: 30s)
- Response validation
- Error handling and logging

#### `query_service.py` - Query Orchestration

```python
class QueryService:
    """Orchestrates the complete query pipeline"""
    
    async def process_natural_query(
        session_id: str,
        natural_query: str,
        mode: QueryMode
    ) -> Dict:
        # 1. Validate session
        # 2. Extract database schema
        # 3. Send to AI agent
        # 4. Validate response
        # 5. Return result based on mode
```

**Workflow States:**
| State | Description |
|-------|-------------|
| `failed` | Session invalid or AI error |
| `blocked` | Query deemed unsafe |
| `pending_approval` | Awaiting developer approval |
| `ready_for_execution` | Safe to execute |

#### `execution_service.py` - SQL Execution

```python
class ExecutionService:
    """Handles actual SQL execution"""
    
    def execute_sql(
        session_id: str,
        sql: str
    ) -> Dict:
        # 1. Backend safety validation
        # 2. Execute with timeout
        # 3. Apply row limits
        # 4. Return results
```

### 4. Database Layer (`db/`)

#### `connection_manager.py` - Session Management

```python
class ConnectionManager:
    """Singleton pattern for managing database sessions"""
    
    # Features:
    - Thread-safe session storage
    - UUID-based session IDs
    - Connection pooling (SQLAlchemy)
    - Automatic cleanup of idle sessions
```

**Session Lifecycle:**
```
Create Session → Store in Memory → Access via Session ID → Cleanup on Disconnect
```

**Security Features:**
- Credentials NEVER logged
- Memory-only storage (no disk persistence)
- Automatic expiration (30 min idle)
- Connection string built internally

#### `metadata.py` - Schema Extraction

```python
class MetadataExtractor:
    """Extracts database schema for AI context"""
    
    def get_schema_info(engine, db_type) -> Dict:
        # Returns: tables, columns, types, relationships
    
    def format_schema_for_ai(schema_info) -> str:
        # Formats schema for LLM consumption
```

### 5. Core Layer (`core/`)

#### `config.py` - Application Settings

```python
class Settings(BaseSettings):
    # Application
    APP_NAME: str = "LeepSQL-AI Backend"
    APP_VERSION: str = "1.0.0"
    
    # AI Agent
    AI_AGENT_URL: str = "http://localhost:9000/process"
    AI_AGENT_TIMEOUT: int = 30
    
    # Query Limits
    MAX_QUERY_ROWS: int = 1000
    QUERY_TIMEOUT: int = 30
    
    # Security
    ALLOWED_ORIGINS: list = ["http://localhost:5173"]
```

#### `permissions.py` - SQL Safety Validation

```python
class SQLPermissionChecker:
    """Validates SQL queries for safety"""
    
    BLOCKED_KEYWORDS = {
        'DROP', 'TRUNCATE', 'ALTER', 'CREATE',
        'GRANT', 'REVOKE', 'EXECUTE', 'EXEC',
        'INSERT', 'UPDATE'
    }
    
    def validate_sql(sql: str) -> Tuple[bool, str]:
        # Returns: (is_safe, reason)
```

**Blocked Operations:**
| Operation | Reason |
|-----------|--------|
| `DROP` | Prevents data/schema destruction |
| `DELETE` (without WHERE) | Prevents mass data deletion |
| `TRUNCATE` | Prevents table emptying |
| `ALTER` | Prevents schema modification |
| `INSERT/UPDATE` | Read-only by default |
| `pg_sleep` | Prevents DoS attacks |

---

## 🔐 Security Implementation

### Defense in Depth

```
Layer 1: Frontend Validation
    │
    ▼
Layer 2: API Schema Validation (Pydantic)
    │
    ▼
Layer 3: AI Safety Evaluation
    │
    ▼
Layer 4: Backend Permission Check
    │
    ▼
Layer 5: Database Read-Only Enforcement
```

### Credential Handling

```python
# ❌ NEVER DO THIS
logger.info(f"Connecting with password: {password}")

# ✅ CORRECT APPROACH
logger.info(f"Creating session for database: {database}")
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/db/connect` | Create database session |
| `POST` | `/db/disconnect` | Close session |
| `GET` | `/db/status` | Check session status |
| `POST` | `/query` | Process NL query |
| `POST` | `/approve` | Approve pending query |
| `POST` | `/reject` | Reject pending query |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/redoc` | ReDoc UI |

---

## ⚙️ Configuration

### Environment Variables

```env
# AI Agent
AI_AGENT_URL=http://localhost:9000/process
AI_AGENT_TIMEOUT=30

# Security
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Query Limits
MAX_QUERY_ROWS=1000
QUERY_TIMEOUT=30

# Logging
LOG_LEVEL=INFO
```

### Requirements

```
fastapi>=0.100.0
uvicorn>=0.22.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
httpx>=0.24.0
sqlparse>=0.4.4
python-dotenv>=1.0.0
```

---

## 🚀 Running the Backend

### Development Mode
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## ❓ Cross Questions & Answers

### Q1: Why use session-based connections instead of connection pooling?

**A:** Session-based connections provide:
1. **Credential isolation** - Each user's credentials are isolated
2. **Audit trail** - Easy to track which user made which query
3. **Security** - Credentials only exist in memory for active sessions
4. **Multi-database support** - Different users can connect to different databases

### Q2: Why does the backend validate SQL when AI already does?

**A:** **Defense in Depth Principle:**
- AI can hallucinate or be prompt-injected
- Backend validation is deterministic and reliable
- Multiple layers ensure no dangerous query slips through
- Backend is the last line of defense before database

### Q3: Why is the AI Agent separate from the backend?

**A:** **Separation of Concerns:**
- AI agents can be scaled independently
- Different LLMs can be swapped without backend changes
- AI service can be replaced with OpenAI, Claude, etc.
- Resource isolation (GPU for AI, CPU for backend)

### Q4: How does the backend handle concurrent requests?

**A:** FastAPI with async/await handles concurrency:
- Connection manager uses thread-safe locks
- Each session has isolated state
- Database connections use SQLAlchemy pooling
- Async HTTP calls to AI service

### Q5: What happens if the AI service is down?

**A:** The backend handles this gracefully:
```python
except httpx.TimeoutException:
    return False, None, "AI service timeout"
except httpx.ConnectError:
    return False, None, "AI service unavailable"
```
User receives a clear error message, no query is executed.

---

*Next: [03_FRONTEND_GUIDE.md](03_FRONTEND_GUIDE.md)*
