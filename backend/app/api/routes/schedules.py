"""
Bus Schedules API - Schedule management endpoints
CRUD operations for bus schedules (bus + route + timing + pricing)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Optional
from datetime import datetime, date

from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundException, BadRequestException
from app.config.database import database


router = APIRouter()


# ===== PUBLIC ENDPOINTS =====

@router.get("/available", response_model=Dict)
async def get_available_schedules(
    route_id: Optional[int] = Query(None, description="Filter by route"),
    bus_id: Optional[int] = Query(None, description="Filter by bus"),
    journey_date: Optional[str] = Query(None, description="Journey date (YYYY-MM-DD)"),
    origin: Optional[str] = Query(None, description="Filter by origin"),
    destination: Optional[str] = Query(None, description="Filter by destination")
):
    """
    Get available schedules for booking
    Public endpoint for customers to search schedules
    """
    try:
        conditions = ["bs.is_active = true", "b.is_active = true", "r.is_active = true"]
        params = []
        param_count = 1
        
        if route_id:
            conditions.append(f"bs.route_id = ${param_count}")
            params.append(route_id)
            param_count += 1
        
        if bus_id:
            conditions.append(f"bs.bus_id = ${param_count}")
            params.append(bus_id)
            param_count += 1
        
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
                bs.schedule_id,
                bs.bus_id,
                bs.route_id,
                bs.departure_time,
                bs.arrival_time,
                bs.price,
                bs.operating_days,
                bs.is_active,
                b.bus_number,
                b.bus_type,
                b.total_seats,
                b.available_seats,
                b.amenities,
                r.origin,
                r.destination,
                r.distance_km,
                r.estimated_duration_minutes,
                v.vendor_id,
                v.company_name as vendor_name,
                v.contact_phone as vendor_phone,
                v.average_rating as vendor_rating
            FROM bus_schedules bs
            JOIN buses b ON bs.bus_id = b.bus_id
            JOIN routes r ON bs.route_id = r.route_id
            JOIN vendors v ON b.vendor_id = v.vendor_id
            WHERE {where_clause}
            ORDER BY bs.departure_time
        """
        
        results = await database.fetch_all(query, *params)
        
        schedules = []
        for row in results:
            # Filter by journey date if provided
            if journey_date:
                journey_dt = datetime.strptime(journey_date, '%Y-%m-%d')
                day_name = journey_dt.strftime('%A')
                
                if row['operating_days'] and day_name not in row['operating_days']:
                    continue
            
            schedules.append({
                "schedule_id": row['schedule_id'],
                "bus_id": row['bus_id'],
                "route_id": row['route_id'],
                "departure_time": str(row['departure_time'])[:5] if row['departure_time'] else None,
                "arrival_time": str(row['arrival_time'])[:5] if row['arrival_time'] else None,
                "price": float(row['price']) if row['price'] else 0.0,
                "operating_days": row['operating_days'] or [],
                "bus": {
                    "bus_number": row['bus_number'],
                    "bus_type": row['bus_type'],
                    "total_seats": row['total_seats'],
                    "available_seats": row['available_seats'],
                    "amenities": row['amenities'] or []
                },
                "route": {
                    "origin": row['origin'],
                    "destination": row['destination'],
                    "distance_km": float(row['distance_km']) if row['distance_km'] else 0.0,
                    "estimated_duration_minutes": row['estimated_duration_minutes']
                },
                "vendor": {
                    "vendor_id": row['vendor_id'],
                    "name": row['vendor_name'],
                    "phone": row['vendor_phone'],
                    "rating": float(row['vendor_rating']) if row['vendor_rating'] else 0.0
                }
            })
        
        return {
            "status": "success",
            "data": {
                "schedules": schedules,
                "total": len(schedules)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch schedules: {str(e)}"
        )


@router.get("/{schedule_id}", response_model=Dict)
async def get_schedule_details(schedule_id: int):
    """
    Get detailed information about a specific schedule
    """
    try:
        query = """
            SELECT 
                bs.*,
                b.bus_number,
                b.bus_type,
                b.total_seats,
                b.available_seats,
                b.amenities,
                r.origin,
                r.destination,
                r.distance_km,
                r.estimated_duration_minutes,
                v.vendor_id,
                v.company_name as vendor_name
            FROM bus_schedules bs
            JOIN buses b ON bs.bus_id = b.bus_id
            JOIN routes r ON bs.route_id = r.route_id
            JOIN vendors v ON b.vendor_id = v.vendor_id
            WHERE bs.schedule_id = $1
        """
        
        schedule = await database.fetch_one(query, schedule_id)
        
        if not schedule:
            raise NotFoundException("Schedule not found")
        
        return {
            "status": "success",
            "data": {
                "schedule": {
                    "schedule_id": schedule['schedule_id'],
                    "bus_id": schedule['bus_id'],
                    "route_id": schedule['route_id'],
                    "departure_time": str(schedule['departure_time'])[:5] if schedule['departure_time'] else None,
                    "arrival_time": str(schedule['arrival_time'])[:5] if schedule['arrival_time'] else None,
                    "price": float(schedule['price']) if schedule['price'] else 0.0,
                    "operating_days": schedule['operating_days'] or [],
                    "is_active": schedule['is_active'],
                    "created_at": schedule['created_at'].isoformat() if schedule['created_at'] else None,
                    "bus": {
                        "bus_number": schedule['bus_number'],
                        "bus_type": schedule['bus_type'],
                        "total_seats": schedule['total_seats'],
                        "available_seats": schedule['available_seats'],
                        "amenities": schedule['amenities'] or []
                    },
                    "route": {
                        "origin": schedule['origin'],
                        "destination": schedule['destination'],
                        "distance_km": float(schedule['distance_km']) if schedule['distance_km'] else 0.0,
                        "estimated_duration_minutes": schedule['estimated_duration_minutes']
                    },
                    "vendor": {
                        "vendor_id": schedule['vendor_id'],
                        "name": schedule['vendor_name']
                    }
                }
            }
        }
        
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch schedule: {str(e)}"
        )


