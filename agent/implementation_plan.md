# Transition to Python/FastAPI Stack

The project will be rewritten from Next.js to a Python-based stack using FastAPI, SQLAlchemy, and a Vanilla Frontend (HTML/CSS/JS). This aligns with the user's career focus on AI/ML roles.

## User Review Required

> [!IMPORTANT]
> This is a complete rewrite. All existing Next.js code will be replaced with Python/FastAPI code.
> We will use **PostgreSQL** on Railway for deployment instead of SQLite, as SQLite is not suitable for persistent storage on Railway's serverless environment. Locally, you can use SQLite.

## Proposed Changes

### Backend (Python/FastAPI)

#### [NEW] [main.py](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/main.py)
The main FastAPI application file handling routing and static file serving.

#### [NEW] [database.py](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/database.py)
SQLAlchemy engine and session configuration.

#### [NEW] [models.py](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/models.py)
Database models: `User`, `Project`, `Task`.

#### [NEW] [auth.py](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/auth.py)
JWT authentication logic, password hashing, and role-based access control.

#### [NEW] [schemas.py](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/schemas.py)
Pydantic models for API request/response validation.

### Frontend (Vanilla)

#### [NEW] [static/index.html](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/static/index.html)
Single Page Application (SPA) entry point.

#### [NEW] [static/style.css](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/static/style.css)
Premium Glassmorphism CSS.

#### [NEW] [static/script.js](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/static/script.js)
Frontend logic using Fetch API for backend communication.

### Configuration

#### [MODIFY] [railway.json](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/railway.json)
Updated to use Python builder.

#### [NEW] [requirements.txt](file:///c:/Users/hp/Downloads/New%20folder/Assignment%20Team%20Task%20Manager/requirements.txt)
Python dependencies (fastapi, uvicorn, sqlalchemy, psycopg2-binary, passlib, python-jose).

## Verification Plan

### Automated Tests
- Manual API testing via Swagger UI (`/docs`).

### Manual Verification
1. Run `uvicorn main:app --reload` locally.
2. Verify Auth flow (Register/Login).
3. Verify Project/Task CRUD.
4. Verify deployment on Railway.
