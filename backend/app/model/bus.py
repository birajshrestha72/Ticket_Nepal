from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class Bus(Base):
    __tablename__ = "buses"

    bus_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    bus_number: Mapped[str] = mapped_column(String(100), nullable=False)
    bus_type: Mapped[str] = mapped_column(String(50), nullable=False)
    total_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    seat_layout_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=40)
    seat_layout_cols: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    is_active: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


class BusSeat(Base):
    __tablename__ = "bus_seats"

    bus_seat_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    bus_id: Mapped[int | None] = mapped_column(ForeignKey("buses.bus_id"), nullable=True)
    seat_label: Mapped[str] = mapped_column(String(20), nullable=False)
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    col_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    block_reason: Mapped[str | None] = mapped_column(String(120), nullable=True)