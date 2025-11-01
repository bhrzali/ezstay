from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.routers import auth, apartments, admin, bookings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EZStay API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(apartments.router, prefix="/api/apartments", tags=["apartments"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])

# Health and test endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Root route
@app.get("/")
async def root():
    """API root endpoint"""
    return HTMLResponse(content="""
    <html>
        <head><title>EZStay API</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>EZStay API</h1>
            <p>Backend API is running. Available endpoints:</p>
            <ul style="list-style: none; padding: 0;">
                <li><a href="/api/docs">API Documentation (Swagger)</a></li>
                <li><a href="/api/redoc">API Documentation (ReDoc)</a></li>
                <li><a href="/api/health">Health Check</a></li>
                <li><a href="/api/apartments">List Apartments</a></li>
            </ul>
            <p style="margin-top: 20px;">For frontend, run: <code>cd frontend && npm run dev</code></p>
        </body>
    </html>
    """)
