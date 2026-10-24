"""
backend/app/main.py
===================
Entry point for WindWatchGB (UK Day-Ahead Wind Forecast Evaluation Platform) API.
"""

from pathlib import Path
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.endpoints import router as wind_router
from backend.app.config import settings
from backend.app.models.schemas import HealthResponse
from backend.app.services.data_loader import get_data_counts

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production analytics platform for day-ahead wind forecast evaluation on UK Elexon BMRS data.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers (support both with and without /api prefix for Vercel and local dev)
app.include_router(wind_router, prefix=settings.API_V1_STR)
app.include_router(wind_router, prefix="")


@app.get("/health", response_model=HealthResponse, tags=["health"])
@app.get("/api/health", response_model=HealthResponse, tags=["health"])
def health_check() -> HealthResponse:
    """Health status and dataset readiness check."""
    act_count, fc_count = get_data_counts()
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        data_loaded=(act_count > 0 and fc_count > 0),
        actuals_count=act_count,
        forecasts_count=fc_count,
    )


@app.get("/api", tags=["root"])
def api_root():
    """API info endpoint."""
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
    }


def get_frontend_dist() -> Optional[Path]:
    """Locate the built frontend distribution directory."""
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path.cwd() / "frontend" / "dist",
        Path("/var/task/frontend/dist"),
    ]
    for c in candidates:
        if c.exists() and (c / "index.html").exists():
            return c
    return None


frontend_dist = get_frontend_dist()
if frontend_dist is not None:
    # Serve single-page frontend application at root
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
else:
    @app.get("/", tags=["root"])
    def root_fallback():
        return {
            "platform": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "operational",
            "message": "Frontend build not detected. Visit /docs for API documentation.",
            "docs": "/docs",
        }
