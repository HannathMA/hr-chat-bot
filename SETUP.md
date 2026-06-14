# HR Portal — Setup Guide

A role-based HR portal with an AI-powered chatbot (Gemini + LangGraph), FastAPI backend, and React frontend.

---

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |
| npm | 9+ |

---

## 1. PostgreSQL Setup

```sql
-- Run as postgres superuser
CREATE USER hr_user WITH PASSWORD 'changeme';
CREATE DATABASE hr_portal OWNER hr_user;
GRANT ALL PRIVILEGES ON DATABASE hr_portal TO hr_user;
```

Then apply the schema:

```bash
psql -U hr_user -d hr_portal -f backend/db/schema.sql
```

---

## 2. Backend Environment

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://hr_user:changeme@localhost:5432/hr_portal
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_ECHO=false
DB_NULLPOOL=false
SECRET_KEY=replace-with-a-strong-secret-key
DEBUG=true
```

---

## 3. AI Layer (LangGraph + Gemini)

The `ai-app/.env` needs your Gemini API key:

```env
# ai-app/.env
GEMINI_API_KEY=AIzaSy...your-key-here...
DATABASE_URL=postgresql://hr_user:changeme@localhost:5432/hr_portal
```

> **Get an API key**: https://aistudio.google.com/

---

## 4. Install Dependencies

### Backend

```bash
# From project root (uses shared .venv)
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r backend/requirements.txt
pip install -r ai-app/requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

---

## 5. Run the Backend

```bash
# From project root with .venv active
cd backend
uvicorn app.main:app --reload --port 8000
```

Swagger docs will be at: http://localhost:8000/docs

Key endpoints:
- `POST /api/chat` — HR Chatbot (LangGraph + Gemini)
- `GET  /api/employees/` — List employees
- `POST /api/attendance/check-in` — Mark attendance
- `POST /api/resumes/upload` — Upload a resume
- `GET  /health` — Health check

---

## 6. Run the Frontend

```bash
cd frontend
npm run dev
```

Open: http://localhost:5173

---

## 7. Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Employee | `employee@hrportal.com` | `emp123` |
| HR Manager | `aprnna@hrportal.com` | `hr123` |

> The **AI Chatbot** is only visible when logged in as HR Manager.

---

## 8. How the Chatbot Works

1. HR Admin types a question: *"What projects has Anu worked on?"*
2. `POST /api/chat` sends the question to the LangGraph pipeline
3. **Node 1 – write_query**: Gemini generates a PostgreSQL SELECT query
4. **Node 2 – execute_query**: asyncpg runs the query against `hr_portal` DB
5. **Node 3 – generate_answer**: Gemini converts query results to natural language
6. The response is displayed in the Chatbot panel

Example questions to try:
- *"Who are the active project leads?"*
- *"Show attendance summary for today"*
- *"List employees with Python skills"*
- *"What is the total headcount by department?"*

---

## Architecture

```
Browser (React + Vite :5173)
        │
        │ REST fetch /api/*
        ▼
FastAPI (uvicorn :8000)
   ├── /api/employees
   ├── /api/attendance
   ├── /api/projects
   ├── /api/skills
   ├── /api/resumes
    └── /api/chat ──► LangGraph Pipeline ──► Gemini API
                           │
                           ▼
                    PostgreSQL :5432
                    (hr_portal DB)
```
