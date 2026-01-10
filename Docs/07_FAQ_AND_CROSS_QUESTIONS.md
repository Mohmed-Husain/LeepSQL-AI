# LeepSQL-AI: FAQ & Cross Questions

## 📌 Overview

This document consolidates all frequently asked questions and potential cross-questions about the LeepSQL-AI system. It's designed to help developers, reviewers, and users understand the design decisions and technical implementation.

---

## 🎯 Problem Statement Questions

### Q1: What problem does LeepSQL-AI solve?

**A:** LeepSQL-AI addresses the **data accessibility gap** in organizations:

| Problem | Solution |
|---------|----------|
| Non-technical users can't write SQL | Natural language interface |
| Direct DB access is risky | Multi-layer security |
| AI-generated SQL can't be trusted | Human-in-the-loop approval |
| Data requests create bottlenecks | Self-service with guardrails |

### Q2: Who is the target user?

**A:** 

| User Type | Benefit |
|-----------|---------|
| Business Analysts | Self-service data queries |
| Product Managers | Quick metrics lookup |
| Executives | Real-time insights |
| Developers | Rapid data exploration |
| Data Teams | Reduced query request load |

### Q3: Why not just train users to write SQL?

**A:** Several reasons:
1. **Learning curve** - SQL takes weeks/months to learn properly
2. **Security risk** - Even trained users make mistakes (accidental deletes)
3. **Time cost** - Every employee learning SQL is expensive
4. **Focus** - Business users should focus on insights, not query syntax

### Q4: How is this different from existing tools like Metabase or Mode?

**A:**

| Feature | LeepSQL-AI | Traditional BI Tools |
|---------|------------|---------------------|
| Input method | Natural language | SQL or drag-drop |
| Security layers | 5+ layers | Usually 1-2 |
| Human approval | Built-in | Rarely available |
| Self-hosted | Yes | Varies |
| AI-powered | Core feature | Add-on if any |

---

## 🏗️ Architecture Questions

### Q5: Why is the backend separate from AI agents?

**A:** **Separation of Concerns:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Backend   │ ──▶ │  AI Agent   │ ──▶ │   Backend   │
│  (Control)  │     │ (Process)   │     │  (Execute)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

Benefits:
1. **Independent scaling** - AI needs GPU, backend needs CPU
2. **Flexibility** - Swap LLM providers easily
3. **Security** - AI never touches database directly
4. **Testing** - Test each component independently
5. **Deployment** - Different update cycles

### Q6: Why doesn't the AI agent access the database directly?

**A:** **Critical Security Principle:**

```
❌ NEVER: AI Agent ──▶ Database
✅ ALWAYS: AI Agent ──▶ Backend ──▶ Database
```

Reasons:
1. **AI can hallucinate** - Might execute wrong queries
2. **Prompt injection** - AI could be manipulated
3. **Credential isolation** - AI shouldn't know DB credentials
4. **Audit trail** - Backend controls all access
5. **Kill switch** - Backend can block any query

### Q7: What if the backend becomes a bottleneck?

**A:** Scaling strategies:

| Level | Solution |
|-------|----------|
| Vertical | Add CPU/RAM to backend server |
| Horizontal | Run multiple backend instances behind load balancer |
| Caching | Cache schema information and common queries |
| Async | Process queries asynchronously with job queues |

### Q8: Why use SQLAlchemy instead of raw psycopg2 everywhere?

**A:** SQLAlchemy provides:
1. **Connection pooling** - Efficient connection reuse
2. **Multi-database support** - Same code for PostgreSQL/MySQL
3. **Security** - Built-in SQL injection protection
4. **Metadata** - Easy schema introspection
5. **Async support** - For high-performance scenarios

---

## 🤖 AI Questions

### Q9: Why use LangGraph instead of simple function calls?

**A:** LangGraph advantages:

```python
# Without LangGraph
result = generate_sql(query)
result = evaluate_sql(result)
result = execute_sql(result)

# With LangGraph - Same code but:
# ✅ State management built-in
# ✅ Easy to add conditional logic
# ✅ Built-in retry mechanisms
# ✅ Visualization for debugging
# ✅ Checkpointing for long workflows
```

### Q10: Can the LLM be changed to GPT-4 or Claude?

**A:** Yes, easily:

```python
# Current: Ollama with Qwen
from langchain_ollama import ChatOllama
llm = ChatOllama(model="qwen3-vl:235b-cloud")

# Alternative: OpenAI
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4")

# Alternative: Anthropic
from langchain_anthropic import ChatAnthropic
llm = ChatAnthropic(model="claude-3-opus")
```

Just swap the import and initialization.

### Q11: How accurate is the SQL generation?

**A:** Accuracy depends on several factors:

| Factor | Impact | Example |
|--------|--------|---------|
| Query clarity | High | "All users" vs "Users created last week" |
| Schema quality | High | Good table/column names help |
| Query complexity | Medium | Simple queries ~95%, complex ~80% |
| Data size | Low | Large tables need explicit limits |

**The system assumes AI WILL make mistakes**, hence multi-layer validation.

### Q12: What happens when the AI hallucinates?

