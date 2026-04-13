from datetime import date, datetime, timezone

from sqlalchemy import select

from app.config.database import get_session
from app.model.models import Booking, Bus, BusSchedule, Route, User
from app.services.bus_service import find_bus, get_bus_seat_layout
from app.services.email_service import format_refund_email, format_ticket_email, send_email
from app.services.pdf_service import generate_refund_receipt_pdf, generate_ticket_pdf
from app.services.user_service import find_user

SEAT_PREFIX = "SEATS:"


def _normalize_seat_labels(seat_labels: list[str] | None) -> list[str]:
    if not seat_labels:
        return []

    normalized: list[str] = []
    seen = set()
    for raw in seat_labels:
        value = str(raw).strip().upper()
        if not value or value in seen:
            continue
        seen.add(value)
        normalized.append(value)
    return normalized


def _seat_note(seat_labels: list[str]) -> str | None:
    if not seat_labels:
        return None
    return f"{SEAT_PREFIX}{','.join(seat_labels)}"


def _parse_seat_labels(note: str | None) -> list[str]:
    if not note:
        return []

    text = note.strip()
    if not text.startswith(SEAT_PREFIX):
        return []

    raw = text[len(SEAT_PREFIX):].strip()
    if not raw:
        return []
    return [item.strip().upper() for item in raw.split(",") if item.strip()]


def _find_schedule_for_bus(db, bus_id: int):
    return db.execute(
        select(BusSchedule)
        .where(BusSchedule.bus_id == bus_id, BusSchedule.is_active.is_(True))
        .order_by(BusSchedule.schedule_id)
    ).scalars().first()


def _find_schedule_for_booking(db, booking: Booking):
    if booking.schedule_id is None:
        return None
    return db.execute(
        select(BusSchedule).where(BusSchedule.schedule_id == booking.schedule_id)
    ).scalar_one_or_none()


def _hours_before_departure(schedule: BusSchedule | None, journey_date: date) -> float:
    if schedule is None:
        return 0.0

    departure_at = datetime.combine(journey_date, schedule.departure_time)
    now = datetime.now()
    delta = departure_at - now
    return max(0.0, delta.total_seconds() / 3600.0)


def _refund_percent(hours_before_departure: float) -> int:
    if hours_before_departure >= 24:
        return 100
    if hours_before_departure >= 18:
        return 50
    if hours_before_departure >= 12:
        return 40
    if hours_before_departure >= 9:
        return 25
    if hours_before_departure >= 3:
        return 15
    return 0


def _refund_summary(
    removed_seat_count: int,
    per_seat_amount: float,
    refund_percent: int,
) -> dict:
    refundable_base = round(removed_seat_count * per_seat_amount, 2)
    refund_amount = round(refundable_base * (refund_percent / 100.0), 2)
    return {
        "removed_seat_count": removed_seat_count,
        "per_seat_amount": round(per_seat_amount, 2),
        "refund_percent": refund_percent,
        "refund_amount": refund_amount,
    }


def _seat_occupancy_status(booking: Booking) -> str | None:
    booking_status = (booking.booking_status or "").lower()
    payment_status = (booking.payment_status or "").lower()

    if booking_status == "cancelled":
        return None

    sold_payment_states = {"paid", "pay_later", "partially_paid", "partially_refunded"}
    sold_booking_states = {"confirmed", "completed"}

    if payment_status in sold_payment_states or booking_status in sold_booking_states:
        return "sold"
    return "booked"


def _occupied_seat_statuses(db, bus_id: int, journey_date: date) -> dict[str, str]:
    schedule = _find_schedule_for_bus(db, bus_id)
    if schedule is None:
        return {}

    bookings = db.execute(
        select(Booking).where(
            Booking.schedule_id == schedule.schedule_id,
            Booking.journey_date == journey_date,
        )
    ).scalars().all()

    occupied: dict[str, str] = {}
    for booking in bookings:
        occupancy = _seat_occupancy_status(booking)
        if occupancy is None:
            continue
        for label in _parse_seat_labels(booking.special_requests):
            # Keep sold status if both booked and sold records appear for same label.
            existing = occupied.get(label)
            if existing == "sold":
                continue
            if occupancy == "sold":
                occupied[label] = "sold"
            elif existing is None:
                occupied[label] = "booked"
    return occupied


