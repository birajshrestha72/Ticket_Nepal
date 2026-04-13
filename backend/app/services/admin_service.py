from sqlalchemy import select

from app.config.database import get_session
from app.model.models import Booking, Bus, BusSchedule, Review, Route
from app.services.booking_service import list_bookings
from app.services.bus_service import find_bus, list_buses
from app.services.route_service import list_routes
from app.services.schedule_service import list_schedules
from app.services.user_service import find_user


def list_admin_bookings():
    bookings = list_bookings()
    result = []
    for booking in bookings:
        user = find_user(booking["user_id"])
        bus = find_bus(booking["bus_id"])
        result.append(
            {
                **booking,
                "user_name": user["name"] if user else "Unknown",
                "bus_name": bus["bus_name"] if bus else "Unknown",
            }
        )
    return result


def get_admin_analytics():
    bookings = list_bookings()
    all_buses = list_buses()
    all_routes = list_routes()
    all_schedules = list_schedules()

    active_buses = [bus for bus in all_buses if bus.get("is_active", True)]
    active_routes = [route for route in all_routes if route.get("is_active", True)]
    active_schedules = [s for s in all_schedules if s.get("is_active", True)]

    total_bookings = len(bookings)
    total_revenue = sum(item.get("total_amount", 0) for item in bookings)
    booked_seats = sum(item.get("seats", 0) for item in bookings)
    total_capacity = sum(bus.get("seat_capacity", 0) for bus in active_buses)
    occupancy_rate = 0.0
    if total_capacity > 0:
        occupancy_rate = round((booked_seats / total_capacity) * 100, 2)

    return {
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "booked_seats": booked_seats,
        "occupancy_rate": occupancy_rate,
        "active_buses": len(active_buses),
        "active_routes": len(active_routes),
        "active_schedules": len(active_schedules),
        "total_buses": len(all_buses),
        "total_routes": len(all_routes),
        "total_schedules": len(all_schedules),
    }


def _load_review_context_maps(db, reviews: list[Review]):
    booking_ids = {item.booking_id for item in reviews if item.booking_id is not None}
    bus_ids = {item.bus_id for item in reviews if item.bus_id is not None}

    bookings: dict[int, Booking] = {}
    schedules: dict[int, BusSchedule] = {}
    routes: dict[int, Route] = {}
    buses: dict[int, Bus] = {}

    if booking_ids:
        booking_rows = db.execute(select(Booking).where(Booking.booking_id.in_(booking_ids))).scalars().all()
        bookings = {item.booking_id: item for item in booking_rows}

        schedule_ids = {item.schedule_id for item in booking_rows if item.schedule_id is not None}
        if schedule_ids:
            schedule_rows = db.execute(select(BusSchedule).where(BusSchedule.schedule_id.in_(schedule_ids))).scalars().all()
            schedules = {item.schedule_id: item for item in schedule_rows}

            route_ids = {item.route_id for item in schedule_rows if item.route_id is not None}
            if route_ids:
                route_rows = db.execute(select(Route).where(Route.route_id.in_(route_ids))).scalars().all()
                routes = {item.route_id: item for item in route_rows}

    if bus_ids:
        bus_rows = db.execute(select(Bus).where(Bus.bus_id.in_(bus_ids))).scalars().all()
        buses = {item.bus_id: item for item in bus_rows}

    return bookings, schedules, routes, buses


def _to_admin_review_output(item: Review, booking: Booking | None, bus: Bus | None, route: Route | None) -> dict:
    route_name = f"{route.origin} -> {route.destination}" if route is not None else "Unknown Ride"
    return {
        "review_id": item.review_id,
        "rating": item.rating,
        "review_text": item.review_text or "",
        "is_approved": bool(item.is_approved),
        "is_verified_purchase": bool(item.is_verified_purchase),
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "ride": {
            "booking_id": booking.booking_id if booking else None,
            "booking_reference": booking.booking_reference if booking else None,
            "journey_date": booking.journey_date.isoformat() if booking and booking.journey_date else None,
            "bus_name": bus.bus_number if bus else None,
            "route": route_name,
        },
    }


def list_admin_reviews():
    with get_session() as db:
        reviews = db.execute(select(Review).order_by(Review.created_at.desc(), Review.review_id.desc())).scalars().all()

        bookings, schedules, routes, buses = _load_review_context_maps(db, reviews)

        result = []
        for item in reviews:
            booking = bookings.get(item.booking_id)
            schedule = schedules.get(booking.schedule_id) if booking and booking.schedule_id else None
            route = routes.get(schedule.route_id) if schedule and schedule.route_id else None
            bus = buses.get(item.bus_id) if item.bus_id else None
            result.append(_to_admin_review_output(item, booking, bus, route))

        return result
