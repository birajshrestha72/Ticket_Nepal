from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config.database import init_db
from app.controller import (
    admin_controller,
    auth_controller,
    booking_controller,
    bus_controller,
    payment_order_controller,
    review_controller,
    superadmin_controller,
    user_controller,
)

openapi_tags = [
    {"name": "Auth", "description": "Authentication: register, login, forgot/reset password, Google login."},
    {"name": "Users", "description": "User listing and user lookup endpoints."},
    {"name": "Buses", "description": "Public/simple bus endpoints."},
    {"name": "Bookings", "description": "Booking creation and booking listing."},
    {"name": "Reviews", "description": "Customer review submission and review listing."},
    {"name": "Admin", "description": "Vendor admin endpoints: CRUD, analytics, seats, reviews."},
    {"name": "SuperAdmin", "description": "System admin endpoints: vendor verification, global CRUD, analytics."},
]

app = FastAPI(
    title="Ticket Nepal API",
    version="0.1.0",
    description=(
        "Ticket Nepal backend API for auth, bookings, user dashboards, and admin operations. "
        "Use /api/docs for Swagger documentation."
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_tags=openapi_tags,
)

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

extra_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]

allowed_origins = list(dict.fromkeys(DEFAULT_ALLOWED_ORIGINS + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Router haru yaha jodeko ho, so app entry file compact ra readable rahos.
app.include_router(auth_controller.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user_controller.router, prefix="/api/users", tags=["Users"])
app.include_router(bus_controller.router, prefix="/api/buses", tags=["Buses"])
app.include_router(admin_controller.router, prefix="/api/admin", tags=["Admin"])
app.include_router(superadmin_controller.router, prefix="/api/superadmin", tags=["SuperAdmin"])
app.include_router(
    booking_controller.router,
    prefix="/api/bookings",
    tags=["Bookings"],
)
app.include_router(
    payment_order_controller.router,
    prefix="/api/payments",
    tags=["Bookings"],
)
app.include_router(
    payment_order_controller.router,
    prefix="/api/payment",
    tags=["Bookings"],
)
app.include_router(
    review_controller.router,
    prefix="/api/reviews",
    tags=["Reviews"],
)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "message": "Ticket Nepal backend is running"}
