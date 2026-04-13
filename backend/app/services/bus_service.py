from datetime import time
import math

from sqlalchemy import select

from app.config.database import get_session
from app.model.models import Bus, BusSchedule, BusSeat, Route


def _bus_context(db, bus_id: int):
    schedule = db.execute(
        select(BusSchedule).where(BusSchedule.bus_id == bus_id).order_by(BusSchedule.schedule_id)
    ).scalars().first()

    route = None
    if schedule is not None and schedule.route_id is not None:
        route = db.execute(select(Route).where(Route.route_id == schedule.route_id)).scalar_one_or_none()

    return schedule, route


def _seat_label(row_index: int, col_index: int) -> str:
    if row_index <= 26:
        return f"{chr(64 + row_index)}{col_index}"
    return f"R{row_index}C{col_index}"


def _default_layout_cols(bus_type: str | None) -> int:
    value = (bus_type or "").lower()
    if value == "sleeper":
        return 3
    if value == "mini":
        return 4
    return 4


def _build_layout_seats(
    seat_layout_rows: int,
    seat_layout_cols: int,
    seats: list[dict] | None = None,
    active_limit: int | None = None,
) -> list[dict]:
    if seat_layout_rows < 1 or seat_layout_cols < 1:
        raise ValueError("Seat layout rows and columns must be at least 1")

    generated = _generate_layout_grid(seat_layout_rows, seat_layout_cols)
    if seats is None:
        return _apply_active_limit(generated, active_limit)

    custom_cells = _parse_custom_layout_cells(seat_layout_rows, seat_layout_cols, seats)
    return _merge_layout_with_custom_cells(generated, custom_cells)


def _generate_layout_grid(seat_layout_rows: int, seat_layout_cols: int) -> list[dict]:
    generated: list[dict] = []
    for row_index in range(1, seat_layout_rows + 1):
        for col_index in range(1, seat_layout_cols + 1):
            generated.append(
                {
                    "row_index": row_index,
                    "col_index": col_index,
                    "seat_label": _seat_label(row_index, col_index),
                    "is_active": True,
                    "is_blocked": False,
                    "block_reason": None,
                }
            )
    return generated


def _apply_active_limit(generated: list[dict], active_limit: int | None) -> list[dict]:
    if active_limit is None:
        return generated

    for idx, item in enumerate(generated):
        item["is_active"] = idx < active_limit
        if not item["is_active"]:
            item["is_blocked"] = False
            item["block_reason"] = None
    return generated


def _parse_custom_layout_cells(seat_layout_rows: int, seat_layout_cols: int, seats: list[dict]) -> dict:
    cells: dict[tuple[int, int], dict] = {}
    for seat in seats:
        row_index = int(seat["row_index"])
        col_index = int(seat["col_index"])
        if row_index < 1 or row_index > seat_layout_rows:
            raise ValueError("Seat row index is out of range")
        if col_index < 1 or col_index > seat_layout_cols:
            raise ValueError("Seat column index is out of range")

        key = (row_index, col_index)
        if key in cells:
            raise ValueError("Duplicate seat cell position found")

        cells[key] = {
            "row_index": row_index,
            "col_index": col_index,
            "seat_label": seat.get("seat_label") or _seat_label(row_index, col_index),
            "is_active": bool(seat.get("is_active", True)),
            "is_blocked": bool(seat.get("is_blocked", False)),
            "block_reason": (seat.get("block_reason") or "").strip() or None,
        }

        if not cells[key]["is_active"]:
            cells[key]["is_blocked"] = False
            cells[key]["block_reason"] = None
    return cells


def _merge_layout_with_custom_cells(generated: list[dict], custom_cells: dict) -> list[dict]:
    normalized: list[dict] = []
    for item in generated:
        key = (item["row_index"], item["col_index"])
        normalized.append(custom_cells.get(key, {**item}))
    return normalized


