"""
Database engine with automatic fallback:
- Tries to connect to the configured DATABASE_URL (PostgreSQL)
- If connection fails (not installed/running), falls back to local SQLite
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

def _build_engine():
    db_url = os.getenv("DATABASE_URL", "")

    if db_url and not db_url.startswith("postgresql://user:password"):
        # Looks like a real configured URL — try it
        try:
            test_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"[DB] Connected to PostgreSQL: {db_url.split('@')[-1]}")
            return test_engine
        except Exception as e:
            print(f"[DB] PostgreSQL unavailable ({e}). Falling back to SQLite.")

    # Fallback: SQLite stored next to this file
    sqlite_path = os.path.join(os.path.dirname(__file__), "..", "..", "crm_local.db")
    sqlite_path = os.path.abspath(sqlite_path)
    sqlite_url = f"sqlite:///{sqlite_path}"
    print(f"[DB] Using SQLite fallback: {sqlite_path}")
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
