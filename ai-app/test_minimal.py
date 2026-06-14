import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

api_key = os.environ.get("GEMINI_API_KEY")
print(f"API Key: {api_key[:10]}...{api_key[-10:]}" if api_key else "API Key: None")

from langchain_google_genai import ChatGoogleGenerativeAI

print("Creating LLM instance with transport='rest'...")
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=api_key, transport="rest")

print("Invoking LLM...")
try:
    res = llm.invoke("Hello, say 'API works!'")
    print("Response:")
    print(res.content)
except Exception as e:
    print(f"Exception raised: {type(e).__name__}: {e}")
