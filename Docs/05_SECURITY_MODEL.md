# LeepSQL-AI: Security Model

## 📌 Overview

Security is the cornerstone of LeepSQL-AI. The system is designed with the assumption that **AI can and will make mistakes**, and that **users may intentionally or unintentionally request dangerous operations**. This document details the multi-layered security architecture.

---

## 🛡️ Security Philosophy

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Defense in Depth** | Multiple security layers, each independent |
| **Zero Trust** | All AI output is untrusted until validated |
| **Least Privilege** | Read-only by default, no schema modifications |
| **Fail Secure** | On any doubt, block the query |
| **Audit Everything** | Complete logging without credentials |

---

## 🏗️ Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 1: Frontend Input Validation                               │ │
│  │ • Basic input sanitization                                       │ │
│  │ • Length limits on queries                                       │ │
│  │ • Connection string format validation                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 2: API Schema Validation (Pydantic)                        │ │
│  │ • Type checking                                                  │ │
│  │ • Required field validation                                      │ │
│  │ • Format constraints                                             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 3: AI Safety Evaluation                                    │ │
│  │ • LLM-based security analysis                                    │ │
│  │ • Pattern recognition for dangerous operations                   │ │
│  │ • Context-aware evaluation                                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 4: Backend SQL Permission Check                            │ │
│  │ • Deterministic rule-based validation                            │ │
│  │ • Keyword blocking (DROP, DELETE, etc.)                          │ │
│  │ • Read-only enforcement                                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 5: Human Approval (Developer Mode)                         │ │
│  │ • Manual SQL review before execution                             │ │
│  │ • Approve/Reject workflow                                        │ │
│  │ • Complete SQL visibility                                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 6: Execution Safeguards                                    │ │
│  │ • Query timeouts (30s default)                                   │ │
│  │ • Row limits (1000 default)                                      │ │
│  │ • Connection pooling limits                                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Credential Security

### Memory-Only Storage

```python
class ConnectionManager:
    """
    Credentials are NEVER:
    - Written to disk
    - Logged to files
    - Sent to AI service
    - Stored in environment variables
    """
    
    def __init__(self):
        # In-memory dictionary only
        self._sessions: Dict[str, DatabaseSession] = {}
```

### No Credential Logging

```python
# ❌ NEVER DO THIS
logger.info(f"Connecting with password: {password}")
logger.info(f"Connection string: {connection_string}")

# ✅ CORRECT APPROACH
logger.info(f"Creating session for database: {database}")
logger.info(f"Session created: {session_id} [{db_type}://{host}:{port}/{database}]")
```

### Connection String Building

```python
def _build_connection_string(
    self,
    db_type: DatabaseType,
    host: str,
    port: int,
    database: str,
    username: str,
    password: str  # Used only here, then discarded
) -> str:
    """Build connection string internally. Password never stored."""
    
    if db_type == DatabaseType.POSTGRES:
        return f"postgresql://{username}:{password}@{host}:{port}/{database}"
    # Connection string used immediately for engine creation
    # Password reference goes out of scope after this function
```

---

## 🛑 SQL Permission System

### Blocked Operations

```python
class SQLPermissionChecker:
    """Backend's deterministic SQL validation."""
    
    # Always blocked - no exceptions
    BLOCKED_KEYWORDS = {
        'DROP',      # Prevents schema/data destruction
        'TRUNCATE',  # Prevents table clearing
        'ALTER',     # Prevents schema modification
        'CREATE',    # Prevents schema creation
        'GRANT',     # Prevents privilege escalation
        'REVOKE',    # Prevents privilege changes
        'EXECUTE',   # Prevents stored procedure execution
        'EXEC',      # SQL Server equivalent
        'INSERT',    # No data modification (by default)
        'UPDATE'     # No data modification (by default)
    }
```

### Conditional Blocks

```python
# DELETE is allowed ONLY with WHERE clause
CONDITIONAL_BLOCKS = {'DELETE'}

def _validate_statement(statement):
    sql_upper = str(statement).upper().strip()
    
    if 'DELETE' in sql_upper:
        if not re.search(r'\bWHERE\b', sql_upper):
            return False, "DELETE without WHERE clause is not allowed"
```

### Dangerous Function Detection

