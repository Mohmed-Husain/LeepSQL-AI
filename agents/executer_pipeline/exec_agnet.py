# %%
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict
POSTGRES_URL ="postgresql://postgres:,C^qsk~wWdq7*p4@db.gmixhcrgxajwaligvyxz.supabase.co:5432/postgres"
def execute_query(query: str, connection_string: str = POSTGRES_URL) -> List[Dict]:
    """Execute PostgreSQL query and return results as list of objects."""
    with psycopg2.connect(connection_string) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            if cur.description:
                return [dict(row) for row in cur.fetchall()]
            conn.commit()
            return []

# %%
import json
from langgraph.graph import StateGraph, START, END
from langchain_core.prompts import ChatPromptTemplate
from typing import TypedDict,List
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel,Field
from typing import List , Dict , Any



# %%
class GraphState(BaseModel):
    sql_query: str
    results: List[Dict[str, Any]]

# %%

from typing import List, Dict
def executer(state:GraphState)->Dict:
    return {"results":execute_query(state.sql_query)}

# %%
from langgraph.graph import StateGraph, END

graph = StateGraph(GraphState)

graph.add_node("executer", executer)

# Entry point must be ONE
graph.set_entry_point("executer")

# Generator → executer
graph.add_edge("executer", END)

agent = graph.compile()

# %%
# agent.invoke({"sql_query":"SELECT * FROM users LIMIT 5;" , "results":[]})

# %%



