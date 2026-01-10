# 🚀 LeepSQL-AI

**Natural Language to SQL with Enterprise-Grade Security**

> Query your database in plain English. AI generates SQL. Multiple security layers protect your data.

![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![AI](https://img.shields.io/badge/AI-LangGraph%20%2B%20Ollama-ff6f00)

---

## 🎯 What is LeepSQL?

LeepSQL-AI lets **non-technical users query databases using natural language** while maintaining enterprise security through:

- 🤖 **AI-Powered SQL Generation** - Type "Show me top 10 customers" → Get SQL
- 🛡️ **5-Layer Security** - AI validation + Backend checks + Human approval
- 👁️ **Human-in-the-Loop** - Review SQL before execution
- 🔒 **Read-Only by Default** - No accidental data modifications

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  AI Agents   │
│   (React)    │     │  (FastAPI)   │     │ (LangGraph)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Database   │
                     │ (PostgreSQL) │
                     └──────────────┘
```

**Key Principle:** AI Agent NEVER accesses database directly. Backend is the single control plane.

---

## 📁 Project Structure

```
LeepSQL-AI/
├── frontend/          # React + TypeScript + Vite + Tailwind
├── backend/           # FastAPI + SQLAlchemy + Pydantic
├── agents/            # LangGraph AI Pipelines
│   ├── generator_pipeline/   # NL → SQL
│   ├── evaluator_pipeline/   # Security Check
│   └── executer_pipeline/    # SQL Execution
└── Docs/              # Detailed Documentation
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database
- Ollama with Qwen model

### 1. Start AI Agents
```bash
cd agents
pip install langchain langgraph langchain-ollama psycopg2-binary fastapi uvicorn
python server.py
```

### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open Browser
```
http://localhost:5173
```

---

## 🔐 Security Layers

| Layer | Component | Protection |
|-------|-----------|------------|
| 1 | Frontend | Input validation |
| 2 | Backend API | Pydantic schema validation |
| 3 | AI Evaluator | LLM security analysis |
| 4 | Backend SQL Check | Keyword blocking (DROP, DELETE, etc.) |
| 5 | Human Approval | Manual review before execution |
| 6 | Execution | Timeouts + Row limits |

---

## 💡 Example Usage

**User Types:**
> "Show me all customers from New York who spent more than $1000"

**AI Generates:**
```sql
SELECT * FROM customers 
WHERE city = 'New York' AND total_spent > 1000
LIMIT 1000
```

**User Approves → Results Displayed**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Pydantic, psycopg2 |
| AI | LangGraph, LangChain, Ollama, Qwen3-VL |
| Database | PostgreSQL (MySQL support planned) |

---

## 📡 API Endpoints

### Backend
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/db/connect` | Connect to database |
| POST | `/query` | Process NL query |
| POST | `/approve` | Approve pending SQL |

### AI Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | NL → SQL |
| POST | `/api/evaluater` | Security check |
| POST | `/api/executer` | Execute SQL |

---

## 📖 Documentation

Detailed docs available in `/Docs`:

- [Project Overview](Docs/01_PROJECT_OVERVIEW.md)
- [Backend Architecture](Docs/02_BACKEND_ARCHITECTURE.md)
- [Frontend Guide](Docs/03_FRONTEND_GUIDE.md)
- [AI Agents Deep Dive](Docs/04_AI_AGENTS_DEEP_DIVE.md)
- [Security Model](Docs/05_SECURITY_MODEL.md)
- [API Reference](Docs/06_API_REFERENCE.md)
- [FAQ & Cross Questions](Docs/07_FAQ_AND_CROSS_QUESTIONS.md)

---

## 🔒 Security Features

- ✅ Credentials stored in memory only (never logged)
- ✅ Multi-layer SQL validation
- ✅ Blocked operations: DROP, TRUNCATE, ALTER, INSERT, UPDATE
- ✅ DELETE only with WHERE clause
- ✅ Query timeout (30s) and row limit (1000)
- ✅ Human approval mode

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Team

Built for **GDG Hackathon** - Democratizing data access with AI safety.

---

<p align="center">
  <b>LeepSQL-AI</b> - Query smarter, not harder 🚀
</p>
