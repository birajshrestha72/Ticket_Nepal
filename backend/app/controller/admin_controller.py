from fastapi import APIRouter, HTTPException

from app.api.response import API
from app.model.schemas import (
    AdminCreateBusInput,
    AdminCreateRouteInput,
    AdminSeatLayoutInput,
    AdminCreateScheduleInput,
    AdminUpdateBusInput,
    AdminUpdateRouteInput,
    AdminUpdateScheduleInput,
    StatusInput,
)
from app.services.admin_service import (
    get_admin_analytics,
    list_admin_bookings,
    list_admin_reviews,
)
from app.services.bus_service import (
    create_bus_admin,
    delete_bus,
    get_bus_seat_layout,
    list_buses,
    save_bus_seat_layout,
    set_bus_status,
    update_bus,
)
from app.services.route_service import (
    create_route,
    delete_route,
    list_routes,
    set_route_status,
    update_route,
)
from app.services.schedule_service import (
    create_schedule,
    delete_schedule,
    list_schedules,
    set_schedule_status,
    update_schedule,
)

NOT_FOUND_BUS = "Bus not found"
NOT_FOUND_ROUTE = "Route not found"
NOT_FOUND_SCHEDULE = "Schedule not found"

router = APIRouter(
    responses={
        400: {"description": "Bad request"},
        404: {"description": "Resource not found"},
    }
)


@router.get("/bookings", summary="List admin bookings", description="Return all bookings visible to admin dashboard.")
def admin_list_bookings():
    return API.success_with_data(
        "Bookings loaded",
        "bookings",
        list_admin_bookings(),
    )


@router.get("/analytics", summary="Get admin analytics", description="Return aggregated booking, route, and review analytics for admin dashboard.")
def admin_analytics():
    return API.success_with_data(
        "Analytics loaded",
        "analytics",
        get_admin_analytics(),
    )


@router.get("/reviews", summary="List admin reviews", description="Return reviews for moderation and quality monitoring.")
def admin_list_reviews():
    return API.success_with_data(
        "Reviews loaded",
        "reviews",
        list_admin_reviews(),
    )


@router.get("/buses", summary="List buses", description="Return buses with current route and status for admin management.")
def admin_list_buses():
    return API.success_with_data("Buses loaded", "buses", list_buses())


@router.post("/buses", summary="Create bus", description="Create bus, base schedule, and initial seat layout.")
def admin_create_bus(payload: AdminCreateBusInput):
    bus = create_bus_admin(
        bus_name=payload.bus_name,
        bus_type=payload.bus_type,
        from_city=payload.from_city,
        to_city=payload.to_city,
        price=payload.price,
        seat_capacity=payload.seat_capacity,
    )
    return API.success_with_data("Bus created", "bus", bus)


@router.put(
    "/buses/{bus_id}",
    summary="Update bus",
    description="Update bus metadata, route relation, fare and seat capacity.",
    responses={404: {"description": "Bus not found"}},
)
def admin_update_bus(bus_id: int, payload: AdminUpdateBusInput):
    bus = update_bus(
        bus_id=bus_id,
        bus_name=payload.bus_name,
        bus_type=payload.bus_type,
        from_city=payload.from_city,
        to_city=payload.to_city,
        price=payload.price,
        seat_capacity=payload.seat_capacity,
    )
    if bus is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    return API.success_with_data("Bus updated", "bus", bus)


@router.patch(
    "/buses/{bus_id}/status",
    summary="Update bus status",
    description="Activate or deactivate a bus and related schedules.",
    responses={404: {"description": "Bus not found"}},
)
def admin_bus_status(bus_id: int, payload: StatusInput):
    bus = set_bus_status(bus_id, payload.is_active)
    if bus is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    return API.success_with_data("Bus status updated", "bus", bus)


