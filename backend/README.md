# LeepSQL-AI Backend

Production-grade FastAPI backend for Natural Language to SQL system with multi-layer validation and human-in-the-loop safety.

## 🏗️ Architecture

```
Frontend ──→ Backend ──→ AI Agent
                ↓
             Database
```

**Key Principles:**
- Backend is the **single control plane**
- AI Agent NEVER accesses database directly
- Frontend NEVER accesses database directly
- All credentials handled securely (memory-only, never logged)

## 🔐 Security Features

- **Session-based database connections** (credentials in memory only)
- **Multi-layer SQL validation** (AI + Backend)
- **Read-only enforcement** by default
- **Query timeouts and row limits**
- **Comprehensive audit logging** (without credential exposure)
- **CORS protection**

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI application entry point
│   ├── api/                       # API endpoints
│   │   ├── db_connect.py         # Database connection management
│   │   ├── user_query.py         # Query processing endpoint
│   │   └── dev_control.py        # Developer approval endpoint
│   ├── services/                  # Business logic layer
│   │   ├── ai_service.py         # AI Agent integration
│   │   ├── query_service.py      # Query orchestration
│   │   └── execution_service.py  # SQL execution
│   ├── db/                        # Database layer
│   │   ├── connection_manager.py # Session management
│   │   ├── metadata.py           # Schema extraction
│   │   └── executor.py           # Query execution
│   ├── schemas/                   # Pydantic models
│   │   ├── request.py            # Request schemas
│   │   └── response.py           # Response schemas
│   ├── core/                      # Core configuration
│   │   ├── config.py             # Settings management
│   │   └── permissions.py        # SQL safety validation
│   └── logs/                      # Audit logs
│       └── audit.log
├── requirements.txt
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment (Optional)

Create `.env` file in `backend/` directory:

```env
# AI Agent Service
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

### 3. Run the Server

```bash
# From backend/ directory
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or run directly:

```bash
python app/main.py
```

### 4. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📡 API Endpoints

### 1. Connect to Database

**POST** `/db/connect`

Establish a new database connection session.

**Request:**
```json
{
  "db_type": "postgres",
  "host": "db.example.com",
  "port": 5432,
  "database": "sales",
  "username": "user",
  "password": "password"
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "connected",
  "message": "Successfully connected to postgres database"
}
```

### 2. Process Query

**POST** `/query`

Process a natural language query.

**Request (User Mode - Auto-execute):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "Show total sales for January",
  "mode": "user"
}
```

**Response (Executed):**
```json
{
  "status": "executed",
  "data": [{"total_sales": 15000}],
  "columns": ["total_sales"],
  "row_count": 1,
  "execution_time_ms": 45.2
}
```

**Request (Dev Mode - Manual Approval):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "Show total sales for January",
  "mode": "dev"
}
```

**Response (Pending Approval):**
```json
{
  "status": "pending_approval",
  "sql": "SELECT SUM(amount) AS total_sales FROM sales WHERE month = 'January'"
}
```

**Response (Blocked):**
```json
{
  "status": "blocked",
  "reason": "Operation 'DROP' is not allowed in read-only mode"
}
```

### 3. Approve Query

**POST** `/approve`

Approve or reject a query pending execution (dev mode only).

**Request:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "sql": "SELECT SUM(amount) AS total_sales FROM sales WHERE month = 'January'",
  "approved": true
}
```

**Response:**
```json
{
  "status": "executed",
  "data": [{"total_sales": 15000}],
  "columns": ["total_sales"],
  "row_count": 1,
  "execution_time_ms": 42.8
}
```

## 🛡️ Safety Features

### SQL Validation Rules

1. **Read-Only Mode**
   - Only `SELECT` queries allowed
   - Blocks: `DROP`, `TRUNCATE`, `ALTER`, `CREATE`, `INSERT`, `UPDATE`
   - `DELETE` only allowed with `WHERE` clause

2. **Query Limits**
   - Maximum rows: 1000 (configurable)
   - Query timeout: 30 seconds (configurable)
   - Automatic `LIMIT` clause injection

3. **Multi-Layer Validation**
   - **Layer 1**: AI Agent safety analysis
   - **Layer 2**: Backend SQL validation
   - Both layers must approve before execution

### Credential Security

- Credentials stored in memory only
- Never logged (even in errors)
- Never returned in API responses
- Session-based access control
- Automatic cleanup of expired sessions

## 🔌 AI Agent Integration

The backend expects an AI Agent service at the configured URL.

**AI Agent Endpoint:** `POST http://localhost:9000/process`

