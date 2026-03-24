"""Application configuration and settings."""
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/zakat_db"
    
    # Rules file path
    rules_path: Path = Path(__file__).parent.parent.parent / "zakat_rules_full_v1.json"
    
    # API
    api_title: str = "Corporate Zakat Calculation API"
    api_version: str = "1.0.0"
    
    # Auth: JWT secret (required in production)
    secret_key: str = "change-me-in-production-use-env-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480  # 8 hours

    # Runtime environment
    env: str = "development"  # development | production

    # Initial admin seed (used only when no ADMIN exists)
    admin_email: Optional[str] = None
    admin_password: Optional[str] = None
    
    # Default company password for existing companies (migration backfill only)
    default_company_password: str = "ChangeMe123"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
