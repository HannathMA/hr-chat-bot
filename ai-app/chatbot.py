import os
import re
import asyncio
from pathlib import Path
from typing import Any, Dict, List
from typing_extensions import TypedDict
import asyncpg
from dotenv import load_dotenv

# Load .env from the ai-app directory (where this file lives)
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END

# Database URL (strip SQLAlchemy prefix so asyncpg can use it directly)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://hr_user:changeme@localhost:5432/hr_portal"
).replace("postgresql+asyncpg://", "postgresql://")

# Gemini model
GEMINI_MODEL = "gemini-2.5-flash"

# ── LangGraph State ──────────────────────────────────────────────────────────
class ChatbotState(TypedDict):
    question: str
    sql_query: str
    sql_result: List[Dict[str, Any]]
    response: str
    error: str

# ── Database Schema Description ───────────────────────────────────────────────
DB_SCHEMA_PROMPT = """
You are a PostgreSQL expert. Given an input question, create a syntactically correct PostgreSQL query to run.
Return ONLY the executable SQL query. Do not include markdown formatting or explanations.

The database contains the following tables and schemas:

1. **employees**
   - id UUID PRIMARY KEY
   - employee_code VARCHAR(20) UNIQUE
   - first_name VARCHAR(100)
   - last_name VARCHAR(100)
   - email CITEXT UNIQUE
   - phone VARCHAR(20)
   - date_of_birth DATE
   - hire_date DATE
   - termination_date DATE
   - department VARCHAR(100)
   - job_title VARCHAR(150)
   - manager_id UUID REFERENCES employees(id)
   - employment_type (full_time, part_time, contract, intern, freelance)
   - employment_status (active, inactive, on_leave, terminated, probation)
   - salary NUMERIC(12, 2)

2. **attendance**
   - id UUID PRIMARY KEY
   - employee_id UUID REFERENCES employees(id)
   - attendance_date DATE
   - check_in TIMESTAMP WITH TIME ZONE
   - check_out TIMESTAMP WITH TIME ZONE
   - status (present, absent, half_day, work_from_home, on_leave, holiday)
   - overtime_hours NUMERIC(5, 2)
   - location VARCHAR(200)
   - notes TEXT
   - approved_by UUID REFERENCES employees(id)

3. **projects**
   - id UUID PRIMARY KEY
   - project_code VARCHAR(30) UNIQUE
   - name VARCHAR(200)
   - description TEXT
   - client_name VARCHAR(200)
   - status (planning, active, on_hold, completed, cancelled)
   - start_date DATE
   - end_date DATE
   - budget NUMERIC(15, 2)
   - tech_stack VARCHAR[]
   - repository_url TEXT
   - created_by UUID REFERENCES employees(id)

4. **project_assignments**
   - id UUID PRIMARY KEY
   - project_id UUID REFERENCES projects(id)
   - employee_id UUID REFERENCES employees(id)
   - role (lead, developer, designer, analyst, tester, devops, manager, other)
   - allocation_pct SMALLINT
   - joined_date DATE
   - left_date DATE
   - notes TEXT

5. **skills**
   - id UUID PRIMARY KEY
   - name CITEXT UNIQUE
   - category VARCHAR(100)
   - description TEXT

6. **employee_skills**
   - id UUID PRIMARY KEY
   - employee_id UUID REFERENCES employees(id)
   - skill_id UUID REFERENCES skills(id)
   - proficiency (beginner, intermediate, advanced, expert)
   - years_experience NUMERIC(4, 1)
   - is_primary BOOLEAN
   - certified BOOLEAN
   - certification_name VARCHAR(200)
   - certified_date DATE
   - expiry_date DATE

Guidelines:
- When filtering by employee names, always use ILIKE or LOWER() for case-insensitive matching on first_name, last_name, or both combined.
- Only write SELECT queries. Never generate INSERT, UPDATE, DELETE, or DROP statements.
- Always LIMIT results to 50 rows unless the question asks for counts or aggregations.
"""

