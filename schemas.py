from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from models import Role, TaskStatus

class UserBase(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    name: str

class UserCreate(UserBase):
    password: str
    role: Role = Role.MEMBER

class User(UserBase):
    id: int
    role: Role

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    task_count: Optional[int] = 0

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    project_id: int
    assigned_to_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None

class Task(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    project_id: int
    assigned_to_id: Optional[int] = None
    project: Optional[ProjectBase] = None
    assigned_to: Optional[UserBase] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
