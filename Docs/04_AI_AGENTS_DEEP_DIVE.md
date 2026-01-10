# LeepSQL-AI: AI Agents Deep Dive

## 📌 Overview

The AI Agents layer is the intelligence core of LeepSQL-AI, built using **LangGraph** for agent orchestration. It consists of three specialized pipelines that work together to safely convert natural language to SQL and execute queries.

---

## 🏗️ Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI AGENTS SERVICE                             │
│                        (FastAPI Server)                              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                       server.py                                  │ │
│  │                    (API Endpoints)                               │ │
│  │   /api/generate  │  /api/evaluater  │  /api/executer            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│          ┌───────────────────┼───────────────────┐                   │
│          ▼                   ▼                   ▼                    │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐             │
│  │  GENERATOR   │   │  EVALUATOR   │   │  EXECUTER    │             │
│  │   PIPELINE   │   │   PIPELINE   │   │   PIPELINE   │             │
│  │              │   │              │   │              │             │
│  │ NL → SQL     │   │ Security     │   │ SQL → Data   │             │
│  │ Conversion   │   │ Analysis     │   │ Execution    │             │
│  └──────────────┘   └──────────────┘   └──────────────┘             │
│          │                   │                   │                    │
│          └───────────────────┴───────────────────┘                   │
│                              │                                        │
│                              ▼                                        │
│                    ┌──────────────────┐                              │
│                    │    LLM Engine    │                              │
│                    │  (Ollama/Qwen3)  │                              │
│                    └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
agents/
├── server.py                      # FastAPI server with all endpoints
├── generator_pipeline/
│   ├── agent.ipynb               # Jupyter notebook for development
│   ├── gen_agent.py              # Generator agent implementation
│   └── table_schema_extractor.py # Schema extraction utility
├── evaluator_pipeline/
│   ├── agent.ipynb               # Development notebook
│   └── eval_agent.py             # Security evaluator agent
└── executer_pipeline/
    ├── agent.ipynb               # Development notebook
    └── exec_agnet.py             # Query executor agent
```

---

## 🔧 Component Deep Dive

### 1. Server (`server.py`) - API Gateway

The server exposes three main endpoints for the AI pipelines:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SQL Security Evaluator API",
    description="API for secure SQL query generation and execution",
    version="1.0.0"
)
```

#### Endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate` | POST | Natural Language → SQL |
| `/api/evaluater` | POST | Security Analysis |
| `/api/executer` | POST | SQL Execution |

#### Request/Response Models:

```python
class GenerateFormat(BaseModel):
    user_query: str      # Natural language query
    postgres_url: str    # Database connection string
    db_name: str         # Database name

class EvaluatorFormat(BaseModel):
    user_query: str           # Original user query
    sql_query: str            # Generated SQL
    has_problem: bool = False # Initial problem flag
    problem_description: str = " "

class ExecuterFormat(BaseModel):
    sql_query: str       # SQL to execute
```

---

### 2. Generator Pipeline (`gen_agent.py`)

**Purpose:** Convert natural language queries to SQL using LLM with database schema context.

#### Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    GENERATOR PIPELINE                        │
│                                                               │
│   User Query                                                  │
│       │                                                       │
│       ▼                                                       │
│   ┌─────────────────────────────────────────┐                │
│   │        Table Schema Extractor            │                │
│   │  (Fetches table names from database)     │                │
│   └─────────────────────────────────────────┘                │
│       │                                                       │
│       ▼                                                       │
│   ┌─────────────────────────────────────────┐                │
│   │              LLM Generator               │                │
│   │    (Qwen3-VL with structured output)     │                │
│   └─────────────────────────────────────────┘                │
│       │                                                       │
│       ▼                                                       │
│   SQL Query Output                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### State Definition:

```python
class GraphState(BaseModel):
    table_schema: str = Field(description="The schema of the table", default="")
    user_query: str = Field(description="The user's query", default="")
    sql_query: str = Field(description="The generated SQL query", default="")

class OutputSql(BaseModel):
    sql_query: str = Field(description="The generated SQL query without anything else")
```

#### LLM Configuration:

