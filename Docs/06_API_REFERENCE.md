# LeepSQL-AI: API Reference

## 📌 Overview

This document provides complete API documentation for both the **Backend Service** and the **AI Agents Service**. Both services expose REST APIs for different purposes.

---

## 🌐 Service Endpoints

| Service | Default URL | Purpose |
|---------|-------------|---------|
| Backend | `http://localhost:8000` | Main application backend |
| AI Agents | `http://localhost:9000` | AI processing pipelines |

---

# Backend API

## Base URL
```
http://localhost:8000
```

## Interactive Documentation
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## 📡 Endpoints

### Health Check

#### `GET /health`

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-10T14:30:00Z"
}
```

---

### Database Connection

#### `POST /db/connect`

Create a new database connection session.

**Request Body:**
```json
{
  "db_type": "postgres",
  "host": "db.example.com",
  "port": 5432,
  "database": "mydb",
  "username": "user",
  "password": "********"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `db_type` | string | Yes | `postgres` or `mysql` |
| `host` | string | Yes | Database host address |
| `port` | integer | Yes | Database port (1-65535) |
| `database` | string | Yes | Database name |
| `username` | string | Yes | Database username |
| `password` | string | Yes | Database password |

**Success Response (200):**
```json
{
  "status": "connected",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "database": "mydb",
  "message": "Successfully connected to database"
}
```

**Error Response (400):**
```json
{
  "detail": "Connection failed: could not connect to server"
}
```

---

#### `POST /db/disconnect`

Close an active database session.

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "status": "disconnected",
  "message": "Session closed successfully"
}
```

---

#### `GET /db/status`

Check status of a database session.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID to check |

**Request:**
```
GET /db/status?session_id=550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "status": "active",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "database": "mydb",
  "created_at": "2026-01-10T14:00:00Z",
  "last_accessed": "2026-01-10T14:30:00Z"
}
```

**Not Found Response (404):**
```json
{
  "status": "not_found",
  "message": "Session not found or expired"
}
```

---

### Query Processing

#### `POST /query`

Process a natural language query.

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "Show me all customers from New York",
  "mode": "user"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `session_id` | string | Yes | - | Database session ID |
| `query` | string | Yes | - | Natural language query |
| `mode` | string | No | `user` | `user` (auto-execute) or `dev` (manual approval) |

**Response Scenarios:**

#### Scenario 1: Query Executed (User Mode, Safe Query)
```json
{
  "status": "executed",
  "sql": "SELECT * FROM customers WHERE city = 'New York'",
  "data": [
    {"id": 1, "name": "John Doe", "city": "New York"},
    {"id": 2, "name": "Jane Smith", "city": "New York"}
  ],
  "columns": ["id", "name", "city"],
  "row_count": 2,
  "execution_time_ms": 45.2
}
```

#### Scenario 2: Pending Approval (Dev Mode)
```json
{
  "status": "pending_approval",
  "sql": "SELECT * FROM customers WHERE city = 'New York'",
  "message": "Query requires approval. Use /approve endpoint."
}
```

#### Scenario 3: Query Blocked (Unsafe)
```json
{
  "status": "blocked",
  "reason": "Operation 'DROP' is not allowed in read-only mode"
}
```

#### Scenario 4: Error
```json
{
  "detail": "AI service timeout after 30 seconds"
}
```

---

### Developer Approval

#### `POST /approve`

Approve a pending SQL query (Dev Mode).

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "status": "executed",
  "data": [...],
  "columns": [...],
  "row_count": 10,
  "execution_time_ms": 32.5
}
```

---

#### `POST /reject`

