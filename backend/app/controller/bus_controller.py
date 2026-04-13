from fastapi import APIRouter

from app.api.response import API
from app.model.schemas import CreateBusInput
from app.services.bus_service import create_bus as create_bus_record
from app.services.bus_service import list_buses as list_bus_records
from app.services.bus_service import list_search_locations as list_search_location_records

router = APIRouter()


@router.get(
    "",
    summary="List active buses",
    description="Return active buses with route and fare context for booking search.",
)
def list_buses():
    """List available buses for customer search."""
    return list_bus_records()


@router.get(
    "/locations",
    summary="List searchable locations",
    description="Return origin/destination city combinations used in booking search form.",
)
def list_search_locations():
    """Get route location pairs for search dropdowns."""
    return API.success_with_data(
        "Search locations loaded",
        "locations",
        list_search_location_records(),
    )


@router.post(
    "",
    summary="Create bus (basic)",
    description="Create bus with route and base price using simplified payload.",
)
def create_bus(payload: CreateBusInput):
    """Create a bus.

    Example request body:
    {
      "bus_name": "Greenline Express",
      "from_city": "Kathmandu",
      "to_city": "Pokhara",
      "price": 1200
    }
    """
    new_bus = create_bus_record(
        bus_name=payload.bus_name,
        from_city=payload.from_city,
        to_city=payload.to_city,
        price=payload.price,
    )
    return API.success_with_data("Bus added", "bus", new_bus)