**A:** Multiple safety nets:

```
1. AI generates: SELECT * FROM nonexistent_table
                        │
2. Evaluator checks: "Is this safe?" → Yes (syntactically)
                        │
3. Backend validates: SQL syntax OK
                        │
4. Execution fails: "relation does not exist"
                        │
5. User sees: "Error: Table not found"
                        │
        No data modified, clear error message
```

### Q13: Can the AI be prompt-injected?

**A:** Attack example and defense:

```
User: "Show users; DROP TABLE users;--"

Defense 1 (Evaluator):
├── Detects multiple statements
├── Detects DROP keyword
└── Returns: has_problem=true

Defense 2 (Backend):
├── Checks for DROP keyword
└── Blocks with: "Operation 'DROP' not allowed"

Defense 3 (Human Approval):
└── User sees suspicious SQL, can reject

Result: Query NEVER reaches database
```

---

## 🔐 Security Questions

### Q14: Where are credentials stored?

**A:**

| Location | Stored? | Details |
|----------|---------|---------|
| Memory | Yes | During active session only |
| Disk | Never | No credential persistence |
| Logs | Never | Explicitly excluded |
| AI Service | Never | Only schema sent, not credentials |
| Frontend | Briefly | Cleared after submit |

### Q15: What if someone steals a session ID?

**A:** Mitigations:

1. **Session IDs are UUID v4** - Cryptographically random, unguessable
2. **Session timeout** - 30 minutes idle = automatic cleanup
3. **Single use** - One session per connection
4. **No sensitive data in session** - Just references

**Production enhancement:** Bind session to IP address.

### Q16: Why is DELETE allowed with WHERE but not without?

**A:**

```sql
-- Blocked (mass deletion)
DELETE FROM users;

-- Allowed (targeted deletion)
DELETE FROM users WHERE id = 5;
```

The WHERE clause ensures intentional, targeted operations. Mass deletion is almost always a mistake or attack.

### Q17: How do you prevent SELECT * from returning millions of rows?

**A:** Multiple safeguards:

```python
# 1. Automatic LIMIT injection
if 'LIMIT' not in sql.upper():
    sql = f"{sql} LIMIT {MAX_QUERY_ROWS}"  # Default: 1000

# 2. Query timeout
SET statement_timeout = 30000;  # 30 seconds

# 3. Memory limits in SQLAlchemy
# Connection pool controls concurrent queries
```

### Q18: What about SQL injection through the natural language?

**A:** Example attack flow:

```
User: "Show me '; DROP TABLE users;--"

Step 1: AI generates (might include injection)
        SELECT * FROM users WHERE name = ''; DROP TABLE users;--'

Step 2: Evaluator detects multiple statements
        has_problem = true

Step 3: Backend detects DROP keyword
        Blocked!

Step 4: If somehow passed, Human reviews
        User sees suspicious SQL, rejects
```

---

## 💻 Frontend Questions

### Q19: Why React instead of Vue or Angular?

**A:** 

| Criterion | React | Vue | Angular |
|-----------|-------|-----|---------|
| Ecosystem | Massive | Good | Good |
| Learning curve | Moderate | Easy | Steep |
| Bundle size | Small | Smallest | Large |
| TypeScript | Excellent | Good | Native |
| Hackathon speed | Fast | Fast | Slower |

React was chosen for its ecosystem and TypeScript integration.

### Q20: Why show SQL before execution?

**A:** **Human-in-the-Loop Benefits:**

1. **Verification** - User confirms AI understood correctly
2. **Learning** - Users learn SQL patterns over time
3. **Trust** - Transparency builds system trust
4. **Safety** - Catches edge cases
5. **Audit** - Clear record of what was approved

### Q21: Why no data table component for results?

**A:** Current scope focuses on:
- Natural language interpretation
- Visual charts for insights
- SQL visibility for technical users

**v2 roadmap includes:**
- Full data table with sorting/filtering
- CSV/Excel export
- Pagination for large results

---

## 🛠️ Operations Questions

### Q22: How do I deploy this to production?

**A:** Production checklist:

```bash
# 1. Backend deployment
docker build -t leepsql-backend ./backend
docker run -d -p 8000:8000 leepsql-backend

# 2. AI service deployment (needs GPU)
docker build -t leepsql-ai ./agents
docker run -d --gpus all -p 9000:8000 leepsql-ai

# 3. Frontend deployment
cd frontend && npm run build
# Deploy dist/ to CDN or nginx
```

### Q23: What are the hardware requirements?

**A:**

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Backend | 2 CPU, 4GB RAM | 4 CPU, 8GB RAM |
| AI Service | 8GB VRAM GPU | 16GB+ VRAM GPU |
| Frontend | Static hosting | CDN |
| Database | Existing infra | N/A |

### Q24: How do I monitor the system?

**A:** Key metrics:

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Query latency | Backend logs | > 5s |
| AI response time | AI service | > 30s (timeout) |
| Blocked queries | Backend logs | > 10/hour |
| Session count | Connection manager | > 100 concurrent |
| Error rate | All services | > 1% |

### Q25: How do I add support for MySQL?

