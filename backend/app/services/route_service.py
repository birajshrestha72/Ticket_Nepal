from sqlalchemy import select

from app.config.database import get_session
from app.model.models import Route


def _to_route_output(route: Route) -> dict:
    return {
        "route_id": route.route_id,
        "from_city": route.origin,
        "to_city": route.destination,
        "distance_km": float(route.distance_km),
        "is_active": bool(route.is_active),
    }


def _estimate_duration_minutes(distance_km: float) -> int:
    if distance_km <= 0:
        return 0
    return int(distance_km * 3)


def list_routes():
    with get_session() as db:
        routes = db.execute(
            select(Route).where(Route.is_active.is_(True)).order_by(Route.route_id)
        ).scalars().all()
        return [_to_route_output(route) for route in routes]


def list_all_routes():
    with get_session() as db:
        routes = db.execute(
            select(Route).order_by(Route.route_id)
        ).scalars().all()
        return [_to_route_output(route) for route in routes]


def find_route(route_id: int):
    with get_session() as db:
        route = db.execute(select(Route).where(Route.route_id == route_id)).scalar_one_or_none()
        if route is None:
            return None
        return _to_route_output(route)


def create_route(from_city: str, to_city: str, distance_km: float):
    with get_session() as db:
        route = Route(
            origin=from_city,
            destination=to_city,
            distance_km=distance_km,
            estimated_duration_minutes=_estimate_duration_minutes(distance_km),
            base_price=0,
            is_active=True,
        )
        db.add(route)
        db.commit()
        db.refresh(route)
        return _to_route_output(route)


def update_route(route_id: int, from_city: str, to_city: str, distance_km: float):
    with get_session() as db:
        route = db.execute(select(Route).where(Route.route_id == route_id)).scalar_one_or_none()
        if route is None:
            return None

        route.origin = from_city
        route.destination = to_city
        route.distance_km = distance_km
        route.estimated_duration_minutes = _estimate_duration_minutes(distance_km)
        db.commit()
        db.refresh(route)
        return _to_route_output(route)


def set_route_status(route_id: int, is_active: bool):
    with get_session() as db:
        route = db.execute(select(Route).where(Route.route_id == route_id)).scalar_one_or_none()
        if route is None:
            return None
        route.is_active = is_active
        db.commit()
        db.refresh(route)
        return _to_route_output(route)


def delete_route(route_id: int):
    with get_session() as db:
        route = db.execute(select(Route).where(Route.route_id == route_id)).scalar_one_or_none()
        if route is None:
            return False
        route.is_active = False
        db.commit()
        return True
