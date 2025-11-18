"""
Main.py - FastAPI application entry point
Ticket Nepal backend server
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.config.database import database, test_connection
from app.config.settings import settings
from app.api.routes import auth
from app.core.exceptions import AppException


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler - Startup ra shutdown events"""
    # Startup - Database connection test garcha
    print("🚀 Starting Ticket Nepal API...")
    await test_connection()
    print(f"✅ Database connected: {settings.DB_NAME}")
    yield
    # Shutdown - Database pool close garcha
    print("👋 Shutting down...")
    await database.disconnect()


# FastAPI application instance
app = FastAPI(
    title="Ticket Nepal API",
    description="Bus ticketing system backend API",
    version="1.0.0",
    lifespan=lifespan
)

# ===== MIDDLEWARE =====

# CORS configuration - Frontend bata request accept garcha
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware (development mode ma)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Request time ra path log garcha"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    if settings.DEBUG:
        print(f"📝 {request.method} {request.url.path} - {process_time:.3f}s")
    
    return response


# ===== EXCEPTION HANDLERS =====

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Custom exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.message,
            "detail": exc.detail
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler"""
    print(f"❌ Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


# ===== ROUTES =====

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Ticket Nepal API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "success",
        "message": "Ticket Nepal API is running",
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time()
    }


# Include routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_PREFIX}/auth",
    tags=["Authentication"]
)

# Import test router
from app.api.routes import test

app.include_router(
    test.router,
    prefix=f"{settings.API_PREFIX}/test",
    tags=["Testing"]
)

# Import vendors router
from app.api.routes import vendors

app.include_router(
    vendors.router,
    prefix=f"{settings.API_PREFIX}/vendors",
    tags=["Vendors"]
)

# Import buses router
from app.api.routes import buses

app.include_router(
    buses.router,
    prefix=f"{settings.API_PREFIX}/buses",
    tags=["Buses"]
)

# Import bookings router
from app.api.routes import bookings

app.include_router(
    bookings.router,
    prefix=f"{settings.API_PREFIX}/bookings",
    tags=["Bookings"]
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
