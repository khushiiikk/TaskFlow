# Team Task Manager (Full-Stack)

A premium, full-stack team management application built with **FastAPI**, **Python**, and **SQLAlchemy**. Designed for high performance and clean architecture.

## 🚀 Key Features
- **Authentication**: JWT-based secure login and registration.
- **Role-Based Access Control**:
  - **Admin**: Create projects, assign tasks to members, and manage everything.
  - **Member**: View assigned tasks and update progress.
- **Project Management**: Organize work into distinct projects.
- **Task Tracking**: Real-time status updates with a modern dashboard.
- **Premium UI**: Dark-mode glassmorphism interface built with Vanilla HTML/CSS/JS.

## ⚙️ Tech Stack
- **Backend**: FastAPI (Python 3.9+), SQLAlchemy (ORM), SQLite (Local) / PostgreSQL (Production).
- **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism), ES6+ JavaScript.
- **Security**: Password hashing with Bcrypt, Authentication with Jose JWT.
- **Deployment**: Railway (Nixpacks).

## 🛠️ Local Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   python main.py
   ```
   *The app will be available at `http://localhost:8000`.*

3. **Explore API**:
   Visit `http://localhost:8000/docs` to see the interactive Swagger API documentation.

## 🌐 Deployment
This app is designed to be deployed on **Railway**. It automatically detects the `DATABASE_URL` environment variable for production PostgreSQL.

---
*Created for AI/ML Role Application.*
