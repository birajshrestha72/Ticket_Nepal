import os
from contextlib import contextmanager
from datetime import time
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker


def _load_local_env() -> None:
    """Populate missing env vars from backend/.env for local development."""
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_local_env()


def _build_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_port = os.getenv("DB_PORT", "5432")

    if db_host and db_name and db_user and db_password:
        return f"postgresql+psycopg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    return "sqlite:///./ticket_nepal_app.db"


DATABASE_URL = _build_database_url()

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _ensure_bus_seat_columns() -> None:
    inspector = inspect(engine)
    if "bus_seats" not in inspector.get_table_names():
        return

    columns = {item["name"] for item in inspector.get_columns("bus_seats")}
    statements: list[str] = []

    if "is_blocked" not in columns:
        if DATABASE_URL.startswith("sqlite"):
            statements.append("ALTER TABLE bus_seats ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT 0")
        else:
            statements.append("ALTER TABLE bus_seats ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE")

    if "block_reason" not in columns:
        statements.append("ALTER TABLE bus_seats ADD COLUMN block_reason VARCHAR(120)")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


@contextmanager
def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from sqlalchemy import select, text

    from app.model.models import Bus, BusSchedule, PaymentOrder, Route, User, VendorDocument

    # Fail fast if the configured database is unreachable.
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    # Ensure runtime tables needed by newer features exist in all environments.
    VendorDocument.__table__.create(bind=engine, checkfirst=True)
    PaymentOrder.__table__.create(bind=engine, checkfirst=True)

    auto_create = os.getenv("DB_AUTO_CREATE")
    if auto_create is None:
        auto_create_enabled = DATABASE_URL.startswith("sqlite")
    else:
        auto_create_enabled = auto_create.lower() in {"1", "true", "yes", "on"}

    if auto_create_enabled:
        Base.metadata.create_all(bind=engine)

    _ensure_bus_seat_columns()

    seed_demo = os.getenv("DB_SEED_DEMO")
    if seed_demo is None:
        seed_demo_enabled = DATABASE_URL.startswith("sqlite")
    else:
        seed_demo_enabled = seed_demo.lower() in {"1", "true", "yes", "on"}

    if not seed_demo_enabled:
        return

    with get_session() as db:
        has_user = db.execute(select(User).limit(1)).scalar_one_or_none()
        if has_user is not None:
            return

        demo_student_password_hash = os.getenv("DEMO_STUDENT_PASSWORD_HASH")
        demo_vendor_password_hash = os.getenv("DEMO_VENDOR_PASSWORD_HASH")

        demo_users = [
            User(
                name="Demo Customer",
                email="customer@example.com",
                password_hash=demo_student_password_hash,
                role="customer",
            ),
            User(
                name="Demo Vendor",
                email="vendor@example.com",
                password_hash=demo_vendor_password_hash,
                role="vendor",
            ),
        ]

        demo_buses = [
            Bus(
                bus_number="Greenline Express",
                bus_type="Deluxe",
                total_seats=40,
                is_active=True,
            ),
            Bus(
                bus_number="Mountain Rider",
                bus_type="Standard",
                total_seats=35,
                is_active=True,
            ),
        ]

        demo_routes = [
            Route(
                origin="Kathmandu",
                destination="Pokhara",
                distance_km=200,
                estimated_duration_minutes=360,
                base_price=1200,
                is_active=True,
            ),
            Route(
                origin="Kathmandu",
                destination="Chitwan",
                distance_km=160,
                estimated_duration_minutes=300,
                base_price=900,
                is_active=True,
            ),
        ]

        db.add_all(demo_users)
        db.add_all(demo_buses)
        db.add_all(demo_routes)
        db.commit()

        db.refresh(demo_buses[0])
        db.refresh(demo_buses[1])
        db.refresh(demo_routes[0])
        db.refresh(demo_routes[1])

        demo_schedules = [
            BusSchedule(
                bus_id=demo_buses[0].bus_id,
                route_id=demo_routes[0].route_id,
                departure_time=time(7, 0),
                arrival_time=time(13, 0),
                price=1200,
                is_active=True,
            ),
            BusSchedule(
                bus_id=demo_buses[1].bus_id,
                route_id=demo_routes[1].route_id,
                departure_time=time(8, 30),
                arrival_time=time(13, 30),
                price=900,
                is_active=True,
            ),
        ]
        db.add_all(demo_schedules)
        db.commit()
