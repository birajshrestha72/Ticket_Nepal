from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.config.database import get_session
from app.model.models import Booking, Bus, BusSchedule, Review, Route


def _review_output(
    review: Review,
    booking: Booking | None,
    bus: Bus | None,
    route: Route | None,
) -> dict:
    route_name = "Unknown Ride"
    if route is not None:
        route_name = f"{route.origin} -> {route.destination}"

    return {
        "review_id": review.review_id,
        "booking_id": review.booking_id,
        "user_id": review.user_id,
        "rating": review.rating,
        "review_text": review.review_text or "",
        "is_verified_purchase": bool(review.is_verified_purchase),
        "is_approved": bool(review.is_approved),
        "created_at": review.created_at.isoformat() if review.created_at else None,
        "ride": {
            "booking_reference": booking.booking_reference if booking else None,
            "journey_date": booking.journey_date.isoformat() if booking and booking.journey_date else None,
            "bus_name": bus.bus_number if bus else None,
            "route": route_name,
        },
    }


def list_reviews_by_user(user_id: int):
    with get_session() as db:
        reviews = db.execute(
            select(Review)
            .where(Review.user_id == user_id)
            .order_by(Review.created_at.desc(), Review.review_id.desc())
        ).scalars().all()

        results = []
        for review in reviews:
            booking = None
            schedule = None
            bus = None
            route = None

            if review.booking_id is not None:
                booking = db.execute(
                    select(Booking).where(Booking.booking_id == review.booking_id)
                ).scalar_one_or_none()

            if booking is not None and booking.schedule_id is not None:
                schedule = db.execute(
                    select(BusSchedule).where(BusSchedule.schedule_id == booking.schedule_id)
                ).scalar_one_or_none()

            if review.bus_id is not None:
                bus = db.execute(select(Bus).where(Bus.bus_id == review.bus_id)).scalar_one_or_none()
            elif schedule is not None and schedule.bus_id is not None:
                bus = db.execute(select(Bus).where(Bus.bus_id == schedule.bus_id)).scalar_one_or_none()

            if schedule is not None and schedule.route_id is not None:
                route = db.execute(select(Route).where(Route.route_id == schedule.route_id)).scalar_one_or_none()

            results.append(_review_output(review, booking, bus, route))

        return results


def create_review(user_id: int, booking_id: int, rating: int, review_text: str | None):
    with get_session() as db:
        booking = db.execute(
            select(Booking).where(Booking.booking_id == booking_id)
        ).scalar_one_or_none()
        if booking is None:
            return None, "booking"

        if booking.user_id != user_id:
            return None, "forbidden"

        existing = db.execute(
            select(Review).where(Review.booking_id == booking_id, Review.user_id == user_id)
        ).scalar_one_or_none()
        if existing is not None:
            return None, "duplicate"

        schedule = None
        route = None
        bus = None
        bus_id = None

        if booking.schedule_id is not None:
            schedule = db.execute(
                select(BusSchedule).where(BusSchedule.schedule_id == booking.schedule_id)
            ).scalar_one_or_none()

        if schedule is not None:
            bus_id = schedule.bus_id
            if schedule.route_id is not None:
                route = db.execute(select(Route).where(Route.route_id == schedule.route_id)).scalar_one_or_none()

        journey_start = datetime.combine(
            booking.journey_date,
            schedule.departure_time if schedule is not None else datetime.min.time(),
        )
        eligible_at = journey_start + timedelta(hours=24)
        if datetime.now() < eligible_at:
            return None, "too_early"

        if bus_id is not None:
            bus = db.execute(select(Bus).where(Bus.bus_id == bus_id)).scalar_one_or_none()

        new_review = Review(
            booking_id=booking_id,
            user_id=user_id,
            vendor_id=booking.vendor_id,
            bus_id=bus_id,
            rating=rating,
            review_text=(review_text or "").strip() or None,
            is_verified_purchase=True,
            is_approved=True,
            approved_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(new_review)
        db.commit()
        db.refresh(new_review)

        return _review_output(new_review, booking, bus, route), None