@router.get("/{schedule_id}/seats", response_model=Dict)
async def get_seat_availability(
    schedule_id: int,
    journey_date: str = Query(..., description="Journey date (YYYY-MM-DD)")
):
    """
    Get seat availability for a specific schedule on a specific date
    Returns list of booked seat numbers and total seats
    """
    try:
        # Validate date format
        try:
            date_obj = datetime.strptime(journey_date, '%Y-%m-%d').date()
        except ValueError:
            raise BadRequestException("Invalid date format. Use YYYY-MM-DD")
        
        # Check if date is in the past
        if date_obj < date.today():
            raise BadRequestException("Cannot check seat availability for past dates")
        
        # Get schedule and bus details
        schedule_query = """
            SELECT 
                bs.schedule_id,
                bs.bus_id,
                bs.route_id,
                bs.is_active,
                b.total_seats,
                b.bus_type,
                b.bus_number,
                r.origin,
                r.destination
            FROM bus_schedules bs
            JOIN buses b ON bs.bus_id = b.bus_id
            JOIN routes r ON bs.route_id = r.route_id
            WHERE bs.schedule_id = $1
        """
        
        schedule = await database.fetch_one(schedule_query, schedule_id)
        
        if not schedule:
            raise NotFoundException("Schedule not found")
        
        if not schedule['is_active']:
            raise BadRequestException("This schedule is not currently active")
        
        # Get all booked seats for this schedule and date
        bookings_query = """
            SELECT 
                t.seat_number
            FROM tickets t
            JOIN bookings b ON t.booking_id = b.id
            WHERE b.schedule_id = $1
                AND b.journey_date = $2
                AND b.booking_status IN ('confirmed', 'completed')
                AND b.payment_status = 'completed'
            ORDER BY t.seat_number
        """
        
        booked_tickets = await database.fetch_all(
            bookings_query,
            schedule_id,
            journey_date
        )
        
        booked_seats = [ticket['seat_number'] for ticket in booked_tickets]
        total_seats = schedule['total_seats']
        available_seats_count = total_seats - len(booked_seats)
        
        return {
            "status": "success",
            "message": "Seat availability retrieved successfully",
            "data": {
                "scheduleId": schedule_id,
                "journeyDate": journey_date,
                "busDetails": {
                    "busId": schedule['bus_id'],
                    "busNumber": schedule['bus_number'],
                    "busType": schedule['bus_type'],
                    "totalSeats": total_seats
                },
                "route": {
                    "origin": schedule['origin'],
                    "destination": schedule['destination']
                },
                "seatAvailability": {
                    "totalSeats": total_seats,
                    "bookedSeats": booked_seats,
                    "availableSeatsCount": available_seats_count,
                    "isFullyBooked": available_seats_count == 0
                }
            }
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch seat availability: {str(e)}"
        )