```python
dangerous_patterns = [
    r'pg_sleep',           # DoS via sleep
    r'waitfor\s+delay',    # SQL Server sleep
    r'benchmark\s*\(',     # MySQL benchmark
    r'load_file',          # File system access
    r'into\s+outfile',     # File writing
    r'into\s+dumpfile'     # Binary file writing
]

for pattern in dangerous_patterns:
    if re.search(pattern, sql_upper):
        return False, "Potentially dangerous function detected"
```

---

## 🤖 AI Safety Evaluation

### Evaluator Prompt

```python
prompt = """
You're a security-conscious SQL expert. Evaluate if the provided SQL query 
is dangerous (e.g., could delete/drop tables, expose sensitive data, or 
cause denial-of-service).

Check for:
- Destructive operations (DROP, DELETE without WHERE, TRUNCATE)
- Excessive data exposure (SELECT * on large tables)
- Privilege escalation attempts
- Time-consuming operations (no LIMIT on large queries)
"""
```

### Example Evaluations

| Query | AI Decision | Reason |
|-------|-------------|--------|
| `SELECT * FROM users WHERE id=1` | ✅ Safe | Simple, limited query |
| `SELECT * FROM users` | ⚠️ Warning | No LIMIT, could be large |
| `DROP TABLE users` | ❌ Blocked | Destructive operation |
| `DELETE FROM users` | ❌ Blocked | DELETE without WHERE |
| `SELECT * FROM users; DROP TABLE users;--` | ❌ Blocked | SQL injection pattern |

---

## 👨‍💻 Human-in-the-Loop

### Developer Mode Flow

```
User submits query
        │
        ▼
AI generates SQL
        │
        ▼
┌───────────────────────────────────────┐
│         SQL APPROVAL MODAL            │
│                                       │
│  SELECT * FROM users WHERE            │
│  city = 'New York'                    │
│                                       │
│  [✓ Approve]  [✗ Reject]              │
│                                       │
└───────────────────────────────────────┘
        │
        ├── Approve ──▶ Execute Query
        │
        └── Reject ───▶ Discard Query
```

### Benefits of Human Review

1. **Catches AI Misunderstanding**
   - User asked for "customers" but AI queried "clients"
   - Allows correction before execution

2. **Validates Business Logic**
   - SQL technically correct but wrong context
   - Human can verify intent matches output

3. **Security Last Resort**
   - If all automated checks miss something
   - Human can catch suspicious patterns

---

## ⏱️ Execution Safeguards

### Query Timeout

```python
# config.py
QUERY_TIMEOUT: int = 30  # seconds

# executor.py
with engine.connect() as conn:
    conn.execute(text(f"SET statement_timeout = {settings.QUERY_TIMEOUT * 1000}"))
    result = conn.execute(text(sql))
```

### Row Limits

```python
# config.py
MAX_QUERY_ROWS: int = 1000

# Automatic LIMIT injection
def apply_row_limit(sql: str) -> str:
    if 'LIMIT' not in sql.upper():
        return f"{sql} LIMIT {settings.MAX_QUERY_ROWS}"
    return sql
```

### Connection Pool Limits

```python
engine = create_engine(
    connection_string,
    pool_size=5,           # Max 5 concurrent connections
    max_overflow=10,       # Allow 10 more temporarily
    pool_pre_ping=True,    # Verify connections
    pool_recycle=3600      # Recycle after 1 hour
)
```

---

## 📊 Attack Prevention Examples

### 1. SQL Injection

**Attack:**
```
User Input: "Show users named Robert'; DROP TABLE users;--"
```

**Defense Chain:**
```
Layer 3 (AI): Detects multiple statements, blocks
Layer 4 (Backend): Finds "DROP" keyword, blocks
Result: Query never reaches database
```

### 2. Data Exfiltration

**Attack:**
```
User Input: "Export all passwords to a file"
```

**Defense Chain:**
```
Layer 3 (AI): Detects sensitive data exposure attempt
Layer 4 (Backend): Blocks "into outfile" pattern
Result: Query blocked with security message
```

### 3. Denial of Service

**Attack:**
```
User Input: "Do something for 10 minutes"
Generated SQL: SELECT pg_sleep(600)
```

**Defense Chain:**
```
Layer 3 (AI): Flags pg_sleep as dangerous
Layer 4 (Backend): Detects pg_sleep pattern
Layer 6 (Execution): 30-second timeout would kill it anyway
Result: Triple protection
```

