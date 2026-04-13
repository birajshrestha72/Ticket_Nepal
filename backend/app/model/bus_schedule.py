from datetime import time

from sqlalchemy import Boolean, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class BusSchedule(Base):
    __tablename__ = "bus_schedules"

    schedule_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    bus_id: Mapped[int | None] = mapped_column(ForeignKey("buses.bus_id"), nullable=True)
    route_id: Mapped[int | None] = mapped_column(ForeignKey("routes.route_id"), nullable=True)
    departure_time: Mapped[time] = mapped_column(nullable=False)
    arrival_time: Mapped[time] = mapped_column(nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, nullable=True)