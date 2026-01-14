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

# @app.post("/api/import-csv")
# async def import_csv_endpoint(file: UploadFile = File(...), table_name: str = Form(...)):
#     if not file.filename.lower().endswith(".csv"):
#         raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
#     tmp_path = None
    
#     try:
#         tmp_path = os.path.join(tempfile.gettempdir(), f"upload_{os.urandom(4).hex()}.csv")
        
#         with open(tmp_path, "wb") as f:
#             f.write(await file.read())
        
#         # This now returns a dict!
#         result = import_csv_two_step(
#             csv_path=tmp_path,
#             table_name=table_name,
#             connection_url=SUPABASE_URL
#         )
        
#         # Now this works because result is a dict
#         return {
#             "message": f"CSV successfully imported to table '{table_name}'",
#             "uploaded_filename": file.filename,
#             **result  # ✅ This works now!
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
#     finally:
#         if tmp_path and os.path.exists(tmp_path):
#             os.remove(tmp_path)


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
import logging
import traceback

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Pydantic Models ====================
class QueryRequest(BaseModel):
    user_query: str = Field(..., description="Natural language query from user")
    postgres_url: str = Field(..., description="PostgreSQL connection URL")
    database: str = Field(default="postgres", description="Database name")

class ExecuterFormat(BaseModel):
    sql_query: str
    connection_string: str = Field(..., description="PostgreSQL connection URL")

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

# ==================== Database Connection Models ====================
class VerifyConnectionRequest(BaseModel):
    connection_string: str = Field(..., description="PostgreSQL connection URL")

class VerifyConnectionResponse(BaseModel):
    success: bool
    message: str
    databases: Optional[List[str]] = None

# ==================== API Endpoints ====================
@app.get("/")
async def root():
    return {
        "message": "SQL Security Evaluator API",
        "version": "1.0.0",
        "endpoints": {
            "/query": "POST - Execute secure SQL query",
            "/health": "GET - Health check",
            "/api/verify-connection": "POST - Verify database connection"
        }
    }

@app.post("/api/verify-connection", response_model=VerifyConnectionResponse)
async def verify_connection(request: VerifyConnectionRequest):
    """
    Verify database connection and return list of available databases.
    """
    conn = None
    try:
        # Parse connection string and handle SSL for cloud databases (Neon, Supabase, etc.)
        connection_string = request.connection_string
        
        # Remove channel_binding parameter as it's not supported by all psycopg2 versions
        # This is commonly added by Neon but can cause issues
        if 'channel_binding' in connection_string:
            # Remove channel_binding parameter from the connection string
            import urllib.parse
            parsed = urllib.parse.urlparse(connection_string)
            query_params = urllib.parse.parse_qs(parsed.query)
            query_params.pop('channel_binding', None)
            new_query = urllib.parse.urlencode(query_params, doseq=True)
            connection_string = urllib.parse.urlunparse((
                parsed.scheme, parsed.netloc, parsed.path,
                parsed.params, new_query, parsed.fragment
            ))
        
        # Try to connect to the database
        # psycopg2 handles sslmode from the connection string automatically
        conn = psycopg2.connect(connection_string)
        cursor = conn.cursor()
        
        # Get the current database name from connection
        cursor.execute("SELECT current_database();")
        current_db = cursor.fetchone()[0]
        
        # For cloud databases like Neon, users typically only have access to their own database
        # Try to list databases, but fall back to just the current one if permission denied
        try:
            cursor.execute("""
                SELECT datname FROM pg_database 
                WHERE datistemplate = false 
                ORDER BY datname;
            """)
            databases = [row[0] for row in cursor.fetchall()]
        except:
            # If we can't list databases (permission issue), just use the current one
            databases = [current_db]
        
        # Make sure current database is in the list and at the top
        if current_db in databases:
            databases.remove(current_db)
        databases.insert(0, current_db)
        
        cursor.close()
        conn.close()
        
        return VerifyConnectionResponse(
            success=True,
            message="Connection established successfully",
            databases=databases
        )
        
    except psycopg2.OperationalError as e:
        error_msg = str(e)
        if "password authentication failed" in error_msg:
            return VerifyConnectionResponse(
                success=False,
                message="Authentication failed. Please check your username and password.",
                databases=None
            )
        elif "could not connect to server" in error_msg or "Connection refused" in error_msg:
            return VerifyConnectionResponse(
                success=False,
                message="Could not connect to the database server. Please check the host and port.",
                databases=None
            )
        elif "does not exist" in error_msg:
            return VerifyConnectionResponse(
                success=False,
                message="Database does not exist. Please check the database name.",
                databases=None
            )
        elif "channel_binding" in error_msg.lower():
            return VerifyConnectionResponse(
                success=False,
                message="SSL channel binding error. Try removing 'channel_binding=require' from your connection string.",
                databases=None
            )
        elif "ssl" in error_msg.lower():
            return VerifyConnectionResponse(
                success=False,
                message="SSL connection error. Please check your SSL settings.",
                databases=None
            )
        else:
            return VerifyConnectionResponse(
                success=False,
                message=f"Connection failed: {error_msg}",
                databases=None
            )
    except Exception as e:
        return VerifyConnectionResponse(
            success=False,
            message=f"Connection error: {str(e)}",
            databases=None
        )
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass

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
async def import_csv_endpoint(
    file: UploadFile = File(...),
    table_name: str = Form(...),
    connection_string: str = Form(...)
):
    """Import CSV to the user's connected database."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    tmp_path = None
    
    try:
        tmp_path = os.path.join(tempfile.gettempdir(), f"upload_{os.urandom(4).hex()}.csv")
        
        with open(tmp_path, "wb") as f:
            f.write(await file.read())
        
        # Remove channel_binding parameter if present
        conn_str = connection_string
        if 'channel_binding' in conn_str:
            import urllib.parse
            parsed = urllib.parse.urlparse(conn_str)
            query_params = urllib.parse.parse_qs(parsed.query)
            query_params.pop('channel_binding', None)
            new_query = urllib.parse.urlencode(query_params, doseq=True)
            conn_str = urllib.parse.urlunparse((
                parsed.scheme, parsed.netloc, parsed.path,
                parsed.params, new_query, parsed.fragment
            ))
        
        # Import CSV to user's database
        result = import_csv_two_step(
            csv_path=tmp_path,
            table_name=table_name,
            connection_url=conn_str
        )
        
        return {
            "message": f"CSV successfully imported to table '{table_name}'",
            "uploaded_filename": file.filename,
            **result
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
    logger.info("="*50)
    logger.info("[GENERATE] New request received")
    logger.info(f"[GENERATE] User query: {request.user_query}")
    logger.info(f"[GENERATE] Database: {request.db_name}")
    logger.info(f"[GENERATE] Postgres URL provided: {'Yes' if request.postgres_url else 'No'}")


    try:
        print("hi")
        # Agent 1: Generate the SQL query
        logger.info("[GENERATE] Invoking SQL generator agent...")
        gen_res = generate_agent.invoke({
            "user_query": request.user_query,
            "postgres_url": request.postgres_url,
            "database": request.db_name
        })
     
        generated_sql = gen_res["sql_query"]
        logger.info(f"[GENERATE] Generated SQL: {generated_sql}")
        
        # Agent 2: Evaluate the generated query for correctness and security
        logger.info("[GENERATE] Invoking evaluator agent...")
        eval_res = evaluator_agent.invoke({
            "user_query": request.user_query,
            "sql_query": generated_sql,
            "has_problem": False,
            "problem_description": ""
        })
        logger.info(f"[GENERATE] Evaluation Result: has_problem={eval_res['has_problem']}")
        logger.info("[GENERATE] Request completed successfully")
        logger.info("="*50)
        
        return {
            "sql_query": generated_sql,
            "has_problem": eval_res["has_problem"],
            "problem_description": eval_res["problem_description"]
        }
    
    except Exception as e:
        logger.error(f"[GENERATE] ERROR: {str(e)}")
        logger.error(f"[GENERATE] Traceback: {traceback.format_exc()}")
        logger.info("="*50)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/executer")
async def execute(reqest: ExecuterFormat):
    """Execute SQL query on the user's connected database."""
    try:
        # Remove channel_binding parameter if present
        connection_string = reqest.connection_string
        if 'channel_binding' in connection_string:
            import urllib.parse
            parsed = urllib.parse.urlparse(connection_string)
            query_params = urllib.parse.parse_qs(parsed.query)
            query_params.pop('channel_binding', None)
            new_query = urllib.parse.urlencode(query_params, doseq=True)
            connection_string = urllib.parse.urlunparse((
                parsed.scheme, parsed.netloc, parsed.path,
                parsed.params, new_query, parsed.fragment
            ))
        
        # Execute query on user's database
        conn = psycopg2.connect(connection_string)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(reqest.sql_query)
        
        if cursor.description:
            results = [dict(row) for row in cursor.fetchall()]
        else:
            conn.commit()
            results = [{"message": "Query executed successfully", "rows_affected": cursor.rowcount}]
        
        cursor.close()
        conn.close()
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
        

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