### 4. Privilege Escalation

**Attack:**
```
User Input: "Make me an admin"
Generated SQL: GRANT ALL PRIVILEGES TO current_user
```

**Defense Chain:**
```
Layer 3 (AI): Detects privilege escalation
Layer 4 (Backend): Blocks "GRANT" keyword
Result: Query blocked immediately
```

---

## 🔍 Audit Logging

### What Gets Logged

```
2026-01-10 14:30:22 - INFO - New session created: abc-123 [postgres://host:5432/db]
2026-01-10 14:30:25 - INFO - Query processing started: session=abc-123
2026-01-10 14:30:26 - INFO - AI response: status=safe, sql_length=45
2026-01-10 14:30:26 - INFO - Backend validation: PASSED
2026-01-10 14:30:27 - INFO - Query executed: rows=15, time=45.2ms
```

### What NEVER Gets Logged

```
# Never logged:
- Passwords
- Connection strings with credentials
- Full query results (just counts)
- Personal/sensitive data from queries
```

---

## 🔐 Session Security

### Session Lifecycle

```
Create ──▶ Active ──▶ Idle ──▶ Expired ──▶ Cleanup
                      │
                      └── Access ──▶ Active
```

### Session Properties

| Property | Value | Purpose |
|----------|-------|---------|
| ID Format | UUID v4 | Unpredictable |
| Storage | Memory only | No persistence |
| Idle Timeout | 30 minutes | Auto-cleanup |
| Max per User | Unlimited | Scale horizontally |

### Session Validation

```python
def get_session(self, session_id: str) -> Optional[DatabaseSession]:
    """
    Returns None if:
    - Session doesn't exist
    - Session has expired
    - Invalid session ID format
    """
    with self._sessions_lock:
        session = self._sessions.get(session_id)
        if session is None:
            return None
        if session.is_expired(settings.SESSION_MAX_IDLE_TIME):
            del self._sessions[session_id]
            return None
        session.update_access_time()
        return session
```

---

## ✅ Security Checklist

### For Developers

- [ ] Never log credentials or connection strings
- [ ] Always validate SQL at backend level (don't trust AI)
- [ ] Use parameterized queries where possible
- [ ] Keep AI agent isolated from database
- [ ] Implement rate limiting for production
- [ ] Enable HTTPS in production
- [ ] Use environment variables for secrets
- [ ] Regular security audits

### For Operators

- [ ] Monitor audit logs for suspicious patterns
- [ ] Set up alerts for blocked queries
- [ ] Regular credential rotation
- [ ] Database user should have read-only permissions
- [ ] Network isolation between services
- [ ] Keep dependencies updated

---

## ❓ Cross Questions & Answers

### Q1: What if someone bypasses the AI and calls the executor directly?

**A:** The executor still validates SQL:
```python
# Even direct executor calls go through:
is_safe, reason = SQLPermissionChecker.validate_sql(sql)
if not is_safe:
    return {"status": "blocked", "reason": reason}
```

### Q2: Can an attacker steal credentials from memory?

**A:** Mitigations:
1. Process isolation (each service separate)
2. No credential persistence (volatile memory)
3. Session timeout clears credentials
4. Production would use encrypted memory regions

### Q3: What if the AI is compromised to always say "safe"?

**A:** Backend validation is independent:
- Rule-based, deterministic
- Doesn't call AI for validation
- Hardcoded blocklist that AI cannot modify

### Q4: How do you prevent prompt injection?

**A:** Multiple defenses:
1. User input is clearly separated in prompts
2. Evaluator specifically checks for injection patterns
3. Backend validation catches actual dangerous SQL
4. Human approval as final check

### Q5: What about side-channel attacks (timing, etc.)?

**A:** Current mitigations:
- Fixed timeout for all queries
- Row limits prevent large response timing attacks
- Async processing masks internal timing
- Production would add more jitter

### Q6: Is it safe to use in production?

**A:** For production, additionally:
1. Add rate limiting
2. Implement proper authentication (OAuth)
3. Use HTTPS everywhere
4. Add WAF (Web Application Firewall)
5. Implement IP allowlisting
6. Regular penetration testing

---

*Next: [06_API_REFERENCE.md](06_API_REFERENCE.md)*
