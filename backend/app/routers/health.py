"""Health check endpoint"""
from fastapi import APIRouter
from app.config import settings
from app.schemas import HealthResponse
from app.database import SessionLocal

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    """Verifica salute dell'API e connessione al database"""
    try:
        # Test database connection
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        
        return HealthResponse(
            status="ok",
            version=settings.api_version,
            environment=settings.environment
        )
    except Exception as e:
        return HealthResponse(
            status="error",
            version=settings.api_version,
            environment=settings.environment
        )
