from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from pathlib import Path

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.routers import auth, apartments, admin, bookings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EazyStay API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers FIRST - before any catch-all routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(apartments.router, prefix="/api/apartments", tags=["apartments"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])

# Health and test endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/test/apartments")
async def test_apartments_endpoint(db: Session = Depends(get_db)):
    """Test endpoint to verify apartments route works"""
    from app.services.apartment_service import ApartmentService
    apartment_service = ApartmentService(db)
    apartments = apartment_service.get_all_apartments()
    return {
        "count": len(apartments),
        "apartments": [
            {
                "id": apt.id,
                "title": apt.title,
                "city": apt.city
            }
            for apt in apartments[:5]
        ]
    }

# Serve frontend static files (only in production)
frontend_path = Path(__file__).parent.parent.parent / "frontend"
frontend_build_path = frontend_path / ".next"

# Serve static assets
static_path = frontend_build_path / "static"
if static_path.exists():
    app.mount("/_next/static", StaticFiles(directory=str(static_path)), name="static")

# Serve other static assets (images, etc.)
public_path = frontend_path / "public"
if public_path.exists():
    app.mount("/static", StaticFiles(directory=str(public_path)), name="public")

# Root route
@app.get("/")
async def serve_root():
    """Serve root - redirect or show message"""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content="""
    <html>
        <head><title>EazyStay</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>EazyStay Backend</h1>
            <p>API is available at:</p>
            <ul style="list-style: none; padding: 0;">
                <li><a href="/api/docs">API Documentation</a></li>
                <li><a href="/api/apartments">List Apartments</a></li>
                <li><a href="/api/health">Health Check</a></li>
            </ul>
            <p style="margin-top: 20px;">For frontend, run: <code>cd frontend && npm run dev</code></p>
        </body>
    </html>
    """)

# Catch-all route for frontend pages ONLY - must be last
# FastAPI will match specific routes (like /api/apartments) before this catch-all
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve Next.js frontend for all non-API routes"""
    # This should never be reached for /api/* routes since they're registered above
    # But add safeguard just in case
    if full_path.startswith("api/"):
        raise HTTPException(
            status_code=404, 
            detail="API route not found. Available routes: /api/docs, /api/apartments, /api/auth, /api/admin"
        )
    
    # Skip static file routes
    if full_path.startswith("_next/"):
        raise HTTPException(status_code=404, detail="Not found")
    
    # In development, redirect to Next.js dev server message
    # In production, try to serve the built files
    build_html_path = frontend_build_path / "server" / "app" / "page.html"
    if build_html_path.exists():
        return FileResponse(str(build_html_path))
    
    # Fallback - return a message
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content="""
    <html>
        <head><title>EazyStay</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>EazyStay Backend</h1>
            <p>Frontend is not built. For development, run the frontend separately:</p>
            <code>cd frontend && npm run dev</code>
            <p style="margin-top: 20px;"><a href="/api/docs">API Documentation</a></p>
        </body>
    </html>
    """)