def _max_seats_per_transaction(bus_total_seats: int) -> int:
    # Higher-capacity buses allow up to 10 seats per booking transaction.
    # Lower-capacity buses allow up to 7 seats per booking transaction.
    return 10 if int(bus_total_seats or 0) >= 40 else 7


def _refund_context(db, booking: Booking) -> tuple[float, int, float, int, float]:
    schedule = _find_schedule_for_booking(db, booking)
    hours_before = _hours_before_departure(schedule, booking.journey_date)
    percent = _refund_percent(hours_before)
    seat_count = int(booking.number_of_seats or 0)
    if schedule is not None:
        per_seat_amount = float(schedule.price)
    else:
        per_seat_amount = float(booking.total_amount or 0) / seat_count if seat_count > 0 else 0.0
    return hours_before, percent, per_seat_amount, seat_count, float(booking.total_amount or 0)


def _to_booking_output(db, booking: Booking) -> dict:
    bus_id = None
    schedule_id = booking.schedule_id
    departure_time = None
    arrival_time = None
    seat_labels = _parse_seat_labels(booking.special_requests)
    if booking.schedule_id is not None:
        schedule = db.execute(
            select(BusSchedule).where(BusSchedule.schedule_id == booking.schedule_id)
        ).scalar_one_or_none()
        if schedule is not None:
            bus_id = schedule.bus_id
            departure_time = schedule.departure_time.strftime("%H:%M")
            arrival_time = schedule.arrival_time.strftime("%H:%M")

    return {
        "booking_id": booking.booking_id,
        "booking_reference": booking.booking_reference,
        "user_id": booking.user_id,
        "bus_id": bus_id,
        "schedule_id": schedule_id,
        "journey_date": str(booking.journey_date),
        "departure_time": departure_time,
        "arrival_time": arrival_time,
        "seats": booking.number_of_seats,
        "seat_labels": seat_labels,
        "total_amount": float(booking.total_amount),
        "status": booking.booking_status or "pending",
        "payment_status": booking.payment_status or "unpaid",
        "payment_method": booking.payment_method,
    }


def _parse_date(value: str) -> date:
    return datetime.fromisoformat(value).date()


def _booking_ref(user_id: int) -> str:
    return f"BK{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{user_id}"


def _validate_booking_user_and_bus(user_id: int, bus_id: int):
    user = find_user(user_id)
    if user is None:
        return None, None, "user"

    bus = find_bus(bus_id)
    if bus is None:
        return None, None, "bus"

    return user, bus, None


def _validate_booking_seat_count(seats: int, bus: dict):
    max_seats = _max_seats_per_transaction(bus.get("seat_capacity", 0))
    if seats < 1 or seats > max_seats:
        return None, "seat_limit"
    return max_seats, None


def _validate_input_seat_labels(seat_labels: list[str] | None, seats: int):
    normalized_seat_labels = _normalize_seat_labels(seat_labels)
    if normalized_seat_labels and len(normalized_seat_labels) != seats:
        return None, "seat_count"
    return normalized_seat_labels, None


def _validate_requested_seat_labels(db, bus_id: int, journey_date: date, normalized_seat_labels: list[str]):
    if not normalized_seat_labels:
        return None

    layout = get_bus_seat_layout(bus_id)
    if layout is None:
        return "bus"

    active_labels = {
        seat["seat_label"].upper()
        for seat in layout["seats"]
        if seat.get("is_active")
    }
    blocked_labels = {
        seat["seat_label"].upper()
        for seat in layout["seats"]
        if seat.get("is_active") and seat.get("is_blocked")
    }
    for label in normalized_seat_labels:
        if label not in active_labels:
            return "seat_invalid"
        if label in blocked_labels:
            return "seat_blocked"

    occupied_labels = _occupied_seat_statuses(db, bus_id, journey_date)
    for label in normalized_seat_labels:
        if label in occupied_labels:
            return "seat_booked"

    return None


def _seat_status(
    label: str,
    is_active: bool,
    is_blocked: bool,
    own_labels: set[str],
    occupied_labels: dict[str, str],
) -> str:
    if is_active and is_blocked:
        return "blocked"
    if is_active and label in own_labels:
        return "mine"
    if is_active and label in occupied_labels:
        return occupied_labels[label]
    if is_active:
        return "available"
    return "disabled"