def make_llm() -> ChatGoogleGenerativeAI:
    # Use GEMINI_API_KEY preferentially, fall back to GOOGLE_API_KEY
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "No Gemini API key found. Set GEMINI_API_KEY in ai-app/.env. "
            "Get a free key from https://aistudio.google.com/"
        )
    return ChatGoogleGenerativeAI(model=GEMINI_MODEL, temperature=0, google_api_key=api_key)


async def invoke_with_retry(chain, inputs, max_retries: int = 3) -> Any:
    """Retry on rate-limit errors with exponential backoff."""
    delay = 15
    for attempt in range(max_retries):
        try:
            if isinstance(inputs, str):
                return await chain.ainvoke(inputs)
            return await chain.ainvoke(inputs)
        except Exception as e:
            msg = str(e)
            if "429" in msg or "rate_limit" in msg.lower() or "overloaded" in msg.lower():
                if attempt < max_retries - 1:
                    print(f"  [Rate limit] Waiting {delay}s before retry {attempt + 2}/{max_retries}...")
                    await asyncio.sleep(delay)
                    delay *= 2
                else:
                    raise
            else:
                raise

# ── Node 1: Write SQL Query ───────────────────────────────────────────────────
async def write_query(state: ChatbotState) -> Dict[str, Any]:
    prompt = ChatPromptTemplate.from_messages([
        ("system", DB_SCHEMA_PROMPT),
        ("human", "Generate a SQL query for this question: {question}")
    ])
    chain = prompt | make_llm()
    result = await invoke_with_retry(chain, {"question": state["question"]})

    raw_query = result.content.strip()
    # Strip any markdown code fences the model might add
    clean_query = re.sub(r"^```sql\s*|\s*```$", "", raw_query, flags=re.IGNORECASE).strip()

    return {"sql_query": clean_query, "error": ""}

# ── Node 2: Execute SQL Query ─────────────────────────────────────────────────
async def execute_query(state: ChatbotState) -> Dict[str, Any]:
    query = state["sql_query"]
    if not query:
        return {"sql_result": [], "error": "No SQL query was generated."}
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            records = await conn.fetch(query)
            results = [dict(record) for record in records]
            return {"sql_result": results, "error": ""}
        finally:
            await conn.close()
    except Exception as e:
        return {"sql_result": [], "error": str(e)}

# ── Node 3: Generate Answer ───────────────────────────────────────────────────
async def generate_answer(state: ChatbotState) -> Dict[str, Any]:
    llm = make_llm()

    if state.get("error"):
        msg = (
            f"The HR admin asked: '{state['question']}'. "
            f"The SQL generated was: '{state['sql_query']}'. "
            f"It failed with: '{state['error']}'. "
            f"Explain clearly and suggest a fix."
        )
        result = await invoke_with_retry(llm, msg)
        return {"response": result.content}

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a helpful HR assistant chatbot powered by Gemini. "
            "Use the database query results to write a clear, friendly, natural-language "
            "response to the HR admin's question. If no records were found, say so clearly."
        ),
        (
            "human",
            "Question: {question}\n"
            "SQL Query Used: {sql_query}\n"
            "Query Results: {sql_result}\n\n"
            "Write your response:"
        )
    ])
    chain = prompt | llm
    result = await invoke_with_retry(chain, {
        "question": state["question"],
        "sql_query": state["sql_query"],
        "sql_result": str(state["sql_result"])
    })
    return {"response": result.content}

# ── LangGraph Workflow ────────────────────────────────────────────────────────
workflow = StateGraph(ChatbotState)  # type: ignore[arg-type]
workflow.add_node("write_query",     write_query)
workflow.add_node("execute_query",   execute_query)
workflow.add_node("generate_answer", generate_answer)

workflow.add_edge(START,             "write_query")
workflow.add_edge("write_query",     "execute_query")
workflow.add_edge("execute_query",   "generate_answer")
workflow.add_edge("generate_answer", END)

chatbot_app = workflow.compile()
