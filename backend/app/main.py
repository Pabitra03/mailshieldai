"""
MailShieldAI Backend — FastAPI entry point.

Orchestrates the full pipeline: ingestion → detection → geo-forensics → evidence → verdict.
"""
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add project root to path for geo-intel and evidence-vault imports
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)

from app.core.config import settings
from app.api.routes import ingest, cases, geo, evidence, campaigns, reports, verdicts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    print("🚀 MailShieldAI backend starting...")
    print(f"   Database: {settings.database_url}")
    print(f"   Redis: {settings.redis_url}")
    print(f"   ML Service: {settings.ml_service_url}")
    yield
    print("🛑 MailShieldAI backend shutting down.")


app = FastAPI(
    title="MailShieldAI",
    description="AI-Powered Email Threat Detection, Geolocation & Forensic Intelligence Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(ingest.router, prefix="/api", tags=["Ingestion"])
app.include_router(cases.router, prefix="/api", tags=["Cases"])
app.include_router(geo.router, prefix="/api", tags=["Geo-Intelligence"])
app.include_router(evidence.router, prefix="/api", tags=["Evidence"])
app.include_router(campaigns.router, prefix="/api", tags=["Campaigns"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])
app.include_router(verdicts.router, prefix="/api", tags=["Verdicts"])


@app.get("/")
async def root():
    """Root endpoint providing service status and API links."""
    return {
        "status": "online",
        "service": "MailShieldAI API Backend Orchestrator",
        "version": "0.1.0",
        "interactive_docs": "http://localhost:8000/docs",
        "health_check": "http://localhost:8000/health",
        "api_routes": {
            "cases": "http://localhost:8000/api/cases",
            "ingest": "http://localhost:8000/api/ingest",
            "campaigns": "http://localhost:8000/api/campaigns",
            "reports": "http://localhost:8000/api/reports",
        },
        "ml_service_url": settings.ml_service_url,
        "frontend_dashboard": "http://localhost:5173",
    }


@app.get("/health")
async def health():
    """System health check."""
    return {
        "status": "ok",
        "service": "mailshieldai-backend",
        "version": "0.1.0",
    }