Reject a pending SQL query (Dev Mode).

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "status": "rejected",
  "message": "Query rejected and discarded"
}
```

---

# AI Agents API

## Base URL
```
http://localhost:8000
```
(Note: In the current implementation, AI agents run on the same port)

---

## 📡 Endpoints

### Root

#### `GET /`

Service information.

**Response:**
```json
{
  "message": "SQL Security Evaluator API",
  "version": "1.0.0",
  "endpoints": {
    "/query": "POST - Execute secure SQL query",
    "/health": "GET - Health check"
  }
}
```

---

### SQL Generation

#### `POST /api/generate`

Generate SQL from natural language query.

**Request Body:**
```json
{
  "user_query": "Show me all users from the sales department",
  "postgres_url": "postgresql://user:pass@host:5432/dbname",
  "db_name": "mydb"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_query` | string | Yes | Natural language query |
| `postgres_url` | string | Yes | PostgreSQL connection URL |
| `db_name` | string | Yes | Database name |

**Success Response (200):**
```json
{
  "sql_query": "SELECT * FROM users WHERE department = 'sales'"
}
```

**Error Response (500):**
```json
{
  "detail": "Error message here"
}
```

---

### SQL Evaluation

#### `POST /api/evaluater`

Evaluate SQL query for security issues.

**Request Body:**
```json
{
  "user_query": "Show me all users",
  "sql_query": "SELECT * FROM users",
  "has_problem": false,
  "problem_description": ""
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user_query` | string | Yes | - | Original user query |
| `sql_query` | string | Yes | - | Generated SQL to evaluate |
| `has_problem` | boolean | No | `false` | Initial problem flag |
| `problem_description` | string | No | `" "` | Initial description |

**Response - Safe Query:**
```json
{
  "has_problem": false,
  "problem_description": ""
}
```

**Response - Unsafe Query:**
```json
{
  "has_problem": true,
  "problem_description": "Query contains DROP TABLE which could destroy data"
}
```

---

### SQL Execution

#### `POST /api/executer`

Execute SQL query and return results.

**Request Body:**
```json
{
  "sql_query": "SELECT * FROM users LIMIT 10"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sql_query` | string | Yes | SQL query to execute |

**Success Response (200):**
```json
[
  {"id": 1, "name": "John", "email": "john@example.com"},
  {"id": 2, "name": "Jane", "email": "jane@example.com"}
]
```

---

## 📊 Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid request body or parameters |
| `401` | Unauthorized | Invalid or missing authentication |
| `404` | Not Found | Resource not found (e.g., session) |
| `422` | Validation Error | Request body failed validation |
| `500` | Server Error | Internal error or AI service failure |
| `503` | Service Unavailable | AI service unreachable |

---

## 🔄 Complete API Flow Example

### Step 1: Connect to Database

```bash
curl -X POST http://localhost:8000/db/connect \
  -H "Content-Type: application/json" \
  -d '{
    "db_type": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "sales",
    "username": "admin",
    "password": "secret"
  }'
```

**Response:**
```json
{
  "status": "connected",
  "session_id": "abc-123-def-456"
}
```

### Step 2: Process Natural Language Query

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123-def-456",
    "query": "What were the top 10 selling products last month?",
    "mode": "user"
  }'
```

**Response:**
```json
{
  "status": "executed",
  "sql": "SELECT product_name, SUM(quantity) as total FROM orders WHERE order_date >= '2025-12-01' GROUP BY product_name ORDER BY total DESC LIMIT 10",
  "data": [
    {"product_name": "Widget A", "total": 1500},
    {"product_name": "Widget B", "total": 1200}
  ],
  "columns": ["product_name", "total"],
  "row_count": 10,
  "execution_time_ms": 125.3
}
```

### Step 3: Disconnect

```bash
curl -X POST http://localhost:8000/db/disconnect \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123-def-456"
  }'
```

---

## 📋 Request/Response Schemas

### Pydantic Models (Backend)

```python
# Request Schemas

class DatabaseType(str, Enum):
    POSTGRES = "postgres"
    MYSQL = "mysql"

class QueryMode(str, Enum):
    USER = "user"
    DEV = "dev"

class DBConnectRequest(BaseModel):
    db_type: DatabaseType
    host: str
    port: int
    database: str
    username: str
    password: str

class UserQueryRequest(BaseModel):
    session_id: str
    query: str
    mode: QueryMode = QueryMode.USER

# Response Schemas

class QueryResponse(BaseModel):
    status: str  # "executed", "blocked", "pending_approval"
    sql: Optional[str] = None
    data: Optional[List[Dict]] = None
    columns: Optional[List[str]] = None
    row_count: Optional[int] = None
    execution_time_ms: Optional[float] = None
    reason: Optional[str] = None
```

### Pydantic Models (AI Agents)

```python
class GenerateFormat(BaseModel):
    user_query: str
    postgres_url: str
    db_name: str

class EvaluatorFormat(BaseModel):
    user_query: str
    sql_query: str
    has_problem: bool = False
    problem_description: str = " "

class ExecuterFormat(BaseModel):
    sql_query: str
```

---

## 🔐 Authentication

### Current Implementation
- Session-based authentication
- Session ID returned on `/db/connect`
- Session ID required for all subsequent requests

### Production Recommendations
```
Authorization: Bearer <jwt_token>
```

---

## 📈 Rate Limiting (Production)

| Endpoint | Limit |
|----------|-------|
| `/db/connect` | 10/minute per IP |
| `/query` | 60/minute per session |
| `/api/generate` | 30/minute per IP |

---

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:8000/health

# Generate SQL
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"user_query": "show all users", "postgres_url": "...", "db_name": "test"}'

# Evaluate SQL
curl -X POST http://localhost:8000/api/evaluater \
  -H "Content-Type: application/json" \
  -d '{"user_query": "show users", "sql_query": "SELECT * FROM users", "has_problem": false, "problem_description": ""}'
```

### Using Python

```python
import httpx

async def query_database():
    async with httpx.AsyncClient() as client:
        # Connect
        response = await client.post(
            "http://localhost:8000/db/connect",
            json={
                "db_type": "postgres",
                "host": "localhost",
                "port": 5432,
                "database": "test",
                "username": "user",
                "password": "pass"
            }
        )
        session_id = response.json()["session_id"]
        
        # Query
        response = await client.post(
            "http://localhost:8000/query",
            json={
                "session_id": session_id,
                "query": "Show all active users",
                "mode": "user"
            }
        )
        return response.json()
```

---

## ❓ Cross Questions & Answers

### Q1: Why are there two separate APIs (Backend and AI)?

**A:** Separation of concerns:
- **Backend API** handles user auth, sessions, security validation, execution
- **AI API** handles NL processing, SQL generation, evaluation
- They can be scaled independently
- AI can be replaced without changing backend

### Q2: What's the difference between `/query` and `/api/generate`?

**A:** 
- `/query` (Backend): Complete workflow - validates, generates, evaluates, executes
- `/api/generate` (AI): Only generates SQL from natural language

### Q3: How do I use developer mode?

**A:**
```json
// Step 1: Submit with mode "dev"
POST /query
{"session_id": "...", "query": "...", "mode": "dev"}

// Response: pending_approval with SQL

// Step 2: Review SQL, then approve or reject
POST /approve
{"session_id": "..."}
```

### Q4: What happens if session expires during a query?

**A:** The query fails with:
```json
{
  "status": "failed",
  "message": "Invalid or expired session ID"
}
```
User must reconnect with `/db/connect`.

### Q5: Can I execute raw SQL without natural language?

**A:** Yes, using the AI executor directly:
```bash
POST /api/executer
{"sql_query": "SELECT * FROM users LIMIT 5"}
```
⚠️ Warning: This bypasses natural language processing but still uses the configured database.

---

*Next: [07_FAQ_AND_CROSS_QUESTIONS.md](07_FAQ_AND_CROSS_QUESTIONS.md)*
