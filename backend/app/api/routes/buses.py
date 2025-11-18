"""
Bus Routes - Bus search, details, and management endpoints
FastAPI router for bus-related operations
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Optional
from datetime import date, datetime

from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundException, BadRequestException
from app.config.database import database


router = APIRouter()


# ===== PUBLIC ENDPOINTS =====

@router.get("/all-types", response_model=Dict)
async def get_all_buses_by_type():
    """
    Get all buses grouped by type
    Returns all buses from database organized by bus_type
    Used by BusDetails.jsx to show complete bus inventory
    """
    query = """
        SELECT 
            b.bus_id,
            b.bus_number,
            b.bus_type,
            b.total_seats,
            b.available_seats,
            b.amenities,
            b.registration_year,
            v.vendor_id,
            v.company_name as vendor_name,
            v.average_rating as vendor_rating,
            r.origin as from_city,
            r.destination as to_city,
            r.distance_km,
            r.estimated_duration_minutes,
            bs.schedule_id,
            bs.departure_time,
            bs.arrival_time,
            bs.price as fare
        FROM buses b
        JOIN vendors v ON b.vendor_id = v.vendor_id
        JOIN bus_schedules bs ON b.bus_id = bs.bus_id
        JOIN routes r ON bs.route_id = r.route_id
        WHERE b.is_active = true AND bs.is_active = true
        ORDER BY b.bus_type, bs.price, bs.departure_time
    """
    
    results = await database.fetch_all(query)
    
    # Group buses by type
    buses_by_type = {}
    for row in results:
        bus_type = row['bus_type']
        bus_type_slug = bus_type.lower().replace('-', '_').replace(' ', '_')
        
        bus_data = {
            "id": row['bus_id'],
            "busNumber": row['bus_number'],
            "busType": row['bus_type'],
            "vendor": row['vendor_name'],
            "vendorId": row['vendor_id'],
            "from": row['from_city'],
            "to": row['to_city'],
            "departureTime": str(row['departure_time'])[:5] if row['departure_time'] else None,
            "arrivalTime": str(row['arrival_time'])[:5] if row['arrival_time'] else None,
            "fare": row['fare'],
            "seats": row['total_seats'],
            "availableSeats": row['available_seats'],
            "amenities": row['amenities'] or [],
            "rating": float(row['vendor_rating']) if row['vendor_rating'] else 4.0,
            "distance": row['distance_km'],
            "duration": row['estimated_duration_minutes'],
            "image": f"/images/buses/{bus_type_slug}.jpg"
        }
        
        if bus_type not in buses_by_type:
            buses_by_type[bus_type] = []
        buses_by_type[bus_type].append(bus_data)
    
    return {
        "status": "success",
        "data": {
            "busesByType": buses_by_type,
            "totalTypes": len(buses_by_type),
            "totalBuses": len(results)
        }
    }


@router.get("/search", response_model=Dict)
async def search_buses(
    origin: Optional[str] = Query(None, description="Origin city"),
    destination: Optional[str] = Query(None, description="Destination city"),
    journey_date: Optional[str] = Query(None, description="Journey date (YYYY-MM-DD)"),
    bus_type: Optional[str] = Query(None, description="Filter by bus type"),
    min_price: Optional[int] = Query(None, description="Minimum fare"),
    max_price: Optional[int] = Query(None, description="Maximum fare"),
    vendor_id: Optional[int] = Query(None, description="Filter by vendor")
):
    """
    Search buses with filters
    Returns grouped bus types with vendor information
    """
    # Build dynamic query
    conditions = ["b.is_active = true", "bs.is_active = true"]
    params = []
    param_count = 1
    
    if origin:
        conditions.append(f"r.origin ILIKE ${param_count}")
        params.append(f"%{origin}%")
        param_count += 1
    
    if destination:
        conditions.append(f"r.destination ILIKE ${param_count}")
        params.append(f"%{destination}%")
        param_count += 1
    
    if bus_type:
        conditions.append(f"b.bus_type = ${param_count}")
        params.append(bus_type)
        param_count += 1
    
    if min_price:
        conditions.append(f"bs.price >= ${param_count}")
        params.append(min_price)
        param_count += 1
    
    if max_price:
        conditions.append(f"bs.price <= ${param_count}")
        params.append(max_price)
        param_count += 1
    
    if vendor_id:
        conditions.append(f"v.vendor_id = ${param_count}")
        params.append(vendor_id)
        param_count += 1
    
    where_clause = " AND ".join(conditions)
    
    # Fetch buses with all related data
    query = f"""
        SELECT 
            b.bus_id,
            b.bus_number,
            b.bus_type,
            b.total_seats,
            b.available_seats,
            b.amenities,
            b.registration_year,
            v.vendor_id,
            v.company_name as vendor_name,
            v.average_rating as vendor_rating,
            r.origin as from_city,
            r.destination as to_city,
            r.distance_km,
            r.estimated_duration_minutes,
            bs.schedule_id,
            bs.departure_time,
            bs.arrival_time,
            bs.price as fare,
            bs.operating_days
        FROM buses b
        JOIN vendors v ON b.vendor_id = v.vendor_id
        JOIN bus_schedules bs ON b.bus_id = bs.bus_id
        JOIN routes r ON bs.route_id = r.route_id
        WHERE {where_clause}
        ORDER BY b.bus_type, bs.price, bs.departure_time
    """
    
    results = await database.fetch_all(query, *params)
    
    # Format results
    buses = []
    for row in results:
        bus_type_slug = row['bus_type'].lower().replace('-', '_').replace(' ', '_')
        buses.append({
            "id": row['bus_id'],
            "busNumber": row['bus_number'],
            "busType": row['bus_type'],
            "vendor": row['vendor_name'],
            "vendorId": row['vendor_id'],
            "from": row['from_city'],
            "to": row['to_city'],
            "departureTime": str(row['departure_time'])[:5] if row['departure_time'] else None,
            "arrivalTime": str(row['arrival_time'])[:5] if row['arrival_time'] else None,
            "fare": row['fare'],
            "seats": row['total_seats'],
            "availableSeats": row['available_seats'],
            "amenities": row['amenities'] or [],
            "rating": float(row['vendor_rating']) if row['vendor_rating'] else 4.0,
            "distance": row['distance_km'],
            "duration": row['estimated_duration_minutes'],
            "operatingDays": row['operating_days'] or [],
            "image": f"/images/buses/{bus_type_slug}.jpg"
        })
    
    return {
        "status": "success",
        "data": {
            "buses": buses,
            "total": len(buses)
        }
    }


@router.get("/type/{bus_type}", response_model=Dict)
async def get_buses_by_type(
    bus_type: str,
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None)
):
    """
    Get all buses of a specific type
    Used by BusDetails.jsx to show all buses of selected type
    """
    # Build query conditions
    conditions = ["b.is_active = true", "bs.is_active = true", "b.bus_type = $1"]
    params = [bus_type]
    param_count = 2
    
    if origin:
        conditions.append(f"r.origin ILIKE ${param_count}")
        params.append(f"%{origin}%")
        param_count += 1
    
    if destination:
        conditions.append(f"r.destination ILIKE ${param_count}")
        params.append(f"%{destination}%")
        param_count += 1
    
    where_clause = " AND ".join(conditions)
    
    query = f"""
        SELECT 
            b.bus_id,
            b.bus_number,
            b.bus_type,
            b.total_seats,
            b.available_seats,
            b.amenities,
            b.registration_year,
            v.vendor_id,
            v.company_name as vendor_name,
            v.average_rating as vendor_rating,
            r.origin as from_city,
            r.destination as to_city,
            r.distance_km,
            r.estimated_duration_minutes,
            bs.schedule_id,
            bs.departure_time,
            bs.arrival_time,
            bs.price as fare
        FROM buses b
        JOIN vendors v ON b.vendor_id = v.vendor_id
        JOIN bus_schedules bs ON b.bus_id = bs.bus_id
        JOIN routes r ON bs.route_id = r.route_id
        WHERE {where_clause}
        ORDER BY bs.price, bs.departure_time
    """
    
    results = await database.fetch_all(query, *params)
    
    if not results:
        raise NotFoundException(f"No {bus_type} buses found")
    
    # Format results
    bus_type_slug = bus_type.lower().replace('-', '_').replace(' ', '_')
    buses = []
    for row in results:
        buses.append({
            "id": row['bus_id'],
            "busNumber": row['bus_number'],
            "busType": row['bus_type'],
            "vendor": row['vendor_name'],
            "vendorId": row['vendor_id'],
            "from": row['from_city'],
            "to": row['to_city'],
            "departureTime": str(row['departure_time'])[:5] if row['departure_time'] else None,
            "arrivalTime": str(row['arrival_time'])[:5] if row['arrival_time'] else None,
            "fare": row['fare'],
            "seats": row['total_seats'],
            "availableSeats": row['available_seats'],
            "amenities": row['amenities'] or [],
            "rating": float(row['vendor_rating']) if row['vendor_rating'] else 4.0,
            "distance": row['distance_km'],
            "duration": row['estimated_duration_minutes'],
            "image": f"/images/buses/{bus_type_slug}.jpg"
        })
    
    return {
        "status": "success",
        "data": {
            "busType": bus_type,
            "buses": buses,
            "total": len(buses)
        }
    }


@router.get("/types", response_model=Dict)
async def get_bus_types():
    """
    Get all unique bus types available
    Returns list of bus types with count
    """
    query = """
        SELECT 
            b.bus_type,
            COUNT(DISTINCT b.bus_id) as bus_count,
            COUNT(DISTINCT v.vendor_id) as vendor_count,
            MIN(bs.price) as min_price,
            MAX(bs.price) as max_price,
            SUM(b.available_seats) as total_available_seats
        FROM buses b
        JOIN vendors v ON b.vendor_id = v.vendor_id
        JOIN bus_schedules bs ON b.bus_id = bs.bus_id
        WHERE b.is_active = true AND bs.is_active = true
        GROUP BY b.bus_type
        ORDER BY b.bus_type
    """
    
    results = await database.fetch_all(query)
    
    bus_types = []
    for row in results:
        bus_type_slug = row['bus_type'].lower().replace('-', '_').replace(' ', '_')
        bus_types.append({
            "busType": row['bus_type'],
            "busCount": row['bus_count'],
            "vendorCount": row['vendor_count'],
            "minPrice": row['min_price'],
            "maxPrice": row['max_price'],
            "availableSeats": row['total_available_seats'],
            "image": f"/images/buses/{bus_type_slug}.jpg"
        })
    
    return {
        "status": "success",
        "data": {
            "busTypes": bus_types,
            "total": len(bus_types)
        }
    }


@router.get("/{bus_id}", response_model=Dict)
async def get_bus_details(bus_id: int):
    """
    Get detailed information about a specific bus
    """
    query = """
        SELECT 
            b.*,
            v.vendor_id,
            v.company_name as vendor_name,
            v.contact_phone as vendor_phone,
            v.average_rating as vendor_rating,
            v.total_reviews as vendor_reviews
        FROM buses b
        JOIN vendors v ON b.vendor_id = v.vendor_id
        WHERE b.bus_id = $1
    """
    
    bus = await database.fetch_one(query, bus_id)
    
    if not bus:
        raise NotFoundException("Bus not found")
    
    # Get schedules for this bus
    schedules_query = """
        SELECT 
            bs.*,
            r.origin,
            r.destination,
            r.distance_km,
            r.estimated_duration_minutes
        FROM bus_schedules bs
        JOIN routes r ON bs.route_id = r.route_id
        WHERE bs.bus_id = $1 AND bs.is_active = true
        ORDER BY bs.departure_time
    """
    
    schedules = await database.fetch_all(schedules_query, bus_id)
    
    bus_type_slug = bus['bus_type'].lower().replace('-', '_').replace(' ', '_')
    
    return {
        "status": "success",
        "data": {
            "bus": {
                "id": bus['bus_id'],
                "busNumber": bus['bus_number'],
                "busType": bus['bus_type'],
                "totalSeats": bus['total_seats'],
                "availableSeats": bus['available_seats'],
                "amenities": bus['amenities'] or [],
                "registrationYear": bus['registration_year'],
                "isActive": bus['is_active'],
                "vendor": {
                    "id": bus['vendor_id'],
                    "name": bus['vendor_name'],
                    "phone": bus['vendor_phone'],
                    "rating": float(bus['vendor_rating']) if bus['vendor_rating'] else 0.0,
                    "reviews": bus['vendor_reviews'] or 0
                },
                "image": f"/images/buses/{bus_type_slug}.jpg",
                "schedules": [
                    {
                        "scheduleId": s['schedule_id'],
                        "origin": s['origin'],
                        "destination": s['destination'],
                        "departureTime": str(s['departure_time'])[:5],
                        "arrivalTime": str(s['arrival_time'])[:5],
                        "price": s['price'],
                        "operatingDays": s['operating_days'] or [],
                        "distance": s['distance_km'],
                        "duration": s['estimated_duration_minutes']
                    }
                    for s in schedules
                ]
            }
        }
    }
