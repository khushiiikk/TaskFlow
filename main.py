from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
import os
import logging
import random

# Reduce logging verbosity
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy").setLevel(logging.WARNING)

import models, schemas, auth, database
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team Task Manager")

# Mock OTP storage (Phone -> OTP)
# In production, use Redis or a proper DB table with expiry
otp_store = {}

# Authentication Routes
@app.post("/api/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if phone is taken
    if user.phone:
        db_phone = db.query(models.User).filter(models.User.phone == user.phone).first()
        if db_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        phone=user.phone,
        name=user.name,
        password=hashed_password,
        role=user.role
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
        "user": {
            "id": user.id, 
            "email": user.email, 
            "phone": user.phone,
            "name": user.name, 
            "role": user.role
        }
    }

@app.post("/api/auth/otp/send")
def send_otp(request: dict, db: Session = Depends(get_db)):
    phone = request.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")
    
    user = db.query(models.User).filter(models.User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="Phone number not registered")
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    otp_store[phone] = otp
    
    print(f"--- [DEVELOPER MODE OTP] ---")
    print(f"PHONE: {phone}")
    print(f"OTP: {otp}")
    print(f"---------------------------")
    
    return {"message": "OTP sent successfully", "otp": otp} # Returning OTP for assignment convenience

@app.post("/api/auth/otp/verify")
def verify_otp(request: dict, db: Session = Depends(get_db)):
    phone = request.get("phone")
    otp = request.get("otp")
    
    if phone not in otp_store or otp_store[phone] != otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user = db.query(models.User).filter(models.User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clear OTP after use
    del otp_store[phone]
    
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id, 
            "email": user.email, 
            "phone": user.phone,
            "name": user.name, 
            "role": user.role
        }
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
@app.get("/api/users", response_model=List[schemas.User])
def read_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_admin_user)):
    return db.query(models.User).all()

# Static Files & Frontend SPA
if not os.path.exists("static"):
    os.makedirs("static")

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404)
    
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return HTMLResponse("<h1>Frontend files missing!</h1>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
