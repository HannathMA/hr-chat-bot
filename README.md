# 🏢 HR Portal & AI Assistant

A premium, role-based Human Resources (HR) portal featuring an intelligent AI-powered chatbot designed with **LangGraph** and **Gemini**. The application helps HR managers and employees manage personal details, track attendance, assign projects, catalog skills, upload résumés, and query internal database records using natural language.

---

## 🎨 System Highlights & Features

- **🤖 LangGraph & Gemini Chatbot**: An advanced AI assistant that translates natural language questions into PostgreSQL queries, executes them securely, and synthesizes user-friendly answers.
- **🔐 Role-Based Access Control**:
  - **HR Managers**: Full database visibility, employee directories, project allocations, and access to the AI Chatbot.
  - **Employees**: Simple check-in/out, personal profile tracking, and skill management.
- **📂 Résumé Management**: Parse, upload, and organize applicant and employee résumés.
- **📊 Real-time Attendance & Tracking**: Daily attendance metrics, check-in details, and WFH tracking.
- **🛠️ Extensible Tech Stack**: Engineered with FastAPI, React, PostgreSQL, and SQLAlchemy.

---

## 🏗️ Architecture Overview

The application is structured as a decoupled monorepo containing three primary layers:
1. **Frontend**: Vite-powered React single page application.
2. **Backend API**: High-performance FastAPI server with PostgreSQL connection pooling.
3. **AI Layer**: Graph-based orchestration using LangGraph and the Gemini model.

```
                  ┌─────────────────────────────────┐
                  │      Browser (React + Vite)     │
                  │           Port :5173            │
                  └────────────────┬────────────────┘
                                   │
                                   │ HTTP / API Requests
                                   ▼
                  ┌─────────────────────────────────┐
                  │       FastAPI Backend API       │
                  │           Port :8000            │
                  └──────┬───────────────────┬──────┘
                         │                   │
                         │ Query/Exec        │ REST Calls
                         ▼                   ▼
     ┌───────────────────────┐   ┌───────────────────────┐
     │   PostgreSQL Database │   │   LangGraph Pipeline  │
     │       Port :5432      │   │     (Gemini API)      │
     └───────────────────────┘   └───────────┬───────────┘
                                             │
                                             ▼
                                 ┌───────────────────────┐
                                 │    1. write_query     │
                                 │   2. execute_query    │
                                 │   3. generate_answer  │
                                 └───────────────────────┘
```

---

## 📁 Repository Structure

Click any folder or key file below to explore the codebase directly:

* 📂 **[backend](file:///c:/Users/Admin/Documents/hr-portal/backend)**: The FastAPI server, models, and endpoints.
  * 📄 **[main.py](file:///c:/Users/Admin/Documents/hr-portal/backend/app/main.py)**: Server entrypoint, lifespan, CORS, and router registrations.
  * 📂 **[routers](file:///c:/Users/Admin/Documents/hr-portal/backend/app/routers)**: API modules (`employees.py`, `attendance.py`, `projects.py`, etc.).
  * 📂 **[db](file:///c:/Users/Admin/Documents/hr-portal/backend/db)**: PostgreSQL schemas and SQL migration scripts.
* 📂 **[ai-app](file:///c:/Users/Admin/Documents/hr-portal/ai-app)**: The AI agent logic and configurations.
  * 📄 **[chatbot.py](file:///c:/Users/Admin/Documents/hr-portal/ai-app/chatbot.py)**: The core LangGraph state workflow (`write_query` ➜ `execute_query` ➜ `generate_answer`).
* 📂 **[frontend](file:///c:/Users/Admin/Documents/hr-portal/frontend)**: The React + Vite client-side user interface.
* 📄 **[SETUP.md](file:///c:/Users/Admin/Documents/hr-portal/SETUP.md)**: Detailed configuration, step-by-step setup guides, and database migration steps.

---

## 🛠️ Quick Setup Summary

For a detailed setup guide, please refer to the **[SETUP.md](file:///c:/Users/Admin/Documents/hr-portal/SETUP.md)** file. Below is a quick setup reference:

### 1. Database Configuration
Run the PostgreSQL initialization statements to set up the DB:
```sql
CREATE USER hr_user WITH PASSWORD 'changeme';
CREATE DATABASE hr_portal OWNER hr_user;
GRANT ALL PRIVILEGES ON DATABASE hr_portal TO hr_user;
```
Apply the database schema:
```bash
psql -U hr_user -d hr_portal -f backend/db/schema.sql
```

### 2. Environment Variables Setup
Configure the environment variables in both directories:

**backend/.env**
```env
DATABASE_URL=postgresql+asyncpg://hr_user:changeme@localhost:5432/hr_portal
SECRET_KEY=replace-with-a-strong-secret-key
DEBUG=true
```

**ai-app/.env**
```env
GEMINI_API_KEY=your-gemini-api-key-here
DATABASE_URL=postgresql://hr_user:changeme@localhost:5432/hr_portal
```

### 3. Dependencies Installation & Launch

**Run Backend:**
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
pip install -r ai-app/requirements.txt
cd backend
uvicorn app.main:app --reload --port 8000
```
Swagger UI will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

**Run Frontend:**
```bash
cd frontend
npm install
npm run dev
```
The web app will run at [http://localhost:5173](http://localhost:5173).

---

## 👥 Demo Credentials

To test the application locally, use the following logins:

| Role | Email | Password |
|---|---|---|
| **Employee** | `employee@hrportal.com` | `emp123` |
| **HR Manager** | `aprnna@hrportal.com` | `hr123` |

> *Note: The AI Chatbot interface is only available to logged-in HR Managers.*

---

## 🤖 The AI Chatbot Lifecycle
The chatbot agent leverages LangGraph's cyclical graph execution framework:

1. **`write_query`**: Utilizes `gemini-2.5-flash` model with schema context to construct a PostgreSQL SELECT query.
2. **`execute_query`**: Securely queries the database asynchronously via `asyncpg`.
3. **`generate_answer`**: Receives query results and synthesizes a natural, polite natural-language response.

### Try Querying:
* *"Who is currently checked in today?"*
* *"Show all employees working in Engineering"*
* *"Which projects are using React in their tech stack?"*
* *"List active employees who have Python skills"*
