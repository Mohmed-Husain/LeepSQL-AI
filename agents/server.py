# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
import re
from generator_pipeline.gen_agent import agent as generate_agent
from executer_pipeline.exec_agnet import agent as executer_agent
from evaluator_pipeline.eval_agent import agent as evaluator_agent
# ==================== Pydantic Models ====================

class QueryRequest(BaseModel):
    user_query: str = Field(..., description="Natural language query from user")
    postgres_url: str = Field(..., description="PostgreSQL connection URL")
    database: str = Field(default="postgres", description="Database name")

class ExecuterFormat(BaseModel):
    sql_query:str

class QueryResponse(BaseModel):
    success: bool
    sql_query: Optional[str] = None
    has_security_issue: bool = False
    security_message: Optional[str] = None
    data: Optional[List[Dict]] = None
    error: Optional[str] = None


class GenerateFormat(BaseModel):
    user_query:str
    postgres_url:str
    db_name:str
    
    

#     "user_query":"give me email id of aarav sharma in users table",
#      "sql_query": "SELECT email FROM users WHERE name = 'Aarav Sharma';",
#      "has_problem":False,
#      "problem_description":""
# })


class EvaluatorFormat(BaseModel):
    user_query: str
    sql_query: str
    has_problem: bool=False
    problem_description: str=" "
# ==================== FastAPI App ====================

app = FastAPI(
    title="SQL Security Evaluator API",
    description="API for secure SQL query generation and execution",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "SQL Security Evaluator API",
        "version": "1.0.0",
        "endpoints": {
            "/query": "POST - Execute secure SQL query",
            "/health": "GET - Health check"
        }
    }

@app.post("/api/generate")
async def generate(request: GenerateFormat):
    """
    Generate and evaluate SQL without executing it.
    """
    try:
        res = generate_agent.invoke({
    "user_query": request.user_query,
    "postgres_url": request.postgres_url,
    "database": request.db_name
})

        return {"sql_query": res["sql_query"]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/executer")
async def execute(reqest:ExecuterFormat):
   
    res =executer_agent.invoke({
            "sql_query":reqest.sql_query,
            "result":[]
        }) 
    
    return res['results']
        
        
@app.post("/api/evaluater")
async def evaluate(request: EvaluatorFormat):
    """
    Evaluate SQL query for security issues.
    """
    try:
        res = evaluator_agent.invoke({
            "user_query": request.user_query,
            "sql_query": request.sql_query,
            "has_problem": request.has_problem,
            "problem_description": request.problem_description
        })
        return {
            "has_problem": res["has_problem"],
            "problem_description": res["problem_description"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ==================== Run Server ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)