from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    booking_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"), nullable=True)
    vendor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    schedule_id: Mapped[int | None] = mapped_column(
        ForeignKey("bus_schedules.schedule_id"), nullable=True
    )
    booking_reference: Mapped[str] = mapped_column(String(50), nullable=False)
    journey_date: Mapped[date] = mapped_column(Date, nullable=False)
    number_of_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    booking_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    payment_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_counter_booking: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    passenger_name: Mapped[str] = mapped_column(String(120), nullable=False)
    passenger_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    passenger_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    pickup_point: Mapped[str | None] = mapped_column(String(200), nullable=True)
    drop_point: Mapped[str | None] = mapped_column(String(200), nullable=True)
    special_requests: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)