@router.delete(
    "/buses/{bus_id}",
    summary="Delete bus",
    description="Soft-delete/deactivate bus from active operations.",
    responses={404: {"description": "Bus not found"}},
)
def admin_delete_bus(bus_id: int):
    deleted = delete_bus(bus_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    return API.success("Bus deleted")


@router.get(
    "/buses/{bus_id}/seats",
    summary="Get bus seat layout",
    description="Return full seat grid including active/blocked seats and metadata.",
    responses={404: {"description": "Bus not found"}},
)
def admin_get_bus_seats(bus_id: int):
    seat_layout = get_bus_seat_layout(bus_id)
    if seat_layout is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    return API.success_with_data("Bus seat layout loaded", "seat_layout", seat_layout)


@router.put(
    "/buses/{bus_id}/seats",
    summary="Save bus seat layout",
    description="Persist seat rows/columns and per-cell state such as aisle, blocked, and labels.",
    responses={
        400: {"description": "Invalid seat layout input"},
        404: {"description": "Bus not found"},
    },
)
def admin_save_bus_seats(bus_id: int, payload: AdminSeatLayoutInput):
    try:
        seat_layout = save_bus_seat_layout(
            bus_id=bus_id,
            seat_layout_rows=payload.seat_layout_rows,
            seat_layout_cols=payload.seat_layout_cols,
            seats=[seat.model_dump() for seat in payload.seats] if payload.seats is not None else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if seat_layout is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    return API.success_with_data("Bus seat layout saved", "seat_layout", seat_layout)


@router.get("/routes", summary="List routes", description="Return all routes for admin route management.")
def admin_list_routes():
    return API.success_with_data("Routes loaded", "routes", list_routes())


@router.post("/routes", summary="Create route", description="Create a new route between two cities.")
def admin_create_route(payload: AdminCreateRouteInput):
    route = create_route(payload.from_city, payload.to_city, payload.distance_km)
    return API.success_with_data("Route created", "route", route)


@router.put(
    "/routes/{route_id}",
    summary="Update route",
    description="Update route origin, destination, and distance.",
    responses={404: {"description": "Route not found"}},
)
def admin_update_route(route_id: int, payload: AdminUpdateRouteInput):
    route = update_route(route_id, payload.from_city, payload.to_city, payload.distance_km)
    if route is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_ROUTE)
    return API.success_with_data("Route updated", "route", route)


@router.patch(
    "/routes/{route_id}/status",
    summary="Update route status",
    description="Activate/deactivate route for search and scheduling.",
    responses={404: {"description": "Route not found"}},
)
def admin_route_status(route_id: int, payload: StatusInput):
    route = set_route_status(route_id, payload.is_active)
    if route is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_ROUTE)
    return API.success_with_data("Route status updated", "route", route)


@router.delete(
    "/routes/{route_id}",
    summary="Delete route",
    description="Soft-delete route from admin operations.",
    responses={404: {"description": "Route not found"}},
)
def admin_delete_route(route_id: int):
    deleted = delete_route(route_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=NOT_FOUND_ROUTE)
    return API.success("Route deleted")


@router.get("/schedules", summary="List schedules", description="Return all bus schedules for admin schedule management.")
def admin_list_schedules():
    return API.success_with_data("Schedules loaded", "schedules", list_schedules())


@router.post(
    "/schedules",
    summary="Create schedule",
    description="Create schedule by linking bus, route, departure/arrival and fare.",
    responses={
        404: {"description": "Bus or route not found"},
    },
)
def admin_create_schedule(payload: AdminCreateScheduleInput):
    schedule, error = create_schedule(
        bus_id=payload.bus_id,
        route_id=payload.route_id,
        departure_time=payload.departure_time,
        arrival_time=payload.arrival_time,
        fare=payload.fare,
    )
    if error == "bus":
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    if error == "route":
        raise HTTPException(status_code=404, detail=NOT_FOUND_ROUTE)
    return API.success_with_data("Schedule created", "schedule", schedule)


@router.put(
    "/schedules/{schedule_id}",
    summary="Update schedule",
    description="Update schedule details and linked bus/route.",
    responses={
        404: {"description": "Schedule, bus, or route not found"},
    },
)
def admin_update_schedule(schedule_id: int, payload: AdminUpdateScheduleInput):
    schedule, error = update_schedule(
        schedule_id=schedule_id,
        bus_id=payload.bus_id,
        route_id=payload.route_id,
        departure_time=payload.departure_time,
        arrival_time=payload.arrival_time,
        fare=payload.fare,
    )
    if error == "schedule":
        raise HTTPException(status_code=404, detail=NOT_FOUND_SCHEDULE)
    if error == "bus":
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    if error == "route":
        raise HTTPException(status_code=404, detail=NOT_FOUND_ROUTE)
    return API.success_with_data("Schedule updated", "schedule", schedule)


@router.patch(
    "/schedules/{schedule_id}/status",
    summary="Update schedule status",
    description="Activate/deactivate one schedule.",
    responses={404: {"description": "Schedule not found"}},
)
def admin_schedule_status(schedule_id: int, payload: StatusInput):
    schedule = set_schedule_status(schedule_id, payload.is_active)
    if schedule is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_SCHEDULE)
    return API.success_with_data("Schedule status updated", "schedule", schedule)


@router.delete(
    "/schedules/{schedule_id}",
    summary="Delete schedule",
    description="Remove schedule from active operations.",
    responses={404: {"description": "Schedule not found"}},
)
def admin_delete_schedule(schedule_id: int):
    deleted = delete_schedule(schedule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=NOT_FOUND_SCHEDULE)
    return API.success("Schedule deleted")
