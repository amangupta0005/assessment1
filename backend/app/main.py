"""
backend/app/main.py
===================
Entry point for UK Day-Ahead Wind Forecast Evaluation Platform API.
"""

from pathlib import Path
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

# Register API routers
app.include_router(wind_router, prefix=settings.API_V1_STR)


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


# Serve frontend static files if built (e.g. in Docker or production deployment)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")