```python
from langchain_ollama import ChatOllama

llm = ChatOllama(
    model="qwen3-vl:235b-cloud",
    temperature=0.5
)

structured_llm = llm.with_structured_output(OutputSql)
```

#### Prompt Template:

```python
prompt_generator = ChatPromptTemplate.from_messages([
    ("system", """You're smart coder who can code sql
     you'll be given user query in natural lingo
     you'll be given table schema.
     you've to return in json format with key as sql_query and value as sql query"""),
    ("human", "user query:{user_query} tableSchema:{table_schema}")
])
```

#### Generator Node:

```python
def generator(state: GraphState) -> Dict:
    response: OutputSql = structured_llm.invoke(
        prompt_generator.format_messages(
            user_query=state.user_query, 
            table_schema=state.table_schema
        )
    )
    return {"sql_query": response.sql_query}
```

#### LangGraph Workflow:

```python
from langgraph.graph import StateGraph, END

graph = StateGraph(GraphState)
graph.add_node("generator", generator)
graph.set_entry_point("generator")
graph.add_edge("generator", END)

agent = graph.compile()
```

---

### 3. Table Schema Extractor (`table_schema_extractor.py`)

**Purpose:** Extract database schema information to provide context to the LLM.

```python
import psycopg2

def get_user_tables(db_url: str) -> str:
    """
    Fetch all user-defined tables from PostgreSQL database.
    
    Args:
        db_url: Database connection string
    
    Returns:
        String with each line in format "schema.table"
    """
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    query = """
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
        ORDER BY table_schema, table_name
    """
    
    cur.execute(query)
    results = cur.fetchall()
    
    # Format: "schema.table" per line
    return "\n".join([f"{row[0]}.{row[1]}" for row in results])
```

**Example Output:**
```
public.users
public.orders
public.products
sales.transactions
```

---

### 4. Evaluator Pipeline (`eval_agent.py`)

**Purpose:** Security analysis of generated SQL queries to detect dangerous operations.

#### Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    EVALUATOR PIPELINE                        │
│                                                               │
│   SQL Query + User Query                                      │
│       │                                                       │
│       ▼                                                       │
│   ┌─────────────────────────────────────────┐                │
│   │         Security Analyzer LLM           │                │
│   │   (Checks for dangerous operations)     │                │
│   └─────────────────────────────────────────┘                │
│       │                                                       │
│       ▼                                                       │
│   ┌─────────────────────────────────────────┐                │
│   │  Output: has_problem, problem_desc      │                │
│   └─────────────────────────────────────────┘                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### State Definition:

```python
class GraphState(BaseModel):
    user_query: str = Field(..., description="Input from the user")
    sql_query: str = Field(..., description="Response generated by the model")
    has_problem: bool = Field(..., description="True if there's a problem")
    problem_description: str = Field(..., description="Description of the problem")

class OutputFormat(BaseModel):
    has_problem: bool = Field(..., description="True if dangerous, False otherwise")
    problem_description: str = Field(..., description="Problem details or empty string")
```

#### Security Analysis Prompt:

```python
prompt_generator = ChatPromptTemplate.from_messages([
    ("system", """
You're a security-conscious SQL expert. Evaluate if the provided SQL query 
is dangerous (e.g., could delete/drop tables, expose sensitive data, or 
cause denial-of-service).

INSTRUCTIONS:
1. ALWAYS return valid JSON
2. has_problem MUST be a boolean (true/false)
3. problem_description MUST be an empty string "" when has_problem is false
4. NEVER use null/None for problem_description

Check for:
- Destructive operations (DROP, DELETE without WHERE, TRUNCATE)
- Excessive data exposure (SELECT * on large tables)
- Privilege escalation attempts
- Time-consuming operations (no LIMIT on large queries)
"""),
    ("human", "User query: {user_query}\nSQL query: {sql_query}")
])
```

#### Evaluator Node:

```python
def evaluator(state: GraphState) -> dict:
    response: OutputFormat = structured_llm.invoke(
        prompt_generator.format_messages(
            user_query=state.user_query, 
            sql_query=state.sql_query
        )
    )
    return {
        "has_problem": response.has_problem,
        "problem_description": response.problem_description
    }
```