def _layout_output(bus: Bus, seats: list[dict]) -> dict:
    active_count = sum(1 for seat in seats if seat["is_active"])
    blocked_count = sum(1 for seat in seats if seat.get("is_active") and seat.get("is_blocked"))
    return {
        "bus_id": bus.bus_id,
        "bus_name": bus.bus_number,
        "bus_type": bus.bus_type,
        "seat_layout_rows": bus.seat_layout_rows,
        "seat_layout_cols": bus.seat_layout_cols,
        "total_seats": bus.total_seats,
        "active_seats": active_count,
        "bookable_seats": max(0, active_count - blocked_count),
        "blocked_seats": blocked_count,
        "seats": seats,
    }


def _sync_bus_seats(db, bus_id: int, seat_cells: list[dict]):
    existing = db.execute(
        select(BusSeat)
        .where(BusSeat.bus_id == bus_id)
        .order_by(BusSeat.row_index, BusSeat.col_index)
    ).scalars().all()

    existing_by_position = {(seat.row_index, seat.col_index): seat for seat in existing}
    touched_ids = set()

    for cell in seat_cells:
        row_index = cell["row_index"]
        col_index = cell["col_index"]
        current = existing_by_position.get((row_index, col_index))
        if current is None:
            db.add(
                BusSeat(
                    bus_id=bus_id,
                    seat_label=cell["seat_label"],
                    row_index=row_index,
                    col_index=col_index,
                    is_active=cell["is_active"],
                    is_blocked=bool(cell.get("is_blocked", False)),
                    block_reason=(cell.get("block_reason") or None),
                )
            )
            continue

        current.seat_label = cell["seat_label"]
        current.is_active = cell["is_active"]
        current.is_blocked = bool(cell.get("is_blocked", False)) if cell["is_active"] else False
        current.block_reason = (cell.get("block_reason") or None) if current.is_blocked else None
        touched_ids.add(current.bus_seat_id)

    for seat in existing:
        if seat.bus_seat_id not in touched_ids:
            seat.is_active = False
            seat.is_blocked = False
            seat.block_reason = None


def _to_bus_output(db, bus: Bus) -> dict:
    schedule, route = _bus_context(db, bus.bus_id)

    from_city = route.origin if route is not None else "N/A"
    to_city = route.destination if route is not None else "N/A"
    price = 0
    if schedule is not None:
        price = schedule.price
    elif route is not None:
        price = route.base_price

    return {
        "bus_id": bus.bus_id,
        "bus_name": bus.bus_number,
        "bus_type": bus.bus_type,
        "from_city": from_city,
        "to_city": to_city,
        "price": float(price),
        "seat_capacity": bus.total_seats,
        "seat_layout_rows": bus.seat_layout_rows,
        "seat_layout_cols": bus.seat_layout_cols,
        "is_active": bool(bus.is_active),
    }


def _resolve_route(db, from_city: str, to_city: str, price: float) -> Route:
    route = db.execute(
        select(Route).where(Route.origin == from_city, Route.destination == to_city)
    ).scalar_one_or_none()
    if route is not None:
        if route.base_price in (None, 0):
            route.base_price = price
        return route

    route = Route(
        origin=from_city,
        destination=to_city,
        distance_km=0,
        estimated_duration_minutes=0,
        base_price=price,
        is_active=True,
    )
    db.add(route)
    db.flush()
    return route


def list_buses():
    with get_session() as db:
        buses = db.execute(
            select(Bus).where(Bus.is_active.is_(True)).order_by(Bus.bus_id)
        ).scalars().all()
        return [_to_bus_output(db, bus) for bus in buses]


def list_all_buses():
    with get_session() as db:
        buses = db.execute(
            select(Bus).order_by(Bus.bus_id)
        ).scalars().all()
        return [_to_bus_output(db, bus) for bus in buses]


def list_search_locations():
    with get_session() as db:
        rows = db.execute(
            select(Route.origin, Route.destination)
            .where(
                Route.is_active.is_(True),
                Route.origin.is_not(None),
                Route.destination.is_not(None),
            )
            .order_by(Route.origin, Route.destination)
        ).all()

        return [
            {
                "from_city": origin,
                "to_city": destination,
            }
            for origin, destination in rows
            if origin and destination
        ]