# ==================== Direct SQL Execution (Dev Mode - No AI) ====================
class DirectSQLRequest(BaseModel):
    sql_query: str = Field(..., description="Raw SQL query to execute")
    connection_string: str = Field(..., description="PostgreSQL connection URL")

@app.post("/api/execute-direct")
async def execute_direct(request: DirectSQLRequest):
    """
    Execute raw SQL query directly without AI processing.
    This is for developer mode to save LLM costs.
    """
    print(f"[execute-direct] SQL: {request.sql_query}")
    print(f"[execute-direct] Connection string length: {len(request.connection_string)}")
    
    conn = None
    try:
        # Remove channel_binding parameter if present
        connection_string = request.connection_string
        if 'channel_binding' in connection_string:
            import urllib.parse
            parsed = urllib.parse.urlparse(connection_string)
            query_params = urllib.parse.parse_qs(parsed.query)
            query_params.pop('channel_binding', None)
            new_query = urllib.parse.urlencode(query_params, doseq=True)
            connection_string = urllib.parse.urlunparse((
                parsed.scheme, parsed.netloc, parsed.path,
                parsed.params, new_query, parsed.fragment
            ))
        
        # Execute query directly on user's database
        conn = psycopg2.connect(connection_string)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(request.sql_query)
        
        # Check if query returns data (SELECT) or modifies data (INSERT/UPDATE/DELETE)
        has_results = cursor.description is not None
        
        if has_results:
            results = [dict(row) for row in cursor.fetchall()]
            rows_count = len(results)
            message = f"Query executed successfully. {rows_count} row(s) returned."
        else:
            conn.commit()
            results = []
            rows_count = cursor.rowcount
            message = f"Query executed successfully. {rows_count} row(s) affected."
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "message": message,
            "data": results,
            "rows_affected": rows_count
        }
    except psycopg2.Error as e:
        return {
            "success": False,
            "message": f"SQL Error: {e.pgerror or str(e)}",
            "data": None,
            "rows_affected": 0
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "data": None,
            "rows_affected": 0
        }
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass

# ==================== Run Server ====================

if __name__ == "__main__": 
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)