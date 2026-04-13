from datetime import datetime, time

from sqlalchemy import select

from app.config.database import get_session
from app.model.models import BusSchedule
from app.services.bus_service import find_bus
from app.services.route_service import find_route


def _parse_time(value: str) -> time:
    text = value.strip()
    if "T" in text:
        return datetime.fromisoformat(text).time().replace(second=0, microsecond=0)
    try:
        return time.fromisoformat(text).replace(second=0, microsecond=0)
    except ValueError:
        hour, minute = text.split(":")[:2]
        return time(int(hour), int(minute))


def _to_datetime_local(value: time) -> str:
    return f"2000-01-01T{value.strftime('%H:%M')}"


def _to_schedule_output(schedule: BusSchedule) -> dict:
    return {
        "schedule_id": schedule.schedule_id,
        "bus_id": schedule.bus_id,
        "route_id": schedule.route_id,
        "departure_time": _to_datetime_local(schedule.departure_time),
        "arrival_time": _to_datetime_local(schedule.arrival_time),
        "fare": float(schedule.price),
        "is_active": bool(schedule.is_active),
    }


def list_schedules():
    with get_session() as db:
        schedules = db.execute(
            select(BusSchedule)
            .where(BusSchedule.is_active.is_(True))
            .order_by(BusSchedule.schedule_id)
        ).scalars().all()
        return [_to_schedule_output(schedule) for schedule in schedules]


def list_all_schedules():
    with get_session() as db:
        schedules = db.execute(
            select(BusSchedule)
            .order_by(BusSchedule.schedule_id)
        ).scalars().all()
        return [_to_schedule_output(schedule) for schedule in schedules]


def find_schedule(schedule_id: int):
    with get_session() as db:
        schedule = db.execute(
            select(BusSchedule).where(BusSchedule.schedule_id == schedule_id)
        ).scalar_one_or_none()
        if schedule is None:
            return None
        return _to_schedule_output(schedule)


def create_schedule(
    bus_id: int,
    route_id: int,
    departure_time: str,
    arrival_time: str,
    fare: float,
):
    if find_bus(bus_id) is None:
        return None, "bus"
    if find_route(route_id) is None:
        return None, "route"

    with get_session() as db:
        schedule = BusSchedule(
            bus_id=bus_id,
            route_id=route_id,
            departure_time=_parse_time(departure_time),
            arrival_time=_parse_time(arrival_time),
            price=fare,
            is_active=True,
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return _to_schedule_output(schedule), None


def update_schedule(
    schedule_id: int,
    bus_id: int,
    route_id: int,
    departure_time: str,
    arrival_time: str,
    fare: float,
):
    if find_bus(bus_id) is None:
        return None, "bus"
    if find_route(route_id) is None:
        return None, "route"

    with get_session() as db:
        schedule = db.execute(
            select(BusSchedule).where(BusSchedule.schedule_id == schedule_id)
        ).scalar_one_or_none()
        if schedule is None:
            return None, "schedule"

        schedule.bus_id = bus_id
        schedule.route_id = route_id
        schedule.departure_time = _parse_time(departure_time)
        schedule.arrival_time = _parse_time(arrival_time)
        schedule.price = fare
        db.commit()
        db.refresh(schedule)
        return _to_schedule_output(schedule), None


def set_schedule_status(schedule_id: int, is_active: bool):
    with get_session() as db:
        schedule = db.execute(
            select(BusSchedule).where(BusSchedule.schedule_id == schedule_id)
        ).scalar_one_or_none()
        if schedule is None:
            return None
        schedule.is_active = is_active
        db.commit()
        db.refresh(schedule)
        return _to_schedule_output(schedule)


def delete_schedule(schedule_id: int):
    with get_session() as db:
        schedule = db.execute(
            select(BusSchedule).where(BusSchedule.schedule_id == schedule_id)
        ).scalar_one_or_none()
        if schedule is None:
            return False
        schedule.is_active = False
        db.commit()
        return True