# ===== VENDOR ENDPOINTS (Protected) =====

@router.get("/vendor/all", response_model=Dict)
async def get_vendor_schedules(
    current_user: Dict = Depends(require_role(["vendor", "system_admin"])),
    bus_id: Optional[int] = Query(None, description="Filter by bus"),
    route_id: Optional[int] = Query(None, description="Filter by route"),
    is_active: Optional[bool] = Query(None, description="Filter by active status")
):
    """
    Get all schedules for vendor's buses
    """
    try:
        vendor_id = current_user.get('vendor_id')
        
        conditions = []
        params = []
        param_count = 1
        
        # If vendor, filter by vendor_id
        if current_user.get('role') == 'vendor' and vendor_id:
            conditions.append(f"v.vendor_id = ${param_count}")
            params.append(vendor_id)
            param_count += 1
        
        if bus_id:
            conditions.append(f"bs.bus_id = ${param_count}")
            params.append(bus_id)
            param_count += 1
        
        if route_id:
            conditions.append(f"bs.route_id = ${param_count}")
            params.append(route_id)
            param_count += 1
        
        if is_active is not None:
            conditions.append(f"bs.is_active = ${param_count}")
            params.append(is_active)
            param_count += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
            SELECT 
                bs.schedule_id,
                bs.bus_id,
                bs.route_id,
                bs.departure_time,
                bs.arrival_time,
                bs.price,
                bs.operating_days,
                bs.is_active,
                bs.created_at,
                b.bus_number,
                b.bus_type,
                r.origin,
                r.destination,
                r.distance_km,
                v.company_name as vendor_name,
                (
                    SELECT COUNT(*)
                    FROM bookings bk
                    WHERE bk.schedule_id = bs.schedule_id
                    AND bk.status = 'completed'
                ) as total_bookings
            FROM bus_schedules bs
            JOIN buses b ON bs.bus_id = b.bus_id
            JOIN routes r ON bs.route_id = r.route_id
            JOIN vendors v ON b.vendor_id = v.vendor_id
            {where_clause}
            ORDER BY bs.departure_time
        """
        
        results = await database.fetch_all(query, *params)
        
        schedules = []
        for row in results:
            schedules.append({
                "schedule_id": row['schedule_id'],
                "bus_id": row['bus_id'],
                "route_id": row['route_id'],
                "departure_time": str(row['departure_time'])[:5] if row['departure_time'] else None,
                "arrival_time": str(row['arrival_time'])[:5] if row['arrival_time'] else None,
                "price": float(row['price']) if row['price'] else 0.0,
                "operating_days": row['operating_days'] or [],
                "is_active": row['is_active'],
                "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                "bus_number": row['bus_number'],
                "bus_type": row['bus_type'],
                "route": f"{row['origin']} → {row['destination']}",
                "distance_km": float(row['distance_km']) if row['distance_km'] else 0.0,
                "vendor_name": row['vendor_name'],
                "total_bookings": row['total_bookings'] or 0
            })
        
        return {
            "status": "success",
            "data": {
                "schedules": schedules,
                "total": len(schedules)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vendor schedules: {str(e)}"
        )


@router.post("/create", response_model=Dict)
async def create_schedule(
    schedule_data: Dict,
    current_user: Dict = Depends(require_role(["vendor", "system_admin"]))
):
    """
    Create a new bus schedule
    Vendors can only create schedules for their own buses
    """
    try:
        # Validate required fields
        required_fields = ['bus_id', 'route_id', 'departure_time', 'arrival_time', 'price']
        for field in required_fields:
            if field not in schedule_data:
                raise BadRequestException(f"Missing required field: {field}")
        
        vendor_id = current_user.get('vendor_id')
        
        # Verify bus belongs to vendor (if vendor role)
        if current_user.get('role') == 'vendor':
            bus_check = """
                SELECT bus_id FROM buses 
                WHERE bus_id = $1 AND vendor_id = $2
            """
            bus = await database.fetch_one(bus_check, schedule_data['bus_id'], vendor_id)
            
            if not bus:
                raise BadRequestException("Bus not found or does not belong to you")
        
        # Verify route exists
        route_check = "SELECT route_id FROM routes WHERE route_id = $1 AND is_active = true"
        route = await database.fetch_one(route_check, schedule_data['route_id'])
        
        if not route:
            raise BadRequestException("Route not found or inactive")
        
        # Check for schedule conflicts (same bus, overlapping times)
        conflict_check = """
            SELECT schedule_id FROM bus_schedules
            WHERE bus_id = $1 
            AND route_id = $2
            AND departure_time = $3
            AND is_active = true
        """
        conflict = await database.fetch_one(
            conflict_check,
            schedule_data['bus_id'],
            schedule_data['route_id'],
            schedule_data['departure_time']
        )
        
        if conflict:
            raise BadRequestException("A schedule with the same bus, route, and departure time already exists")
        
        # Insert new schedule
        insert_query = """
            INSERT INTO bus_schedules (
                bus_id,
                route_id,
                departure_time,
                arrival_time,
                price,
                operating_days,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING schedule_id, bus_id, route_id, departure_time, 
                      arrival_time, price, operating_days, is_active, created_at
        """
        
        schedule = await database.fetch_one(
            insert_query,
            schedule_data['bus_id'],
            schedule_data['route_id'],
            schedule_data['departure_time'],
            schedule_data['arrival_time'],
            schedule_data['price'],
            schedule_data.get('operating_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
            schedule_data.get('is_active', True)
        )
        
        return {
            "status": "success",
            "message": "Schedule created successfully",
            "data": {
                "schedule": {
                    "schedule_id": schedule['schedule_id'],
                    "bus_id": schedule['bus_id'],
                    "route_id": schedule['route_id'],
                    "departure_time": str(schedule['departure_time'])[:5],
                    "arrival_time": str(schedule['arrival_time'])[:5],
                    "price": float(schedule['price']),
                    "operating_days": schedule['operating_days'],
                    "is_active": schedule['is_active'],
                    "created_at": schedule['created_at'].isoformat()
                }
            }
        }
        
    except BadRequestException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create schedule: {str(e)}"
        )


@router.put("/{schedule_id}", response_model=Dict)
async def update_schedule(
    schedule_id: int,
    schedule_data: Dict,
    current_user: Dict = Depends(require_role(["vendor", "system_admin"]))
):
    """
    Update an existing schedule
    Vendors can only update schedules for their own buses
    """
    try:
        vendor_id = current_user.get('vendor_id')
        
        # Check if schedule exists and belongs to vendor
        check_query = """
            SELECT bs.schedule_id, b.vendor_id
            FROM bus_schedules bs
            JOIN buses b ON bs.bus_id = b.bus_id
            WHERE bs.schedule_id = $1
        """
        existing = await database.fetch_one(check_query, schedule_id)
        
        if not existing:
            raise NotFoundException("Schedule not found")
        
        # Verify ownership if vendor
        if current_user.get('role') == 'vendor' and existing['vendor_id'] != vendor_id:
            raise BadRequestException("You can only update schedules for your own buses")
        
        # Build update query dynamically
        update_fields = []
        params = []
        param_count = 1
        
        allowed_fields = ['bus_id', 'route_id', 'departure_time', 'arrival_time', 'price', 'operating_days', 'is_active']
        
        for field in allowed_fields:
            if field in schedule_data:
                update_fields.append(f"{field} = ${param_count}")
                params.append(schedule_data[field])
                param_count += 1
        
        if not update_fields:
            raise BadRequestException("No fields to update")
        
        # Add updated_at
        update_fields.append(f"updated_at = ${param_count}")
        params.append(datetime.now())
        param_count += 1
        
        # Add schedule_id for WHERE clause
        params.append(schedule_id)
        
        update_query = f"""
            UPDATE bus_schedules
            SET {', '.join(update_fields)}
            WHERE schedule_id = ${param_count}
            RETURNING schedule_id, bus_id, route_id, departure_time, 
                      arrival_time, price, operating_days, is_active, updated_at
        """
        
        schedule = await database.fetch_one(update_query, *params)
        
        return {
            "status": "success",
            "message": "Schedule updated successfully",
            "data": {
                "schedule": {
                    "schedule_id": schedule['schedule_id'],
                    "bus_id": schedule['bus_id'],
                    "route_id": schedule['route_id'],
                    "departure_time": str(schedule['departure_time'])[:5],
                    "arrival_time": str(schedule['arrival_time'])[:5],
                    "price": float(schedule['price']),
                    "operating_days": schedule['operating_days'],
                    "is_active": schedule['is_active'],
                    "updated_at": schedule['updated_at'].isoformat()
                }
            }
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update schedule: {str(e)}"
        )


@router.delete("/{schedule_id}", response_model=Dict)
async def delete_schedule(
    schedule_id: int,
    current_user: Dict = Depends(require_role(["vendor", "system_admin"]))
):
    """
    Delete a schedule (soft delete - set is_active to false)
    Vendors can only delete schedules for their own buses
    """
    try:
        vendor_id = current_user.get('vendor_id')
        
        # Check if schedule exists and belongs to vendor
        check_query = """
            SELECT bs.schedule_id, b.vendor_id
            FROM bus_schedules bs
            JOIN buses b ON bs.bus_id = b.bus_id
            WHERE bs.schedule_id = $1
        """
        existing = await database.fetch_one(check_query, schedule_id)
        
        if not existing:
            raise NotFoundException("Schedule not found")
        
        # Verify ownership if vendor
        if current_user.get('role') == 'vendor' and existing['vendor_id'] != vendor_id:
            raise BadRequestException("You can only delete schedules for your own buses")
        
        # Check for active bookings
        bookings_check = """
            SELECT COUNT(*) as count
            FROM bookings
            WHERE schedule_id = $1
            AND status IN ('pending', 'completed')
            AND journey_date >= CURRENT_DATE
        """
        bookings_count = await database.fetch_one(bookings_check, schedule_id)
        
        if bookings_count['count'] > 0:
            raise BadRequestException(
                f"Cannot delete schedule. {bookings_count['count']} active/future bookings exist. "
                "Cancel bookings or wait until journey dates pass."
            )
        
        # Soft delete
        delete_query = """
            UPDATE bus_schedules
            SET is_active = false, updated_at = $1
            WHERE schedule_id = $2
            RETURNING schedule_id
        """
        
        await database.fetch_one(delete_query, datetime.now(), schedule_id)
        
        return {
            "status": "success",
            "message": "Schedule deleted successfully"
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete schedule: {str(e)}"
        )