**Request:**
```json
{
  "query": "Show total sales for January",
  "schema": "<database schema information>"
}
```

**Response:**
```json
{
  "sql": "SELECT SUM(amount) FROM sales WHERE month = 'January'",
  "is_safe": true,
  "reason": null
}
```

**Response (Unsafe):**
```json
{
  "sql": "DROP TABLE sales",
  "is_safe": false,
  "reason": "Query contains destructive operation"
}
```

## 🧪 Testing

### Manual Testing with curl

```bash
# 1. Connect to database
curl -X POST http://localhost:8000/db/connect \
  -H "Content-Type: application/json" \
  -d '{
    "db_type": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "testdb",
    "username": "user",
    "password": "password"
  }'

# Save the session_id from response

# 2. Query (user mode)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<session_id>",
    "query": "Show all users",
    "mode": "user"
  }'

# 3. Query (dev mode)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<session_id>",
    "query": "Show all users",
    "mode": "dev"
  }'

# 4. Approve query
curl -X POST http://localhost:8000/approve \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<session_id>",
    "sql": "SELECT * FROM users LIMIT 1000",
    "approved": true
  }'
```

## 📊 Logging

Logs are written to:
- **File**: `app/logs/audit.log`
- **Console**: Standard output

Log format includes:
- Timestamp
- Log level
- Component name
- Message
- **Never includes credentials or sensitive data**

## ⚙️ Configuration

All settings in `app/core/config.py` can be overridden via environment variables.

Key settings:
- `AI_AGENT_URL`: AI service endpoint
- `MAX_QUERY_ROWS`: Maximum rows returned
- `QUERY_TIMEOUT`: Query execution timeout
- `ALLOWED_ORIGINS`: CORS allowed origins
- `LOG_LEVEL`: Logging verbosity

## 🚦 Query Execution Flow

```
1. Frontend sends natural language query
   ↓
2. Backend validates session
   ↓
3. Backend extracts database schema
   ↓
4. Backend calls AI Agent with query + schema
   ↓
5. AI Agent returns SQL + safety verdict
   ↓
6. Backend validates AI response
   ↓
7a. If unsafe → Return blocked status
7b. If dev mode → Return SQL for approval
7c. If user mode → Continue to step 8
   ↓
8. Backend performs secondary SQL validation
   ↓
9. Backend adds LIMIT clause if needed
   ↓
10. Backend executes query with timeout
   ↓
11. Backend returns results to frontend
```

## 🔒 Security Best Practices

1. **Never expose credentials**
   - Use environment variables
   - Never commit `.env` files
   - Rotate credentials regularly

2. **Use HTTPS in production**
   - Configure reverse proxy (nginx, Caddy)
   - Use SSL/TLS certificates

3. **Implement rate limiting**
   - Prevent abuse
   - Use middleware or API gateway

4. **Monitor logs**
   - Set up log aggregation
   - Alert on suspicious patterns

5. **Database user permissions**
   - Use read-only database user
   - Limit to specific schemas/tables

## 📝 License

This project is part of the LeepSQL-AI hackathon submission.

## 🤝 Contributing

This is a hackathon project. For production use, consider:
- Adding authentication/authorization
- Implementing persistent session storage
- Adding rate limiting
- Setting up monitoring and alerting
- Adding more comprehensive tests
- Implementing query caching

---

**Built with ❤️ for GDG Hackathon 2026**
