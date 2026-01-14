# # main.py
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel, Field, validator
# from typing import Optional, Dict, Any, List
# import psycopg2
# from psycopg2.extras import RealDictCursor
# from langgraph.graph import StateGraph, END
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_ollama import ChatOllama
# import re
# from generator_pipeline.gen_agent import agent as generate_agent
# from executer_pipeline.exec_agnet import agent as executer_agent
# from evaluator_pipeline.eval_agent import agent as evaluator_agent
# from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# import tempfile, os
# from csv_adder.add_csv_to_db import import_csv_two_step
# # ==================== Pydantic Models ====================
# SUPABASE_URL = "postgresql://postgres:,C^qsk~wWdq7*p4@db.gmixhcrgxajwaligvyxz.supabase.co:5432/postgres"
# class QueryRequest(BaseModel):
#     user_query: str = Field(..., description="Natural language query from user")
#     postgres_url: str = Field(..., description="PostgreSQL connection URL")
#     database: str = Field(default="postgres", description="Database name")

# class ExecuterFormat(BaseModel):
#     sql_query:str

# class QueryResponse(BaseModel):
#     success: bool
#     sql_query: Optional[str] = None
#     has_security_issue: bool = False
#     security_message: Optional[str] = None
#     data: Optional[List[Dict]] = None
#     error: Optional[str] = None


# class GenerateFormat(BaseModel):
#     user_query:str
#     postgres_url:str
#     db_name:str
    
    

# #     "user_query":"give me email id of aarav sharma in users table",
# #      "sql_query": "SELECT email FROM users WHERE name = 'Aarav Sharma';",
# #      "has_problem":False,
# #      "problem_description":""
# # })


# class EvaluatorFormat(BaseModel):
#     user_query: str
#     sql_query: str
#     has_problem: bool=False
#     problem_description: str=" "
# # ==================== FastAPI App ====================

# app = FastAPI(
#     title="SQL Security Evaluator API",
#     description="API for secure SQL query generation and execution",
#     version="1.0.0"
# )

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# # ==================== API Endpoints ====================
# @app.get("/")
# async def root():
#     return {
#         "message": "SQL Security Evaluator API",
#         "version": "1.0.0",
#         "endpoints": {
#             "/query": "POST - Execute secure SQL query",
#             "/health": "GET - Health check"
#         }
#     }

# # @app.post("/api/import-csv")
# # async def import_csv_endpoint(
# #     file: UploadFile = File(...),
# # ):
# #     """
# #     Upload CSV and import to Supabase table called 'fuckers'
# #     """
# #     if not file.filename.lower().endswith(".csv"):
# #         raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
# #     tmp_path = None
    
# #     try:
# #         # Save uploaded file to temp location
# #         tmp_path = os.path.join(tempfile.gettempdir(), "upload_temp.csv")
        
# #         with open(tmp_path, "wb") as f:
# #             content = await file.read()
# #             f.write(content)
        
# #         print(f"📁 Saved temp file: {tmp_path}")
# #         print(f"🎯 Importing to table: fuckers")
        
# #         # ⚠️ CRITICAL: Hardcode the exact table name you want
# #         import_csv_to_postgres(
# #             csv_path=tmp_path,
# #             table_name="fuckers"  # THIS controls the table name
# #         )
        
# #         return {
# #             "message": "CSV imported successfully",
# #             "table_name": "fuckers",
# #             "filename": file.filename
# #         }
        
# #     except Exception as e:
# #         print(f"❌ Error in endpoint: {e}")
# #         raise HTTPException(status_code=500, detail=str(e))
    
# #     finally:
# #         # Clean up temp file
# #         if tmp_path and os.path.exists(tmp_path):
# #             os.remove(tmp_path)
# #             print(f"🗑️ Cleaned up temp file")

# @app.post("/api/generate")
# async def generate(request: GenerateFormat):
#     """
#     Generate and evaluate SQL without executing it.
#     """
#     try:
#         res = generate_agent.invoke({
#     "user_query": request.user_query,
#     "postgres_url": request.postgres_url,
#     "database": request.db_name
# })

#         return {"sql_query": res["sql_query"]}
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# @app.post("/api/executer")
# async def execute(reqest:ExecuterFormat):
   
