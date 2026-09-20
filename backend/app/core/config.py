"""Application configuration loaded from environment variables."""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """MailShieldAI configuration."""

    # ── Application ─────────────────────────────────────
    app_name: str = "MailShieldAI"
    app_env: str = "development"
    debug: bool = True

    # ── PostgreSQL ──────────────────────────────────────
    database_url: str = "postgresql+asyncpg://mailshield:mailshield_dev_2024@localhost:5432/mailshieldai"
    database_url_sync: str = "postgresql://mailshield:mailshield_dev_2024@localhost:5432/mailshieldai"

    # ── Redis ───────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Neo4j ───────────────────────────────────────────
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "mailshield_neo4j_2024"

    # ── MinIO ───────────────────────────────────────────
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "mailshield"
    minio_secret_key: str = "mailshield_minio_2024"
    minio_bucket: str = "evidence-vault"
    minio_use_ssl: bool = False

    # ── MaxMind GeoLite2 ────────────────────────────────
    geolite2_license_key: str = ""

    # ── ML Service ──────────────────────────────────────
    ml_service_url: str = "http://localhost:8001"

    # ── CORS ────────────────────────────────────────────
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        import os
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env")
        case_sensitive = False
        extra = "ignore"


settings = Settings()
