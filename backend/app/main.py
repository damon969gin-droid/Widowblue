"""Main FastAPI application con database persistence"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import auth, contacts, messages, rewards, health
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crea le tabelle se non esistono
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="Backend per Widow Blue - Chat Reale, Autenticazione, Rewards",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(contacts.router, prefix="/api/chat", tags=["Contacts"])
app.include_router(messages.router, prefix="/api/chat", tags=["Messages"])
app.include_router(rewards.router, prefix="/api/rewards", tags=["Rewards"])

@app.get("/")
def read_root():
    return {
        "message": "Widow Blue API - Production",
        "version": settings.api_version,
        "docs": "/api/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