#     res = executer_agent.invoke({
#     "sql_query": reqest.sql_query,
#     "results": []
# })

#     return res['results']
        
        
# @app.post("/api/evaluater")
# async def evaluate(request: EvaluatorFormat):
#     """
#     Evaluate SQL query for security issues.
#     """
#     try:
#         res = evaluator_agent.invoke({
#             "user_query": request.user_query,
#             "sql_query": request.sql_query,
#             "has_problem": request.has_problem,
#             "problem_description": request.problem_description
#         })
#         return {
#             "has_problem": res["has_problem"],
#             "problem_description": res["problem_description"]
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
# # ==================== Run Server ====================

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)






# =========================================================


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
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import tempfile, os
from csv_adder.add_csv_to_db import import_csv_two_step
# ==================== Pydantic Models ====================
SUPABASE_URL = "postgresql://postgres:,C^qsk~wWdq7*p4@db.gmixhcrgxajwaligvyxz.supabase.co:5432/postgres"
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
# ==================== API Endpoints ====================
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

# @app.post("/api/import-csv")
# async def import_csv_endpoint(
#     file: UploadFile = File(...),
# ):
#     """
#     Upload CSV and import to Supabase table called 'fuckers'
#     """
#     if not file.filename.lower().endswith(".csv"):
#         raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
#     tmp_path = None
    
#     try:
#         # Save uploaded file to temp location
#         tmp_path = os.path.join(tempfile.gettempdir(), "upload_temp.csv")
        
#         with open(tmp_path, "wb") as f:
#             content = await file.read()
#             f.write(content)
        
#         print(f"📁 Saved temp file: {tmp_path}")
#         print(f"🎯 Importing to table: fuckers")
        
#         # ⚠️ CRITICAL: Hardcode the exact table name you want
#         import_csv_to_postgres(
#             csv_path=tmp_path,
#             table_name="fuckers"  # THIS controls the table name
#         )
        
#         return {
#             "message": "CSV imported successfully",
#             "table_name": "fuckers",
#             "filename": file.filename
#         }
        
#     except Exception as e:
#         print(f"❌ Error in endpoint: {e}")
#         raise HTTPException(status_code=500, detail=str(e))
    
#     finally:
#         # Clean up temp file
#         if tmp_path and os.path.exists(tmp_path):
#             os.remove(tmp_path)
#             print(f"🗑️ Cleaned up temp file")

@app.post("/api/import-csv")
async def import_csv_endpoint(file: UploadFile = File(...), table_name: str = Form(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    tmp_path = None
    
    try:
        tmp_path = os.path.join(tempfile.gettempdir(), f"upload_{os.urandom(4).hex()}.csv")
        
        with open(tmp_path, "wb") as f:
            f.write(await file.read())
        
        # This now returns a dict!
        result = import_csv_two_step(
            csv_path=tmp_path,
            table_name=table_name,
            connection_url=SUPABASE_URL
        )
        
        # Now this works because result is a dict
        return {
            "message": f"CSV successfully imported to table '{table_name}'",
            "uploaded_filename": file.filename,
            **result  # ✅ This works now!
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)



@app.post("/api/generate")
async def generate(request: GenerateFormat):
    """
    Generate SQL query and evaluate it for correctness and security.
    """
    try:
        print("hi")
        # Agent 1: Generate the SQL query
        gen_res = generate_agent.invoke({
            "user_query": request.user_query,
            "postgres_url": request.postgres_url,
            "database": request.db_name
        })
     
        generated_sql = gen_res["sql_query"]
        print(f"Generated SQL: {generated_sql}")
        # Agent 2: Evaluate the generated query for correctness and security
        eval_res = evaluator_agent.invoke({
            "user_query": request.user_query,
            "sql_query": generated_sql,
            "has_problem": False,
            "problem_description": ""
        })
        print(f"Evaluation Result: {eval_res}")
        
        return {
            "sql_query": generated_sql,
            "has_problem": eval_res["has_problem"],
            "problem_description": eval_res["problem_description"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/executer")
async def execute(reqest:ExecuterFormat):
   
    res = executer_agent.invoke({
    "sql_query": reqest.sql_query,
    "results": []
})

    return res['results']
        
        

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