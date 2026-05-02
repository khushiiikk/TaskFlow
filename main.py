from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
import os

import models, schemas, auth, database
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team Task Manager")

# Authentication Routes
@app.post("/api/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # First user is Admin
    user_count = db.query(models.User).count()
    role = models.Role.ADMIN if user_count == 0 else models.Role.MEMBER
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        password=hashed_password,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login")
def login(request: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not auth.verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}
    }

# Project Routes
@app.get("/api/projects", response_model=List[schemas.Project])
def read_projects(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    projects = db.query(models.Project).all()
    # Add task counts
    for project in projects:
        project.task_count = db.query(models.Task).filter(models.Task.project_id == project.id).count()
    return projects

@app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_admin_user)):
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

# Task Routes
@app.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(project_id: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Task)
    if project_id:
        query = query.filter(models.Task.project_id == project_id)
    
    # Members only see their own tasks, Admins see all
    if current_user.role != models.Role.ADMIN:
        query = query.filter(models.Task.assigned_to_id == current_user.id)
    
    return query.order_by(models.Task.created_at.desc()).all()

@app.post("/api/tasks", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_admin_user)):
    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check permissions
    if current_user.role != models.Role.ADMIN and db_task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    update_data = task_update.dict(exclude_unset=True)
    
    # If not admin, only allow status update
    if current_user.role != models.Role.ADMIN:
        allowed_fields = {"status"}
        update_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        if not update_data:
             raise HTTPException(status_code=400, detail="Members can only update task status")

    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

# User Routes (for task assignment)
@app.get("/api/users", response_model=List[schemas.UserBase])
def read_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_admin_user)):
    return db.query(models.User).all()

# Static Files & Frontend SPA
if not os.path.exists("static"):
    os.makedirs("static")

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    # If it's an API route that didn't match, let it 404
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404)
    
    # Otherwise serve index.html for SPA routing
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return HTMLResponse("<h1>Frontend files missing! Please add static/index.html</h1>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
