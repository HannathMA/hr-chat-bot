import asyncio
import sys
from chatbot import chatbot_app

async def main():
    # Allow passing custom queries via command line arguments
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "What projects has Anu worked on?"
        
    print(f"User Query: '{query}'")
    print("-" * 50)
    
    # Run the graph
    state = {
        "question": query,
        "sql_query": "",
        "sql_result": [],
        "response": "",
        "error": ""
    }
    
    final_state = await chatbot_app.ainvoke(state)
    
    print("\n[Node 1] Generated SQL:")
    print(final_state.get("sql_query", "None"))
    
    print("\n[Node 2] SQL Query Result:")
    print(final_state.get("sql_result", "[]"))
    
    if final_state.get("error"):
        print(f"\n[Error] Database/Execution Error: {final_state['error']}")
        
    print("\n[Node 3] Final Response:")
    print(final_state.get("response", "None"))

if __name__ == "__main__":
    asyncio.run(main())