def find_bus(bus_id: int):
    with get_session() as db:
        bus = db.execute(select(Bus).where(Bus.bus_id == bus_id)).scalar_one_or_none()
        if bus is None:
            return None
        return _to_bus_output(db, bus)


def create_bus(bus_name: str, from_city: str, to_city: str, price: float):
    return create_bus_admin(
        bus_name=bus_name,
        bus_type="Standard",
        from_city=from_city,
        to_city=to_city,
        price=price,
        seat_capacity=40,
    )


def create_bus_admin(
    bus_name: str,
    bus_type: str,
    from_city: str,
    to_city: str,
    price: float,
    seat_capacity: int,
):
    seat_layout_cols = _default_layout_cols(bus_type)
    seat_layout_rows = max(1, math.ceil(seat_capacity / seat_layout_cols))

    with get_session() as db:
        new_bus = Bus(
            bus_number=bus_name,
            bus_type=bus_type,
            total_seats=seat_capacity,
            seat_layout_rows=seat_layout_rows,
            seat_layout_cols=seat_layout_cols,
            is_active=True,
        )
        db.add(new_bus)
        db.flush()

        route = _resolve_route(db, from_city, to_city, price)

        schedule = BusSchedule(
            bus_id=new_bus.bus_id,
            route_id=route.route_id,
            departure_time=time(0, 0),
            arrival_time=time(0, 0),
            price=price,
            is_active=True,
        )
        db.add(schedule)

        seat_cells = _build_layout_seats(
            seat_layout_rows=seat_layout_rows,
            seat_layout_cols=seat_layout_cols,
            active_limit=seat_capacity,
        )
        db.add_all(
            [
                BusSeat(
                    bus_id=new_bus.bus_id,
                    seat_label=seat["seat_label"],
                    row_index=seat["row_index"],
                    col_index=seat["col_index"],
                    is_active=seat["is_active"],
                    is_blocked=bool(seat.get("is_blocked", False)),
                    block_reason=seat.get("block_reason"),
                )
                for seat in seat_cells
            ]
        )

        db.commit()
        db.refresh(new_bus)
        return _to_bus_output(db, new_bus)


def update_bus(
    bus_id: int,
    bus_name: str,
    bus_type: str,
    from_city: str,
    to_city: str,
    price: float,
    seat_capacity: int,
):
    with get_session() as db:
        bus = db.execute(select(Bus).where(Bus.bus_id == bus_id)).scalar_one_or_none()
        if bus is None:
            return None

        bus.bus_number = bus_name
        bus.bus_type = bus_type
        bus.total_seats = seat_capacity

        if bus.seat_layout_cols < 1:
            bus.seat_layout_cols = _default_layout_cols(bus_type)
        if (bus.seat_layout_rows * bus.seat_layout_cols) < seat_capacity:
            bus.seat_layout_rows = max(1, math.ceil(seat_capacity / bus.seat_layout_cols))

        route = _resolve_route(db, from_city, to_city, price)
        schedule = db.execute(
            select(BusSchedule).where(BusSchedule.bus_id == bus.bus_id).order_by(BusSchedule.schedule_id)
        ).scalars().first()

        if schedule is None:
            schedule = BusSchedule(
                bus_id=bus.bus_id,
                route_id=route.route_id,
                departure_time=time(0, 0),
                arrival_time=time(0, 0),
                price=price,
                is_active=bool(bus.is_active),
            )
            db.add(schedule)
        else:
            schedule.route_id = route.route_id
            schedule.price = price

        existing_seats = db.execute(
            select(BusSeat)
            .where(BusSeat.bus_id == bus.bus_id)
            .order_by(BusSeat.row_index, BusSeat.col_index)
        ).scalars().all()

        updated_cells = _build_layout_seats(
            seat_layout_rows=bus.seat_layout_rows,
            seat_layout_cols=bus.seat_layout_cols,
            seats=[
                {
                    "row_index": seat.row_index,
                    "col_index": seat.col_index,
                    "seat_label": seat.seat_label,
                    "is_active": seat.is_active,
                    "is_blocked": bool(getattr(seat, "is_blocked", False)),
                    "block_reason": getattr(seat, "block_reason", None),
                }
                for seat in existing_seats
            ] if existing_seats else None,
            active_limit=None if existing_seats else seat_capacity,
        )
        if existing_seats:
            for idx, seat in enumerate(updated_cells):
                seat["is_active"] = idx < seat_capacity and seat["is_active"]

        _sync_bus_seats(db, bus.bus_id, updated_cells)

        db.commit()
        db.refresh(bus)
        return _to_bus_output(db, bus)


