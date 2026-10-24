"""
api/index.py
============
Vercel Serverless Function entry point.
Exposes the FastAPI application instance for Vercel Python runtime.
"""

from backend.app.main import app