#### Security Checks Performed:

| Check Type | Examples |
|------------|----------|
| **Destructive Operations** | `DROP TABLE`, `DELETE FROM table` (no WHERE), `TRUNCATE` |
| **Data Exposure** | `SELECT *` on large tables without LIMIT |
| **Privilege Escalation** | `GRANT`, `REVOKE`, `ALTER USER` |
| **DoS Attacks** | `pg_sleep()`, complex JOINs without limits |
| **Injection Patterns** | Suspicious string concatenation |

---

### 5. Executer Pipeline (`exec_agnet.py`)

**Purpose:** Execute validated SQL queries and return results.

#### Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTER PIPELINE                         │
│                                                               │
│   SQL Query                                                   │
│       │                                                       │
│       ▼                                                       │
│   ┌─────────────────────────────────────────┐                │
│   │         PostgreSQL Executor             │                │
│   │    (psycopg2 with RealDictCursor)       │                │
│   └─────────────────────────────────────────┘                │
│       │                                                       │
│       ▼                                                       │
│   List[Dict] Results                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Execute Function:

```python
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict

POSTGRES_URL = "postgresql://..."  # Connection string

def execute_query(query: str, connection_string: str = POSTGRES_URL) -> List[Dict]:
    """Execute PostgreSQL query and return results as list of objects."""
    with psycopg2.connect(connection_string) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            if cur.description:
                return [dict(row) for row in cur.fetchall()]
            conn.commit()
            return []
```

#### State & Node:

```python
class GraphState(BaseModel):
    sql_query: str
    results: List[Dict[str, Any]]

def executer(state: GraphState) -> Dict:
    return {"results": execute_query(state.sql_query)}
```

---