def set_bus_status(bus_id: int, is_active: bool):
    with get_session() as db:
        bus = db.execute(select(Bus).where(Bus.bus_id == bus_id)).scalar_one_or_none()
        if bus is None:
            return None

        bus.is_active = is_active
        schedules = db.execute(select(BusSchedule).where(BusSchedule.bus_id == bus_id)).scalars().all()
        for schedule in schedules:
            schedule.is_active = is_active

        db.commit()
        db.refresh(bus)
        return _to_bus_output(db, bus)


def delete_bus(bus_id: int):
    with get_session() as db:
        bus = db.execute(select(Bus).where(Bus.bus_id == bus_id)).scalar_one_or_none()
        if bus is None:
            return False

        bus.is_active = False
        schedules = db.execute(select(BusSchedule).where(BusSchedule.bus_id == bus_id)).scalars().all()
        for schedule in schedules:
            schedule.is_active = False

        seats = db.execute(select(BusSeat).where(BusSeat.bus_id == bus_id)).scalars().all()
        for seat in seats:
            seat.is_active = False

        db.commit()
        return True


def get_bus_seat_layout(bus_id: int):
    with get_session() as db:
        bus = db.execute(select(Bus).where(Bus.bus_id == bus_id)).scalar_one_or_none()
        if bus is None:
            return None

        rows = max(1, bus.seat_layout_rows)
        cols = max(1, bus.seat_layout_cols)
        seats = db.execute(
            select(BusSeat)
            .where(BusSeat.bus_id == bus_id)
            .order_by(BusSeat.row_index, BusSeat.col_index)
        ).scalars().all()

        if seats:
            # Normalize older/incomplete datasets so every grid position is represented.
            seat_cells = _build_layout_seats(
                seat_layout_rows=rows,
                seat_layout_cols=cols,
                seats=[
                    {
                        "row_index": seat.row_index,
                        "col_index": seat.col_index,
                        "seat_label": seat.seat_label,
                        "is_active": bool(seat.is_active),
                        "is_blocked": bool(getattr(seat, "is_blocked", False)),
                        "block_reason": getattr(seat, "block_reason", None),
                    }
                    for seat in seats
                ],
            )
        else:
            seat_cells = _build_layout_seats(
                seat_layout_rows=rows,
                seat_layout_cols=cols,
                active_limit=bus.total_seats,
            )

        return _layout_output(bus, seat_cells)


def save_bus_seat_layout(
    bus_id: int,
    seat_layout_rows: int,
    seat_layout_cols: int,
    seats: list[dict] | None,
):
    with get_session() as db:
        bus = db.execute(select(Bus).where(Bus.bus_id == bus_id)).scalar_one_or_none()
        if bus is None:
            return None

        seat_cells = _build_layout_seats(
            seat_layout_rows=seat_layout_rows,
            seat_layout_cols=seat_layout_cols,
            seats=seats,
        )
        active_count = sum(1 for seat in seat_cells if seat["is_active"])
        if active_count < 1:
            raise ValueError("At least one active seat is required")

        bus.seat_layout_rows = seat_layout_rows
        bus.seat_layout_cols = seat_layout_cols
        bus.total_seats = active_count

        _sync_bus_seats(db, bus_id, seat_cells)

        db.commit()
        db.refresh(bus)
        return _layout_output(bus, seat_cells)
