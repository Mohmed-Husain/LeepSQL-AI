# %%
# %pip install -U langgraph langchain-core
# %pip install langchain-google-genai langchain-core
# %pip install python-dotenv
# %pip install langchain-openai
# %pip install langchain  langgraph
# %pip install langchain langchain-ollama langgraph

# # 'd:/Google_Hackathon/.venv/Scripts/python.exe -m pip install ipykernel -U --force-reinstall'

# %%
import json
from os import getenv
from langgraph.graph import StateGraph, START, END
from langchain_core.prompts import ChatPromptTemplate
from typing import TypedDict,List
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from google import genai
from pydantic import BaseModel,Field
from typing import List , Dict , Any



# %%
POSTGRES_URL ="postgresql://postgres:,C^qsk~wWdq7*p4@db.gmixhcrgxajwaligvyxz.supabase.co:5432/postgres"

# %%
class GraphState(BaseModel):
    table_schema: str= Field( description="The schema of the table" , default="") ,
    user_query: str = Field( description="The user's query" ,default="") ,
    sql_query: str = Field( description="The generated SQL query" ,default="") 
class OutputSql(BaseModel):
    sql_query: str = Field( description="The generated SQL query without anything else just sql query")

# %%
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.5
)

# %%
structured_llm  = llm.with_structured_output(OutputSql)

# %%
prompt_generator = ChatPromptTemplate.from_messages([
  ("system","You're smart coder who can code sql"
   "you'll be given user query in natural lingo"
   "you'll be given table schema."
   "you've to return in json format with key as sql_query and value as sql query"
   "if user is saying about table and append table in table like .. like user says ``give me all data from products`` then don't write query like this:- select * from productstable; instead write like this:- select * from products;"
   "you'll be given schema so please consider joins also where required."
   "IMP*****:-you to write postgresssql"
   ),
  ("human" , "user query:{user_query}"
   "tableSChema:{table_schema}")
])

# %%
from generator_pipeline.table_schema_extractor import get_detailed_schema

def table_schema_extract (state : GraphState) -> Dict:
    table_schema = get_detailed_schema(POSTGRES_URL)
    return {"table_schema" : table_schema}

# %%
def generator(state:GraphState)->Dict:
    response :OutputSql = structured_llm.invoke(
        prompt_generator.format_messages(
            user_query=state.user_query, 
            table_schema = state.table_schema
        )
    )
    return {"sql_query":response.sql_query}

# %%
from langgraph.graph import StateGraph, END , START

graph = StateGraph(GraphState)

graph.add_node("generator", generator)
graph.add_node("table_schema_extract", table_schema_extract)

graph.add_edge(START, "table_schema_extract")
graph.add_edge("table_schema_extract", "generator")
# Generator → Evaluator
graph.add_edge("generator", END)

agent = graph.compile()

# # %%
# agent.invoke({
#     "user_query":"give me email id of aarav sharma in users table"
# })  

# %%
# import psycopg2
# from psycopg2.extras import RealDictCursor
# from typing import List, Dict

# def execute_query(query: str, connection_string: str=POSTGRES_URL) -> List[Dict]:
#     """Execute PostgreSQL query and return results as list of objects."""
#     with psycopg2.connect(connection_string) as conn:
#         with conn.cursor(cursor_factory=RealDictCursor) as cur:
#             cur.execute(query)
#             if cur.description:
#                 return [dict(row) for row in cur.fetchall()]
#             conn.commit()
#             return []

# %%
# execute_query("SELECT email FROM users WHERE name = 'Aarav Sharma';")

# %%