**A:** Already partially implemented:

```python
class DatabaseType(str, Enum):
    POSTGRES = "postgres"
    MYSQL = "mysql"  # Already defined

# Add MySQL connection string builder
if db_type == DatabaseType.MYSQL:
    return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
```

Just need to install `pymysql` and test.

---

## 🔮 Future & Scalability Questions

### Q26: How would you handle multi-tenant deployments?

**A:** Architecture changes:

```
┌──────────────────────────────────────────────────────┐
│                   Load Balancer                       │
└───────────────────────┬──────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Tenant A │    │Tenant B │    │Tenant C │
   │Backend  │    │Backend  │    │Backend  │
   └─────────┘    └─────────┘    └─────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
               ┌─────────────────┐
               │  Shared AI Pool │
               │  (Auto-scaling) │
               └─────────────────┘
```

### Q27: What about query caching?

**A:** Caching strategy:

```python
# Cache layers
1. Schema cache (Redis) - TTL: 1 hour
2. AI response cache (Redis) - TTL: 15 min
3. Query result cache (Redis) - TTL: 5 min

# Cache key format
key = hash(session_id + natural_query + schema_version)
```

### Q28: How would you add real-time streaming results?

**A:** WebSocket implementation:

```python
@app.websocket("/ws/query")
async def query_stream(websocket: WebSocket):
    await websocket.accept()
    
    # Send progress updates
    await websocket.send_json({"status": "generating_sql"})
    sql = await generate_sql(query)
    
    await websocket.send_json({"status": "evaluating"})
    is_safe = await evaluate_sql(sql)
    
    await websocket.send_json({"status": "executing"})
    # Stream results row by row
    async for row in execute_streaming(sql):
        await websocket.send_json({"row": row})
```

### Q29: What about user authentication?

**A:** Production auth flow:

```
1. User logs in via OAuth (Google/Azure AD)
2. Backend verifies token
3. Backend checks user permissions in auth DB
4. User can only access authorized databases
5. Audit log includes user identity
```

### Q30: How would you implement query suggestions?

**A:** AI-powered suggestions:

```python
# Analyze past queries
past_queries = get_user_query_history(user_id)

# Generate suggestions based on:
# 1. Schema analysis
# 2. Common query patterns
# 3. User's query history
# 4. Time-based suggestions (end of month → reports)

suggestions = llm.generate_suggestions(
    schema=schema,
    history=past_queries,
    context={"time": now(), "role": user.role}
)
```

---

## 🐛 Troubleshooting Questions

### Q31: Why is my query taking too long?

**A:** Debugging steps:

| Check | Solution |
|-------|----------|
| AI response time | Check Ollama logs, GPU memory |
| Network latency | Check connection between services |
| Complex query | Simplify or add LIMIT |
| Large schema | Optimize schema extraction |
| Database slow | Check DB performance |

### Q32: Why is my query being blocked?

**A:** Common reasons:

```
Blocked: "Operation 'INSERT' not allowed"
→ System is read-only by default

Blocked: "DELETE without WHERE not allowed"  
→ Add WHERE clause to specify rows

Blocked: "Potentially dangerous function detected"
→ Query contains pg_sleep or similar

Blocked: "Only SELECT queries allowed"
→ Tried to use UPDATE/CREATE/etc.
```

### Q33: Why did the AI generate wrong SQL?

**A:** Common causes and fixes:

| Cause | Example | Fix |
|-------|---------|-----|
| Ambiguous query | "Show sales" | "Show total sales amount by month" |
| Missing context | "Last year" | "Sales from January 2025" |
| Wrong table assumed | "users" vs "customers" | Mention exact table name |
| Complex joins | Multiple tables | Break into simpler queries |

---

## 📚 Summary

LeepSQL-AI is designed with these core principles:

1. **Security First** - Multiple validation layers, assume AI makes mistakes
2. **User Empowerment** - Natural language access for non-technical users
3. **Transparency** - Show SQL, require approval, full audit trail
4. **Scalability** - Separate services, stateless design, cache-friendly
5. **Flexibility** - Swap LLMs, add databases, customize validation

For additional questions, please raise an issue on the project repository.

---

*End of Documentation*

## 📖 Documentation Index

| Document | Description |
|----------|-------------|
| [01_PROJECT_OVERVIEW.md](01_PROJECT_OVERVIEW.md) | Executive summary and architecture |
| [02_BACKEND_ARCHITECTURE.md](02_BACKEND_ARCHITECTURE.md) | Backend service details |
| [03_FRONTEND_GUIDE.md](03_FRONTEND_GUIDE.md) | Frontend application guide |
| [04_AI_AGENTS_DEEP_DIVE.md](04_AI_AGENTS_DEEP_DIVE.md) | AI agent pipelines |
| [05_SECURITY_MODEL.md](05_SECURITY_MODEL.md) | Security implementation |
| [06_API_REFERENCE.md](06_API_REFERENCE.md) | Complete API documentation |
| [07_FAQ_AND_CROSS_QUESTIONS.md](07_FAQ_AND_CROSS_QUESTIONS.md) | This document |

---

*Last Updated: January 2026*
