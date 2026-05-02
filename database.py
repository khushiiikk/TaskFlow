import os
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine

# Use PostgreSQL for Railway, SQLite for local if no URL provided
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./sql_app.db"

# We'll use synchronous SQLAlchemy for simplicity as requested by the user stack (FastAPI usually async, but SQLAlchemy is often used sync)
# However, to be modern, let's use the standard engine.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Optimized for Railway free tier limits (max 20 connections)
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
