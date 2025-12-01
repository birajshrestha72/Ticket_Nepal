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


# ===== PROTECTED ENDPOINTS (Vendor/Admin) =====

@router.post("/create", response_model=Dict)
async def create_bus(
    bus_data: Dict,
    current_user: Dict = Depends(require_role("vendor", "system_admin"))
):
    """
    Create a new bus
    Vendors can create buses for themselves, admins can create for any vendor
    """
    try:
        # Validate required fields
        required_fields = ['bus_number', 'bus_type', 'total_seats', 'vendor_id']
        for field in required_fields:
            if field not in bus_data:
                raise BadRequestException(f"Missing required field: {field}")
        
        # Check if vendor-owned bus (vendors can only create for themselves)
        if current_user['role'] == 'vendor':
            # Get vendor_id for this user
            vendor_query = "SELECT vendor_id FROM vendors WHERE user_id = $1"
            vendor_result = await database.fetch_one(vendor_query, current_user['id'])
            if not vendor_result:
                raise BadRequestException("Vendor profile not found")
            if bus_data['vendor_id'] != vendor_result['vendor_id']:
                raise BadRequestException("You can only create buses for your own company")
        
        # Check if bus number already exists
        check_query = "SELECT bus_id FROM buses WHERE bus_number = $1"
        existing = await database.fetch_one(check_query, bus_data['bus_number'])
        if existing:
            raise BadRequestException(f"Bus number {bus_data['bus_number']} already exists")
        
        # Insert bus
        insert_query = """
            INSERT INTO buses (
                vendor_id, bus_number, bus_type, total_seats, available_seats,
                amenities, registration_year, insurance_expiry, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        """
        
        bus = await database.fetch_one(
            insert_query,
            bus_data['vendor_id'],
            bus_data['bus_number'],
            bus_data['bus_type'],
            bus_data['total_seats'],
            bus_data.get('available_seats', bus_data['total_seats']),
            bus_data.get('amenities', []),
            bus_data.get('registration_year'),
            bus_data.get('insurance_expiry'),
            bus_data.get('is_active', True)
        )
        
        return {
            "status": "success",
            "message": "Bus created successfully",
            "data": {"bus": dict(bus)}
        }
        
    except BadRequestException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bus: {str(e)}")


@router.put("/{bus_id}", response_model=Dict)
async def update_bus(
    bus_id: int,
    bus_data: Dict,
    current_user: Dict = Depends(require_role("vendor", "system_admin"))
):
    """
    Update an existing bus
    Vendors can only update their own buses
    """
    try:
        # Check if bus exists
        check_query = "SELECT * FROM buses WHERE bus_id = $1"
        existing_bus = await database.fetch_one(check_query, bus_id)
        if not existing_bus:
            raise NotFoundException("Bus not found")
        
        # Check ownership for vendors
        if current_user['role'] == 'vendor':
            vendor_query = "SELECT vendor_id FROM vendors WHERE user_id = $1"
            vendor_result = await database.fetch_one(vendor_query, current_user['id'])
            if not vendor_result or vendor_result['vendor_id'] != existing_bus['vendor_id']:
                raise BadRequestException("You can only update your own buses")
        
        # Build update query dynamically
        update_fields = []
        params = []
        param_count = 1
        
        allowed_fields = ['bus_number', 'bus_type', 'total_seats', 'available_seats', 
                         'amenities', 'registration_year', 'insurance_expiry', 'is_active']
        
        for field in allowed_fields:
            if field in bus_data:
                update_fields.append(f"{field} = ${param_count}")
                params.append(bus_data[field])
                param_count += 1
        
        if not update_fields:
            raise BadRequestException("No fields to update")
        
        # Add updated_at
        update_fields.append(f"updated_at = ${param_count}")
        params.append(datetime.now())
        param_count += 1
        
        # Add bus_id for WHERE clause
        params.append(bus_id)
        
        update_query = f"""
            UPDATE buses
            SET {', '.join(update_fields)}
            WHERE bus_id = ${param_count}
            RETURNING *
        """
        
        bus = await database.fetch_one(update_query, *params)
        
        return {
            "status": "success",
            "message": "Bus updated successfully",
            "data": {"bus": dict(bus)}
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bus: {str(e)}")


@router.delete("/{bus_id}", response_model=Dict)
async def delete_bus(
    bus_id: int,
    current_user: Dict = Depends(require_role("vendor", "system_admin"))
):
    """
    Delete a bus (soft delete - set is_active to false)
    Vendors can only delete their own buses
    """
    try:
        # Check if bus exists
        check_query = "SELECT * FROM buses WHERE bus_id = $1"
        existing_bus = await database.fetch_one(check_query, bus_id)
        if not existing_bus:
            raise NotFoundException("Bus not found")
        
        # Check ownership for vendors
        if current_user['role'] == 'vendor':
            vendor_query = "SELECT vendor_id FROM vendors WHERE user_id = $1"
            vendor_result = await database.fetch_one(vendor_query, current_user['id'])
            if not vendor_result or vendor_result['vendor_id'] != existing_bus['vendor_id']:
                raise BadRequestException("You can only delete your own buses")
        
        # Check if bus has active schedules
        schedules_query = """
            SELECT COUNT(*) as count 
            FROM bus_schedules 
            WHERE bus_id = $1 AND is_active = true
        """
        schedules_count = await database.fetch_one(schedules_query, bus_id)
        
        if schedules_count['count'] > 0:
            raise BadRequestException(
                f"Cannot delete bus. {schedules_count['count']} active schedules are using this bus. "
                "Deactivate all schedules first."
            )
        
        # Soft delete
        delete_query = """
            UPDATE buses
            SET is_active = false, updated_at = $1
            WHERE bus_id = $2
            RETURNING bus_id
        """
        
        await database.fetch_one(delete_query, datetime.now(), bus_id)
        
        return {
            "status": "success",
            "message": "Bus deleted successfully"
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete bus: {str(e)}")
