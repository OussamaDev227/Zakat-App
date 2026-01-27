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
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
