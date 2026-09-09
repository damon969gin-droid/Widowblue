# Root config per Vercel
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:DaerosdsoreadD12200896.!!@db.wjwxpdqhvxmonxchdsdl.supabase.co:5432/postgres")
    secret_key: str = os.getenv("SECRET_KEY", "widowblue-secret-key-2026-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cors_origins: list = ["https://widowblue.vercel.app", "http://localhost:3000"]
    debug: bool = False
    environment: str = "production"
    api_title: str = "Widow Blue API"
    api_version: str = "1.0.0"

settings = Settings()
