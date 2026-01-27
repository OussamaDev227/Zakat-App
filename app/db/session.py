"""Database session management."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings
from app.db.base import Base

# Create engine
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=False,  # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database (create tables)."""
    Base.metadata.create_all(bind=engine)