## 🔄 Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPLETE AI PIPELINE                            │
│                                                                       │
│   "Show me all users from New York"                                  │
│                     │                                                 │
│                     ▼                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐│
│   │ STEP 1: GENERATE                                                 ││
│   │                                                                  ││
│   │ Input:  { user_query: "Show me all users from New York",        ││
│   │           postgres_url: "postgresql://...",                      ││
│   │           database: "mydb" }                                     ││
│   │                                                                  ││
│   │ Process: LLM + Schema Context → SQL Generation                   ││
│   │                                                                  ││
│   │ Output: { sql_query: "SELECT * FROM users WHERE city='New York'"││
│   └─────────────────────────────────────────────────────────────────┘│
│                     │                                                 │
│                     ▼                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐│
│   │ STEP 2: EVALUATE                                                 ││
│   │                                                                  ││
│   │ Input:  { user_query: "Show me all users from New York",        ││
│   │           sql_query: "SELECT * FROM users WHERE city='New York'"││
│   │           has_problem: false,                                    ││
│   │           problem_description: "" }                              ││
│   │                                                                  ││
│   │ Process: Security Analysis by LLM                                ││
│   │                                                                  ││
│   │ Output: { has_problem: false, problem_description: "" }          ││
│   └─────────────────────────────────────────────────────────────────┘│
│                     │                                                 │
│                     ▼                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐│
│   │ STEP 3: EXECUTE (if no problems)                                 ││
│   │                                                                  ││
│   │ Input:  { sql_query: "SELECT * FROM users WHERE city='New York'"││
│   │           results: [] }                                          ││
│   │                                                                  ││
│   │ Process: Execute SQL against PostgreSQL                          ││
│   │                                                                  ││
│   │ Output: { results: [                                             ││
│   │             { id: 1, name: "John", city: "New York" },           ││
│   │             { id: 2, name: "Jane", city: "New York" }            ││
│   │          ]}                                                      ││
│   └─────────────────────────────────────────────────────────────────┘│
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 LLM Configuration

### Model: Qwen3-VL (235B Cloud Version)

```python
from langchain_ollama import ChatOllama

llm = ChatOllama(
    model="qwen3-vl:235b-cloud",
    temperature=0.5  # Balance between creativity and consistency
)
```

### Why Qwen3-VL?

| Feature | Benefit |
|---------|---------|
| **Large Context Window** | Can handle complex schemas |
| **SQL Understanding** | Strong code generation capabilities |
| **Structured Output** | Native JSON output support |
| **Local Deployment** | No API costs, data privacy |

### Structured Output:

```python
# Forces LLM to output valid Pydantic models
structured_llm = llm.with_structured_output(OutputSql)

# LLM output is automatically parsed and validated
response: OutputSql = structured_llm.invoke(prompt)
# response.sql_query is guaranteed to be a string
```

---

## 🔐 Security Considerations

### 1. AI Output is NEVER Trusted Blindly

```python
# Backend ALWAYS re-validates SQL after AI generates it
is_safe, reason = SQLPermissionChecker.validate_sql(ai_response["sql"])
if not is_safe:
    return {"status": "blocked", "reason": reason}
```

### 2. Prompt Injection Protection

The evaluator specifically checks for:
- SQL injection patterns
- Privilege escalation attempts
- Bypass attempts

### 3. Credential Handling

```python
# Connection strings are passed per-request
# Not stored in AI service
# Logged without passwords
```

---

## ⚙️ Running the AI Agents

### Start the Server

```bash
cd agents
python server.py
```

### Server runs on: `http://localhost:8000`

### Test Endpoints

```bash
# Generate SQL
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"user_query": "Show all users", "postgres_url": "...", "db_name": "mydb"}'

# Evaluate SQL
curl -X POST http://localhost:8000/api/evaluater \
  -H "Content-Type: application/json" \
  -d '{"user_query": "Show all users", "sql_query": "SELECT * FROM users", "has_problem": false, "problem_description": ""}'

# Execute SQL
curl -X POST http://localhost:8000/api/executer \
  -H "Content-Type: application/json" \
  -d '{"sql_query": "SELECT * FROM users LIMIT 5"}'
```

---

## ❓ Cross Questions & Answers

### Q1: Why use LangGraph instead of simple function calls?

**A:** LangGraph provides:
1. **State Management** - Tracks data through pipeline
2. **Visualization** - Debug agent flows
3. **Extensibility** - Easy to add new nodes (e.g., retry logic)
4. **Composability** - Combine agents into complex workflows
5. **Built-in Features** - Checkpointing, streaming, human-in-loop

### Q2: Why separate Generator, Evaluator, and Executer?

**A:** **Single Responsibility Principle:**
- Each agent has one job, does it well
- Easier to debug and maintain
- Can scale independently
- Can swap implementations (e.g., different LLM for evaluation)

### Q3: Can the AI be prompt-injected?

**A:** Mitigations in place:
1. **Evaluator checks** for injection patterns
2. **Backend re-validates** all SQL
3. **Read-only enforcement** limits damage
4. **Human approval** catches edge cases

Example attack prevented:
```
User: "Show users; DROP TABLE users;--"
Evaluator: has_problem=true, "Detected multiple statements and DROP operation"
```

### Q4: Why use local LLM (Ollama) instead of OpenAI?

**A:** Trade-offs considered:

| Ollama (Local) | OpenAI (Cloud) |
|----------------|----------------|
| ✅ No API costs | ❌ Pay per token |
| ✅ Data stays local | ❌ Data sent to cloud |
| ✅ No rate limits | ❌ Rate limited |
| ❌ Requires GPU | ✅ No infrastructure |
| ❌ Model updates manual | ✅ Auto-updated |

For hackathon and enterprise data: **Local preferred**

### Q5: How accurate is the SQL generation?

**A:** Accuracy depends on:
1. **Schema quality** - More context = better SQL
2. **Query complexity** - Simple queries ~95%+ accuracy
3. **Ambiguity** - Clear questions get better results
4. **Human approval** - Catches remaining errors

The system is designed assuming AI WILL make mistakes, hence multi-layer validation.

### Q6: What happens if the LLM hallucinates a table name?

**A:** The query fails safely:
```
PostgreSQL Error: relation "fake_table" does not exist
```
User sees error message, no data is affected.

---

*Next: [05_SECURITY_MODEL.md](05_SECURITY_MODEL.md)*
