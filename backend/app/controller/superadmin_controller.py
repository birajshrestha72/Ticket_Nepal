from fastapi import APIRouter, HTTPException

from app.api.response import API
from app.model.schemas import (
    AdminCreateBusInput,
    AdminCreateRouteInput,
    AdminCreateScheduleInput,
    AdminUpdateBusInput,
    AdminUpdateRouteInput,
    AdminUpdateScheduleInput,
    StatusInput,
    SuperAdminCreateVendorInput,
    SuperAdminUpdateVendorInput,
)
from app.services.bus_service import (
    create_bus_admin,
    delete_bus,
    list_all_buses,
    set_bus_status,
    update_bus,
)
from app.services.route_service import (
    create_route,
    delete_route,
    list_all_routes,
    set_route_status,
    update_route,
)
from app.services.schedule_service import (
    create_schedule,
    delete_schedule,
    list_all_schedules,
    set_schedule_status,
    update_schedule,
)
from app.services.superadmin_service import (
    create_vendor,
    delete_vendor,
    get_superadmin_analytics,
    list_vendors,
    update_vendor,
    verify_vendor,
)

NOT_FOUND_VENDOR = "Vendor not found"
NOT_FOUND_BUS = "Bus not found"
NOT_FOUND_ROUTE = "Route not found"
NOT_FOUND_SCHEDULE = "Schedule not found"

router = APIRouter(
    responses={
        400: {"description": "Bad request"},
        404: {"description": "Resource not found"},
    }
)


@router.get("/analytics", summary="Get superadmin analytics", description="Return global analytics for vendors, buses, bookings, and routes.")
def superadmin_analytics():
    return API.success_with_data("Superadmin analytics loaded", "analytics", get_superadmin_analytics())


@router.get("/vendors", summary="List vendors", description="Return vendor accounts with verification and activation state.")
def superadmin_list_vendors():
    return API.success_with_data("Vendors loaded", "vendors", list_vendors())


@router.post(
    "/vendors",
    summary="Create vendor",
    description="Create vendor account directly from superadmin panel.",
    responses={400: {"description": "Email already used"}},
)
def superadmin_create_vendor(payload: SuperAdminCreateVendorInput):
    vendor = create_vendor(payload.name, payload.email, payload.password)
    if vendor is None:
        raise HTTPException(status_code=400, detail="Email already used")
    return API.success_with_data("Vendor created (pending verification)", "vendor", vendor)


@router.put(
    "/vendors/{vendor_id}",
    summary="Update vendor",
    description="Update vendor profile fields and activation status.",
    responses={
        400: {"description": "Email already used"},
        404: {"description": "Vendor not found"},
    },
)
def superadmin_update_vendor(vendor_id: int, payload: SuperAdminUpdateVendorInput):
    vendor, error_key = update_vendor(
        vendor_id=vendor_id,
        name=payload.name,
        email=payload.email,
        is_active=payload.is_active,
    )
    if error_key == "vendor":
        raise HTTPException(status_code=404, detail=NOT_FOUND_VENDOR)
    if error_key == "email":
        raise HTTPException(status_code=400, detail="Email already used")
    return API.success_with_data("Vendor updated", "vendor", vendor)


@router.patch(
    "/vendors/{vendor_id}/verify",
    summary="Verify vendor",
    description="Approve or reject vendor verification state, with document prerequisite checks.",
    responses={
        400: {"description": "Verification prerequisites not met"},
        404: {"description": "Vendor not found"},
    },
)
def superadmin_verify_vendor(vendor_id: int, payload: StatusInput):
    vendor, error_key = verify_vendor(vendor_id, payload.is_active)
    if error_key == "vendor":
        raise HTTPException(status_code=404, detail=NOT_FOUND_VENDOR)
    if error_key == "document":
        raise HTTPException(
            status_code=400,
            detail="Vendor cannot be verified before uploading company registration document",
        )
    return API.success_with_data("Vendor verification updated", "vendor", vendor)


@router.delete(
    "/vendors/{vendor_id}",
    summary="Delete vendor",
    description="Deactivate vendor account.",
    responses={404: {"description": "Vendor not found"}},
)
def superadmin_delete_vendor(vendor_id: int):
    deleted = delete_vendor(vendor_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=NOT_FOUND_VENDOR)
    return API.success("Vendor deactivated")


