# LeepSQL-AI: Project Overview

## 📌 Executive Summary

**LeepSQL-AI** (also known as **LeapSQL**) is a production-grade Natural Language to SQL system that enables non-technical users to query databases using plain English while maintaining enterprise-level security through multi-layer validation and human-in-the-loop safety mechanisms.

---

## 🎯 Problem Statement

### The Challenge

Modern organizations face a critical gap between their data and their people:

1. **Data Accessibility Gap**: Business analysts, managers, and stakeholders need data insights but lack SQL expertise
2. **Security Risks**: Giving direct database access to non-technical users poses severe security risks (accidental data deletion, exposure of sensitive data)
3. **Bottleneck on Technical Teams**: Data requests create bottlenecks as technical teams become the gatekeepers of data
4. **AI Trust Issues**: Pure AI-generated SQL queries cannot be blindly trusted due to hallucinations and potential security vulnerabilities

### Real-World Scenario

> *"A marketing manager wants to know 'What were our top 10 selling products last quarter?' They currently need to:*
> 1. *Email the data team*
> 2. *Wait hours or days for a response*
> 3. *Often get back data that doesn't match their actual question*
> 4. *Repeat the cycle with clarifications"*

**LeepSQL-AI solves this by allowing natural language queries with built-in safety guardrails.**

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│                        (React + TypeScript)                          │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICE                              │
│                     (FastAPI + Python)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Session   │  │   Security  │  │   Query     │                  │
│  │   Manager   │  │   Layer     │  │   Service   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────────┐
│      AI AGENT SERVICE     │   │          DATABASE                  │
│      (LangGraph + LLM)    │   │    (PostgreSQL/MySQL)              │
│  ┌─────────┐ ┌─────────┐  │   │                                    │
│  │Generator│ │Evaluator│  │   │  Backend ONLY accesses             │
│  └─────────┘ └─────────┘  │   │  AI Agent NEVER accesses           │
└───────────────────────────┘   └───────────────────────────────────┘
```

### Key Architectural Principles

| Principle | Description |
|-----------|-------------|
| **Single Control Plane** | Backend is the ONLY system that accesses the database |
| **AI Isolation** | AI Agent NEVER has direct database access |
| **Defense in Depth** | Multiple security layers (AI + Backend validation) |
| **Human-in-the-Loop** | Developer mode requires manual approval |
| **Credential Security** | All credentials stored in memory only, never logged |

---

## 🔄 Data Flow

### Complete Query Lifecycle

```
User Input (Natural Language)
        │
        ▼
┌───────────────────────┐
│  1. Frontend          │  "Show me all customers from New York"
│     Captures Query    │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  2. Backend           │  Validates session, extracts schema
│     Orchestrates      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  3. AI Generator      │  Converts to: SELECT * FROM customers 
│     Creates SQL       │              WHERE city = 'New York'
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  4. AI Evaluator      │  Checks for security issues
│     Security Check    │  ✓ No DROP/DELETE
└───────────┬───────────┘  ✓ No privilege escalation
            │
            ▼
┌───────────────────────┐
│  5. Backend           │  Independent safety validation
│     Final Validation  │  ✓ Read-only check
└───────────┬───────────┘  ✓ Row limits applied
            │
            ▼
┌───────────────────────┐
│  6. User Approval     │  (In Developer Mode)
│     Human-in-Loop     │  User sees SQL before execution
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  7. Execution         │  Query runs with timeout
│     & Results         │  Results returned to user
└───────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | API Framework |
| Pydantic | Data Validation |
| SQLAlchemy | Database ORM |
| psycopg2 | PostgreSQL Driver |
| httpx | Async HTTP Client |

### AI Agents
| Technology | Purpose |
|------------|---------|
| LangGraph | Agent Orchestration |
| LangChain | LLM Framework |
| Ollama | Local LLM Runtime |
| Qwen3-VL | Language Model |

### Database Support
- PostgreSQL (Primary)
- MySQL (Planned)
- SQLite (Planned)

---

## 📊 Key Features

### 1. Natural Language Query Interface
- Type questions in plain English
- AI translates to optimized SQL
- No SQL knowledge required

### 2. Multi-Layer Security
- AI-level safety evaluation
- Backend permission validation
- Read-only enforcement by default
- Dangerous operation blocking

### 3. Human-in-the-Loop (Developer Mode)
- Review SQL before execution
- Approve or reject queries
- Full audit trail

### 4. Session-Based Security
- Credentials stored in memory only
- No credential logging
- Automatic session cleanup

### 5. Query Safeguards
- Row limits (default: 1000)
- Query timeouts (default: 30s)
- Automatic LIMIT injection

---

## 🎯 Target Users

| User Type | Use Case |
|-----------|----------|
| **Business Analysts** | Generate reports without SQL knowledge |
| **Product Managers** | Quick data lookups for decisions |
| **Executives** | Real-time business metrics |
| **Developers** | Rapid prototyping and exploration |
| **Data Teams** | Reduce query request workload |

---

## 📁 Project Structure

```
LeepSQL-AI/
├── frontend/          # React + TypeScript UI
├── backend/           # FastAPI Python Backend
├── agents/            # AI Agent Services (LangGraph)
│   ├── generator_pipeline/   # Natural Language → SQL
│   ├── evaluator_pipeline/   # Security Evaluation
│   └── executer_pipeline/    # Query Execution
├── csv_adder/         # Data Import Utilities
└── Docs/              # Documentation (You are here!)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database
- Ollama (for local LLM)

### Running the System

1. **Start AI Agents** (Port 8000)
   ```bash
   cd agents
   python server.py
   ```

2. **Start Backend** (Port 8000)
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

3. **Start Frontend** (Port 5173)
   ```bash
   cd frontend
   npm install && npm run dev
   ```

---

## 📖 Documentation Index

| Document | Description |
|----------|-------------|
| [01_PROJECT_OVERVIEW.md](01_PROJECT_OVERVIEW.md) | This document - Project overview |
| [02_BACKEND_ARCHITECTURE.md](02_BACKEND_ARCHITECTURE.md) | Backend service details |
| [03_FRONTEND_GUIDE.md](03_FRONTEND_GUIDE.md) | Frontend application guide |
| [04_AI_AGENTS_DEEP_DIVE.md](04_AI_AGENTS_DEEP_DIVE.md) | AI agent pipelines |
| [05_SECURITY_MODEL.md](05_SECURITY_MODEL.md) | Security implementation |
| [06_API_REFERENCE.md](06_API_REFERENCE.md) | Complete API documentation |
| [07_FAQ_AND_CROSS_QUESTIONS.md](07_FAQ_AND_CROSS_QUESTIONS.md) | Q&A and troubleshooting |

---

## 👥 Contributors

Built for GDG Hackathon - A production-grade solution for democratizing data access while maintaining enterprise security.

---

*Last Updated: January 2026*