def _find_own_booking_labels(db, booking_id: int | None, user_id: int | None) -> set[str]:
    if booking_id is None or user_id is None:
        return set()

    own_booking = db.execute(
        select(Booking).where(
            Booking.booking_id == booking_id,
            Booking.user_id == user_id,
        )
    ).scalar_one_or_none()
    if own_booking is None:
        return set()

    return set(_parse_seat_labels(own_booking.special_requests))


def _build_availability_seats(layout: dict, own_labels: set[str], occupied_labels: dict[str, str]) -> list[dict]:
    seats = []
    for seat in layout["seats"]:
        label = (seat.get("seat_label") or "").upper()
        is_active = bool(seat.get("is_active"))
        is_blocked = bool(seat.get("is_blocked"))
        status = _seat_status(label, is_active, is_blocked, own_labels, occupied_labels)
        seats.append({**seat, "status": status})
    return seats


def _load_schedule_and_bus_for_replace(db, booking: Booking):
    schedule = _find_schedule_for_booking(db, booking)
    if schedule is None:
        return None, None, "schedule"

    bus = db.execute(select(Bus).where(Bus.bus_id == schedule.bus_id)).scalar_one_or_none()
    if bus is None:
        return None, None, "bus"

    return schedule, bus, None


def _validate_new_replacement_labels(db, bus: Bus, booking: Booking, current_labels: list[str], new_labels: list[str]):
    max_seats = _max_seats_per_transaction(bus.total_seats)
    if len(new_labels) > max_seats:
        return None, "seat_limit"

    layout = get_bus_seat_layout(bus.bus_id)
    if layout is None:
        return None, "bus"

    active_labels = {
        seat["seat_label"].upper()
        for seat in layout["seats"]
        if seat.get("is_active")
    }
    blocked_labels = {
        seat["seat_label"].upper()
        for seat in layout["seats"]
        if seat.get("is_active") and seat.get("is_blocked")
    }
    for label in new_labels:
        if label not in active_labels:
            return None, "seat_invalid"
        if label in blocked_labels:
            return None, "seat_blocked"

    occupied_labels = _occupied_seat_statuses(db, bus.bus_id, booking.journey_date)
    own_set = set(current_labels)
    blocked_without_own = {label for label in occupied_labels if label not in own_set}
    for label in new_labels:
        if label in blocked_without_own:
            return None, "seat_booked"

    return max_seats, None


def list_bookings():
    with get_session() as db:
        bookings = db.execute(select(Booking).order_by(Booking.booking_id)).scalars().all()
        return [_to_booking_output(db, booking) for booking in bookings]


def list_bookings_by_user(user_id: int):
    with get_session() as db:
        bookings = db.execute(
            select(Booking)
            .where(Booking.user_id == user_id)
            .order_by(Booking.booking_id.desc())
        ).scalars().all()
        return [_to_booking_output(db, booking) for booking in bookings]