@router.get("/buses", summary="List buses", description="Return all buses for global management.")
def superadmin_list_buses():
    return API.success_with_data("Buses loaded", "buses", list_all_buses())


@router.post("/buses", summary="Create bus", description="Create a bus with route, fare, and seat defaults.")
def superadmin_create_bus(payload: AdminCreateBusInput):
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
    description="Update bus properties and seat capacity.",
    responses={404: {"description": "Bus not found"}},
)
def superadmin_update_bus(bus_id: int, payload: AdminUpdateBusInput):
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
    description="Activate/deactivate bus and linked schedule state.",
    responses={404: {"description": "Bus not found"}},
)
def superadmin_bus_status(bus_id: int, payload: StatusInput):
    bus = set_bus_status(bus_id, payload.is_active)
    if bus is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    return API.success_with_data("Bus status updated", "bus", bus)


@router.delete(
    "/buses/{bus_id}",
    summary="Delete bus",
    description="Deactivate bus from operations.",
    responses={404: {"description": "Bus not found"}},
)
def superadmin_delete_bus(bus_id: int):
    deleted = delete_bus(bus_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=NOT_FOUND_BUS)
    return API.success("Bus deleted")


@router.get("/routes", summary="List routes", description="Return all routes for global route governance.")
def superadmin_list_routes():
    return API.success_with_data("Routes loaded", "routes", list_all_routes())


@router.post("/routes", summary="Create route", description="Create a route from origin to destination city.")
def superadmin_create_route(payload: AdminCreateRouteInput):
    route = create_route(payload.from_city, payload.to_city, payload.distance_km)
    return API.success_with_data("Route created", "route", route)


@router.put(
    "/routes/{route_id}",
    summary="Update route",
    description="Update route cities and distance.",
    responses={404: {"description": "Route not found"}},
)
def superadmin_update_route(route_id: int, payload: AdminUpdateRouteInput):
    route = update_route(route_id, payload.from_city, payload.to_city, payload.distance_km)
    if route is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_ROUTE)
    return API.success_with_data("Route updated", "route", route)


@router.patch(
    "/routes/{route_id}/status",
    summary="Update route status",
    description="Enable or disable a route.",
    responses={404: {"description": "Route not found"}},
)
def superadmin_route_status(route_id: int, payload: StatusInput):
    route = set_route_status(route_id, payload.is_active)
    if route is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_ROUTE)
    return API.success_with_data("Route status updated", "route", route)


@router.delete(
    "/routes/{route_id}",
    summary="Delete route",
    description="Deactivate route from the system.",
    responses={404: {"description": "Route not found"}},
)
def superadmin_delete_route(route_id: int):
    deleted = delete_route(route_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=NOT_FOUND_ROUTE)
    return API.success("Route deleted")


@router.get("/schedules", summary="List schedules", description="Return all schedules across the system.")
def superadmin_list_schedules():
    return API.success_with_data("Schedules loaded", "schedules", list_all_schedules())


@router.post(
    "/schedules",
    summary="Create schedule",
    description="Create schedule by selecting bus, route and timetable.",
    responses={404: {"description": "Bus or route not found"}},
)
def superadmin_create_schedule(payload: AdminCreateScheduleInput):
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
    description="Update schedule metadata including fare and times.",
    responses={404: {"description": "Schedule, bus, or route not found"}},
)
def superadmin_update_schedule(schedule_id: int, payload: AdminUpdateScheduleInput):
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
    description="Activate or deactivate schedule.",
    responses={404: {"description": "Schedule not found"}},
)
def superadmin_schedule_status(schedule_id: int, payload: StatusInput):
    schedule = set_schedule_status(schedule_id, payload.is_active)
    if schedule is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_SCHEDULE)
    return API.success_with_data("Schedule status updated", "schedule", schedule)


@router.delete(
    "/schedules/{schedule_id}",
    summary="Delete schedule",
    description="Deactivate schedule from operations.",
    responses={404: {"description": "Schedule not found"}},
)
def superadmin_delete_schedule(schedule_id: int):
    deleted = delete_schedule(schedule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=NOT_FOUND_SCHEDULE)
    return API.success("Schedule deleted")