def create_booking(
    user_id: int,
    bus_id: int,
    journey_date: str,
    seats: int,
    seat_labels: list[str] | None = None,
    payment_method: str | None = None,
    is_counter_booking: bool = False,
):
    user, bus, error_key = _validate_booking_user_and_bus(user_id, bus_id)
    if error_key:
        return None, error_key

    _max_seats, error_key = _validate_booking_seat_count(seats, bus)
    if error_key:
        return None, error_key

    parsed_journey_date = _parse_date(journey_date)
    normalized_seat_labels, error_key = _validate_input_seat_labels(seat_labels, seats)
    if error_key:
        return None, error_key

    total_amount = seats * bus["price"]

    with get_session() as db:
        # Schedule bus ko real bridge ho; booking direct bus table ma chaina.
        schedule = _find_schedule_for_bus(db, bus_id)
        if schedule is None:
            return None, "bus"

        error_key = _validate_requested_seat_labels(db, bus_id, parsed_journey_date, normalized_seat_labels)
        if error_key:
            return None, error_key

        user_row = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
        passenger_name = user_row.name if user_row is not None else "Passenger"

        # Total amount seat count * bus price bata nikalincha.
        new_booking = Booking(
            user_id=user_id,
            vendor_id=None,
            schedule_id=schedule.schedule_id,
            booking_reference=_booking_ref(user_id),
            journey_date=parsed_journey_date,
            number_of_seats=seats,
            total_amount=total_amount,
            booking_status="pending",
            payment_status="unpaid",
            payment_method=payment_method,
            is_counter_booking=is_counter_booking,
            passenger_name=passenger_name,
            passenger_phone="N/A",
            passenger_email=user["email"],
            special_requests=_seat_note(normalized_seat_labels),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        return _to_booking_output(db, new_booking), None


def get_seat_availability(
    bus_id: int,
    journey_date: str,
    booking_id: int | None = None,
    user_id: int | None = None,
):
    parsed_journey_date = _parse_date(journey_date)

    with get_session() as db:
        bus = db.execute(select(Bus).where(Bus.bus_id == bus_id)).scalar_one_or_none()
        if bus is None:
            return None, "bus"

        schedule = _find_schedule_for_bus(db, bus_id)
        if schedule is None:
            return None, "schedule"

        route = None
        if schedule.route_id is not None:
            route = db.execute(select(Route).where(Route.route_id == schedule.route_id)).scalar_one_or_none()

        layout = get_bus_seat_layout(bus_id)
        if layout is None:
            return None, "bus"

        occupied_labels = _occupied_seat_statuses(db, bus_id, parsed_journey_date)
        own_labels = _find_own_booking_labels(db, booking_id, user_id)
        if own_labels:
            occupied_labels = {
                label: status
                for label, status in occupied_labels.items()
                if label not in own_labels
            }

        seats = _build_availability_seats(layout, own_labels, occupied_labels)

        max_seats = _max_seats_per_transaction(bus.total_seats)

        return {
            "bus": {
                "bus_id": bus.bus_id,
                "bus_registration_number": bus.bus_number,
                "bus_type": bus.bus_type,
                "vendor_name": f"{bus.bus_type} Operator",
                "vendor_contact": "+977-9800000000",
            },
            "route": {
                "from_city": route.origin if route else "N/A",
                "to_city": route.destination if route else "N/A",
            },
            "schedule": {
                "schedule_id": schedule.schedule_id,
                "departure_time": schedule.departure_time.strftime("%H:%M"),
                "arrival_time": schedule.arrival_time.strftime("%H:%M"),
                "fare": float(schedule.price),
            },
            "journey_date": str(parsed_journey_date),
            "max_selectable_seats": max_seats,
            "seat_layout_rows": layout["seat_layout_rows"],
            "seat_layout_cols": layout["seat_layout_cols"],
            "seats": seats,
        }, None


def get_refund_estimate(
    booking_id: int,
    user_id: int,
    remove_seat_labels: list[str] | None = None,
):
    with get_session() as db:
        booking = db.execute(select(Booking).where(Booking.booking_id == booking_id)).scalar_one_or_none()
        if booking is None:
            return None, "booking"
        if booking.user_id != user_id:
            return None, "forbidden"
        if (booking.booking_status or "").lower() == "cancelled":
            return None, "cancelled"

        current_labels = _parse_seat_labels(booking.special_requests)
        if not current_labels:
            return None, "seat_tracking_unavailable"

        if remove_seat_labels is None:
            to_remove = current_labels
        else:
            to_remove = _normalize_seat_labels(remove_seat_labels)
            if not to_remove:
                return None, "seat_required"
            missing = [label for label in to_remove if label not in set(current_labels)]
            if missing:
                return None, "seat_not_in_booking"

        hours_before, percent, per_seat_amount, _seat_count, _total_amount = _refund_context(db, booking)
        refund = _refund_summary(
            removed_seat_count=len(to_remove),
            per_seat_amount=per_seat_amount,
            refund_percent=percent,
        )
        refund["hours_before_departure"] = round(hours_before, 2)
        refund["booking_id"] = booking.booking_id
        refund["remove_seat_labels"] = to_remove
        return refund, None


def cancel_booking(booking_id: int, user_id: int):
    with get_session() as db:
        booking = db.execute(
            select(Booking).where(Booking.booking_id == booking_id)
        ).scalar_one_or_none()
        if booking is None:
            return None, None, "booking"

        if booking.user_id != user_id:
            return None, None, "forbidden"

        schedule = _find_schedule_for_booking(db, booking)
        hours_before = _hours_before_departure(schedule, booking.journey_date)
        percent = _refund_percent(hours_before)
        seat_count = int(booking.number_of_seats or 0)
        per_seat_amount = float(booking.total_amount or 0) / seat_count if seat_count > 0 else 0.0
        removed_labels = _parse_seat_labels(booking.special_requests)

        if (booking.booking_status or "").lower() == "cancelled":
            refund = _refund_summary(
                removed_seat_count=seat_count,
                per_seat_amount=per_seat_amount,
                refund_percent=percent,
            )
            refund["hours_before_departure"] = round(hours_before, 2)
            return _to_booking_output(db, booking), refund, None

        booking.booking_status = "cancelled"
        booking.payment_status = "refunded" if percent > 0 else "no_refund"
        booking.total_amount = 0
        booking.number_of_seats = 0
        booking.special_requests = None
        booking.updated_at = datetime.now(timezone.utc)

        refund = _refund_summary(
            removed_seat_count=seat_count,
            per_seat_amount=per_seat_amount,
            refund_percent=percent,
        )
        refund["hours_before_departure"] = round(hours_before, 2)

        db.commit()
        db.refresh(booking)
        _send_refund_confirmation_email(
            db,
            booking,
            refund,
            removed_labels,
            "Full booking cancellation",
        )
        return _to_booking_output(db, booking), refund, None


def modify_booking_seats(booking_id: int, user_id: int, remove_seat_labels: list[str]):
    with get_session() as db:
        booking = db.execute(
            select(Booking).where(Booking.booking_id == booking_id)
        ).scalar_one_or_none()
        if booking is None:
            return None, None, "booking"

        if booking.user_id != user_id:
            return None, None, "forbidden"

        if (booking.booking_status or "").lower() == "cancelled":
            return None, None, "cancelled"

        current_labels = _parse_seat_labels(booking.special_requests)
        if not current_labels:
            return None, None, "seat_tracking_unavailable"

        to_remove = _normalize_seat_labels(remove_seat_labels)
        if not to_remove:
            return None, None, "seat_required"

        current_set = set(current_labels)
        missing = [label for label in to_remove if label not in current_set]
        if missing:
            return None, None, "seat_not_in_booking"

        hours_before, percent, per_seat_amount, _seat_count_before, _total_amount = _refund_context(db, booking)

        remaining = [label for label in current_labels if label not in set(to_remove)]
        removed_count = len(to_remove)
        removed_value = round(removed_count * per_seat_amount, 2)

        booking.number_of_seats = len(remaining)
        booking.total_amount = max(0.0, round(float(booking.total_amount or 0) - removed_value, 2))
        booking.special_requests = _seat_note(remaining)
        booking.updated_at = datetime.now(timezone.utc)

        if not remaining:
            booking.booking_status = "cancelled"
            booking.payment_status = "refunded" if percent > 0 else "no_refund"
        else:
            booking.booking_status = "modified"
            if percent > 0:
                booking.payment_status = "partially_refunded"

        refund = _refund_summary(
            removed_seat_count=removed_count,
            per_seat_amount=per_seat_amount,
            refund_percent=percent,
        )
        refund["hours_before_departure"] = round(hours_before, 2)

        db.commit()
        db.refresh(booking)
        _send_refund_confirmation_email(
            db,
            booking,
            refund,
            to_remove,
            "Seat modification refund",
        )
        return _to_booking_output(db, booking), refund, None


def replace_booking_seats(booking_id: int, user_id: int, seat_labels: list[str]):
    with get_session() as db:
        booking = db.execute(select(Booking).where(Booking.booking_id == booking_id)).scalar_one_or_none()
        if booking is None:
            return None, None, "booking"

        if booking.user_id != user_id:
            return None, None, "forbidden"

        if (booking.booking_status or "").lower() == "cancelled":
            return None, None, "cancelled"

        current_labels = _parse_seat_labels(booking.special_requests)
        if not current_labels:
            return None, None, "seat_tracking_unavailable"

        new_labels = _normalize_seat_labels(seat_labels)

        _schedule, bus, error_key = _load_schedule_and_bus_for_replace(db, booking)
        if error_key:
            return None, None, error_key

        max_seats, error_key = _validate_new_replacement_labels(
            db,
            bus,
            booking,
            current_labels,
            new_labels,
        )
        if error_key:
            return None, None, error_key

        new_set = set(new_labels)
        own_set = set(current_labels)
        removed = [label for label in current_labels if label not in new_set]
        added = [label for label in new_labels if label not in own_set]

        hours_before, percent, per_seat_amount, _seat_count_before, _total_amount = _refund_context(db, booking)

        refund = _refund_summary(
            removed_seat_count=len(removed),
            per_seat_amount=per_seat_amount,
            refund_percent=percent,
        )
        refund["hours_before_departure"] = round(hours_before, 2)

        additional_amount = round(len(added) * per_seat_amount, 2)
        net_payable = round(additional_amount - float(refund["refund_amount"]), 2)

        booking.number_of_seats = len(new_labels)
        booking.total_amount = round(len(new_labels) * per_seat_amount, 2)
        booking.special_requests = _seat_note(new_labels)
        booking.updated_at = datetime.now(timezone.utc)

        if len(new_labels) == 0:
            booking.booking_status = "cancelled"
            booking.payment_status = "refunded" if refund["refund_amount"] > 0 else "no_refund"
        else:
            booking.booking_status = "modified"
            if net_payable > 0:
                booking.payment_status = "pending_additional_payment"
            elif refund["refund_amount"] > 0:
                booking.payment_status = "partially_refunded"

        settlement = {
            "removed_seat_labels": removed,
            "added_seat_labels": added,
            "refund": refund,
            "additional_amount": additional_amount,
            "net_payable": net_payable,
            "max_selectable_seats": max_seats,
        }

        db.commit()
        db.refresh(booking)
        _send_refund_confirmation_email(
            db,
            booking,
            refund,
            removed,
            "Seat replacement settlement",
        )
        return _to_booking_output(db, booking), settlement, None


def _send_booking_confirmation_email(db, booking: Booking) -> None:
    """Send formatted ticket confirmation email to passenger."""
    schedule = _find_schedule_for_booking(db, booking)
    if schedule is None or booking.passenger_email is None:
        return

    bus = db.execute(select(Bus).where(Bus.bus_id == schedule.bus_id)).scalar_one_or_none()
    route = db.execute(select(Route).where(Route.route_id == schedule.route_id)).scalar_one_or_none()

    if bus is None or route is None:
        return

    seat_labels = _parse_seat_labels(booking.special_requests)
    bus_name = bus.bus_number if hasattr(bus, 'bus_number') else "Bus"
    route_str = f"{route.origin} - {route.destination}" if hasattr(route, 'origin') else "Route"

    email_html = format_ticket_email(
        passenger_name=booking.passenger_name or "Passenger",
        booking_reference=booking.booking_reference,
        journey_date=str(booking.journey_date),
        departure_time=schedule.departure_time.strftime("%H:%M"),
        arrival_time=schedule.arrival_time.strftime("%H:%M"),
        bus_name=bus_name,
        route=route_str,
        seats=seat_labels,
        total_amount=float(booking.total_amount or 0),
        passenger_email=booking.passenger_email,
    )

    ticket_pdf = generate_ticket_pdf(
        passenger_name=booking.passenger_name or "Passenger",
        booking_reference=booking.booking_reference,
        journey_date=str(booking.journey_date),
        departure_time=schedule.departure_time.strftime("%H:%M"),
        arrival_time=schedule.arrival_time.strftime("%H:%M"),
        bus_name=bus_name,
        route=route_str,
        seats=seat_labels,
        total_amount=float(booking.total_amount or 0),
        passenger_email=booking.passenger_email,
    )

    send_email(
        recipient=booking.passenger_email,
        subject=f"Ticket Confirmation - {booking.booking_reference}",
        html_content=email_html,
        attachments=[(f"ticket_{booking.booking_reference}.pdf", ticket_pdf, "pdf")],
    )


def _send_refund_confirmation_email(
    db,
    booking: Booking,
    refund: dict,
    refunded_seat_labels: list[str],
    refund_reason: str,
) -> None:
    """Send refund confirmation email with attached refund receipt PDF."""
    refund_amount = float(refund.get("refund_amount") or 0)
    if refund_amount <= 0 or not booking.passenger_email:
        return

    schedule = _find_schedule_for_booking(db, booking)
    if schedule is None:
        return

    bus = db.execute(select(Bus).where(Bus.bus_id == schedule.bus_id)).scalar_one_or_none()
    route = db.execute(select(Route).where(Route.route_id == schedule.route_id)).scalar_one_or_none()
    if bus is None or route is None:
        return

    bus_name = bus.bus_number if hasattr(bus, "bus_number") else "Bus"
    route_str = f"{route.origin} - {route.destination}" if hasattr(route, "origin") else "Route"

    refund_html = format_refund_email(
        passenger_name=booking.passenger_name or "Passenger",
        booking_reference=booking.booking_reference,
        refund_amount=refund_amount,
        refund_percent=int(refund.get("refund_percent") or 0),
        refunded_seats=refunded_seat_labels,
        refund_reason=refund_reason,
    )
    refund_pdf = generate_refund_receipt_pdf(
        passenger_name=booking.passenger_name or "Passenger",
        booking_reference=booking.booking_reference,
        journey_date=str(booking.journey_date),
        bus_name=bus_name,
        route=route_str,
        refunded_seats=refunded_seat_labels,
        refund_amount=refund_amount,
        refund_percent=int(refund.get("refund_percent") or 0),
        refund_reason=refund_reason,
        passenger_email=booking.passenger_email,
    )

    send_email(
        recipient=booking.passenger_email,
        subject=f"Refund Receipt - {booking.booking_reference}",
        html_content=refund_html,
        attachments=[(f"refund_{booking.booking_reference}.pdf", refund_pdf, "pdf")],
    )


def confirm_booking_payment(
    booking_id: int,
    user_id: int,
    payment_method: str,
    pay_later: bool = False,
):
    with get_session() as db:
        booking = db.execute(select(Booking).where(Booking.booking_id == booking_id)).scalar_one_or_none()
        if booking is None:
            return None, "booking"

        if booking.user_id != user_id:
            return None, "forbidden"

        user = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
        role = (user.role if user and user.role else "customer").lower()

        if pay_later and role not in {"vendor", "admin"}:
            return None, "pay_later_forbidden"

        booking.payment_method = payment_method.strip().lower()
        booking.payment_status = "pay_later" if pay_later else "paid"
        booking.booking_status = "confirmed"
        booking.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(booking)

        _send_booking_confirmation_email(db, booking)

        return _to_booking_output(db, booking), None


def get_booking_ticket_pdf(booking_id: int, user_id: int) -> tuple[bytes | None, str | None]:
    """Generate ticket PDF for booking. Returns (pdf_bytes, error_key)."""
    with get_session() as db:
        booking = db.execute(
            select(Booking).where(Booking.booking_id == booking_id)
        ).scalar_one_or_none()
        if booking is None:
            return None, "booking"

        if booking.user_id != user_id:
            return None, "forbidden"

        schedule = _find_schedule_for_booking(db, booking)
        if schedule is None:
            return None, "schedule"

        bus = db.execute(select(Bus).where(Bus.bus_id == schedule.bus_id)).scalar_one_or_none()
        route = db.execute(select(Route).where(Route.route_id == schedule.route_id)).scalar_one_or_none()

        if bus is None or route is None:
            return None, "bus"

        seat_labels = _parse_seat_labels(booking.special_requests)
        bus_name = bus.bus_number if hasattr(bus, 'bus_number') else "Bus"
        route_str = f"{route.origin} - {route.destination}" if hasattr(route, 'origin') else "Route"

        pdf_bytes = generate_ticket_pdf(
            passenger_name=booking.passenger_name or "Passenger",
            booking_reference=booking.booking_reference,
            journey_date=str(booking.journey_date),
            departure_time=schedule.departure_time.strftime("%H:%M"),
            arrival_time=schedule.arrival_time.strftime("%H:%M"),
            bus_name=bus_name,
            route=route_str,
            seats=seat_labels,
            total_amount=float(booking.total_amount or 0),
            passenger_email=booking.passenger_email or "N/A",
        )

        return pdf_bytes, None
