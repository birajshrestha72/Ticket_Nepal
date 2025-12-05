"""
Routes API - Route management endpoints
CRUD operations for bus routes (origin → destination)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Optional
from datetime import datetime

from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundException, BadRequestException
from app.config.database import database


router = APIRouter()


# ===== PUBLIC ENDPOINTS =====

@router.get("/all", response_model=Dict)
async def get_all_routes(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    origin: Optional[str] = Query(None, description="Filter by origin"),
    destination: Optional[str] = Query(None, description="Filter by destination")
):
    """
    Get all routes with optional filters
    Public endpoint for displaying available routes
    """
    try:
        conditions = []
        params = []
        param_count = 1
        
        if is_active is not None:
            conditions.append(f"is_active = ${param_count}")
            params.append(is_active)
            param_count += 1
        
        if origin:
            conditions.append(f"origin ILIKE ${param_count}")
            params.append(f"%{origin}%")
            param_count += 1
            
        if destination:
            conditions.append(f"destination ILIKE ${param_count}")
            params.append(f"%{destination}%")
            param_count += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
            SELECT 
                route_id,
                origin,
                destination,
                distance_km,
                estimated_duration_minutes,
                base_price,
                is_active,
                created_at,
                (
                    SELECT COUNT(DISTINCT bs.schedule_id)
                    FROM bus_schedules bs
                    WHERE bs.route_id = routes.route_id 
                    AND bs.is_active = true
                ) as active_schedules
            FROM routes
            {where_clause}
            ORDER BY origin, destination
        """
        
        results = await database.fetch_all(query, *params)
        
        routes = []
        for row in results:
            routes.append({
                "route_id": row['route_id'],
                "origin": row['origin'],
                "destination": row['destination'],
                "distance_km": float(row['distance_km']) if row['distance_km'] else 0.0,
                "estimated_duration_minutes": row['estimated_duration_minutes'],
                "base_price": float(row['base_price']) if row['base_price'] else 0.0,
                "is_active": row['is_active'],
                "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                "active_schedules": row['active_schedules'] or 0
            })
        
        return {
            "status": "success",
            "data": {
                "routes": routes,
                "total": len(routes)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch routes: {str(e)}"
        )


@router.get("/popular", response_model=Dict)
async def get_popular_routes(limit: int = Query(10, ge=1, le=50)):
    """
    Get popular routes based on booking count
    Used for homepage display
    """
    try:
        query = """
            SELECT 
                r.route_id,
                r.origin,
                r.destination,
                r.distance_km,
                r.base_price,
                COUNT(DISTINCT b.booking_id) as total_bookings,
                COUNT(DISTINCT bs.schedule_id) as available_schedules
            FROM routes r
            LEFT JOIN bus_schedules bs ON r.route_id = bs.route_id AND bs.is_active = true
            LEFT JOIN bookings b ON bs.schedule_id = b.schedule_id
            WHERE r.is_active = true
            GROUP BY r.route_id
            ORDER BY total_bookings DESC, available_schedules DESC
            LIMIT $1
        """
        
        results = await database.fetch_all(query, limit)
        
        routes = []
        for row in results:
            routes.append({
                "route_id": row['route_id'],
                "origin": row['origin'],
                "destination": row['destination'],
                "distance_km": float(row['distance_km']) if row['distance_km'] else 0.0,
                "base_price": float(row['base_price']) if row['base_price'] else 0.0,
                "total_bookings": row['total_bookings'] or 0,
                "available_schedules": row['available_schedules'] or 0
            })
        
        return {
            "status": "success",
            "data": {
                "routes": routes,
                "total": len(routes)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch popular routes: {str(e)}"
        )


@router.get("/cities", response_model=Dict)
async def get_cities():
    """
    Get unique list of cities from routes
    Used for origin/destination dropdowns
    """
    try:
        query = """
            SELECT DISTINCT origin as city FROM routes WHERE is_active = true
            UNION
            SELECT DISTINCT destination as city FROM routes WHERE is_active = true
            ORDER BY city
        """
        
        results = await database.fetch_all(query)
        cities = [row['city'] for row in results]
        
        return {
            "status": "success",
            "data": {
                "cities": cities,
                "total": len(cities)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch cities: {str(e)}"
        )


@router.get("/{route_id}", response_model=Dict)
async def get_route_details(route_id: int):
    """
    Get detailed information about a specific route
    """
    try:
        query = """
            SELECT 
                route_id,
                origin,
                destination,
                distance_km,
                estimated_duration_minutes,
                base_price,
                is_active,
                created_at,
                updated_at
            FROM routes
            WHERE route_id = $1
        """
        
        route = await database.fetch_one(query, route_id)
        
        if not route:
            raise NotFoundException("Route not found")
        
        # Get schedules for this route
        schedules_query = """
            SELECT 
                bs.schedule_id,
                bs.departure_time,
                bs.arrival_time,
                bs.price,
                bs.operating_days,
                b.bus_id,
                b.bus_number,
                b.bus_type,
                v.company_name as vendor_name
            FROM bus_schedules bs
            JOIN buses b ON bs.bus_id = b.bus_id
            JOIN vendors v ON b.vendor_id = v.vendor_id
            WHERE bs.route_id = $1 AND bs.is_active = true
            ORDER BY bs.departure_time
        """
        
        schedules = await database.fetch_all(schedules_query, route_id)
        
        return {
            "status": "success",
            "data": {
                "route": {
                    "route_id": route['route_id'],
                    "origin": route['origin'],
                    "destination": route['destination'],
                    "distance_km": float(route['distance_km']) if route['distance_km'] else 0.0,
                    "estimated_duration_minutes": route['estimated_duration_minutes'],
                    "base_price": float(route['base_price']) if route['base_price'] else 0.0,
                    "is_active": route['is_active'],
                    "created_at": route['created_at'].isoformat() if route['created_at'] else None,
                    "updated_at": route['updated_at'].isoformat() if route['updated_at'] else None
                },
                "schedules": [
                    {
                        "schedule_id": s['schedule_id'],
                        "departure_time": str(s['departure_time'])[:5] if s['departure_time'] else None,
                        "arrival_time": str(s['arrival_time'])[:5] if s['arrival_time'] else None,
                        "price": float(s['price']) if s['price'] else 0.0,
                        "operating_days": s['operating_days'] or [],
                        "bus": {
                            "bus_id": s['bus_id'],
                            "bus_number": s['bus_number'],
                            "bus_type": s['bus_type'],
                            "vendor_name": s['vendor_name']
                        }
                    }
                    for s in schedules
                ]
            }
        }
        
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch route details: {str(e)}"
        )


# ===== PROTECTED ENDPOINTS (Admin/Vendor) =====

@router.post("/create", response_model=Dict)
async def create_route(
    route_data: Dict,
    current_user: Dict = Depends(require_role("system_admin", "vendor"))
):
    """
    Create a new route
    Only admins and vendors can create routes
    """
    try:
        # Validate required fields
        required_fields = ['origin', 'destination', 'distance_km', 'estimated_duration_minutes', 'base_price']
        for field in required_fields:
            if field not in route_data:
                raise BadRequestException(f"Missing required field: {field}")
        
        # Check if route already exists
        check_query = """
            SELECT route_id FROM routes 
            WHERE LOWER(origin) = LOWER($1) 
            AND LOWER(destination) = LOWER($2)
        """
        existing = await database.fetch_one(
            check_query, 
            route_data['origin'], 
            route_data['destination']
        )
        
        if existing:
            raise BadRequestException(
                f"Route from {route_data['origin']} to {route_data['destination']} already exists"
            )
        
        # Insert new route
        insert_query = """
            INSERT INTO routes (
                origin, 
                destination, 
                distance_km, 
                estimated_duration_minutes, 
                base_price,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING route_id, origin, destination, distance_km, 
                      estimated_duration_minutes, base_price, is_active, created_at
        """
        
        route = await database.fetch_one(
            insert_query,
            route_data['origin'],
            route_data['destination'],
            route_data['distance_km'],
            route_data['estimated_duration_minutes'],
            route_data['base_price'],
            route_data.get('is_active', True)
        )
        
        return {
            "status": "success",
            "message": "Route created successfully",
            "data": {
                "route": {
                    "route_id": route['route_id'],
                    "origin": route['origin'],
                    "destination": route['destination'],
                    "distance_km": float(route['distance_km']),
                    "estimated_duration_minutes": route['estimated_duration_minutes'],
                    "base_price": float(route['base_price']),
                    "is_active": route['is_active'],
                    "created_at": route['created_at'].isoformat()
                }
            }
        }
        
    except BadRequestException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create route: {str(e)}"
        )


@router.put("/{route_id}", response_model=Dict)
async def update_route(
    route_id: int,
    route_data: Dict,
    current_user: Dict = Depends(require_role("system_admin", "vendor"))
):
    """
    Update an existing route
    """
    try:
        # Check if route exists
        check_query = "SELECT route_id FROM routes WHERE route_id = $1"
        existing = await database.fetch_one(check_query, route_id)
        
        if not existing:
            raise NotFoundException("Route not found")
        
        # Build update query dynamically
        update_fields = []
        params = []
        param_count = 1
        
        allowed_fields = ['origin', 'destination', 'distance_km', 'estimated_duration_minutes', 'base_price', 'is_active']
        
        for field in allowed_fields:
            if field in route_data:
                update_fields.append(f"{field} = ${param_count}")
                params.append(route_data[field])
                param_count += 1
        
        if not update_fields:
            raise BadRequestException("No fields to update")
        
        # Add route_id for WHERE clause
        params.append(route_id)
        
        update_query = f"""
            UPDATE routes
            SET {', '.join(update_fields)}
            WHERE route_id = ${param_count}
            RETURNING route_id, origin, destination, distance_km, 
                      estimated_duration_minutes, base_price, is_active, created_at
        """
        
        route = await database.fetch_one(update_query, *params)
        
        return {
            "status": "success",
            "message": "Route updated successfully",
            "data": {
                "route": {
                    "route_id": route['route_id'],
                    "origin": route['origin'],
                    "destination": route['destination'],
                    "distance_km": float(route['distance_km']),
                    "estimated_duration_minutes": route['estimated_duration_minutes'],
                    "base_price": float(route['base_price']),
                    "is_active": route['is_active'],
                    "created_at": route['created_at'].isoformat()
                }
            }
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update route: {str(e)}"
        )


@router.delete("/{route_id}", response_model=Dict)
async def delete_route(
    route_id: int,
    current_user: Dict = Depends(require_role("system_admin"))
):
    """
    Delete a route (soft delete - set is_active to false)
    Only system admins can delete routes
    """
    try:
        # Check if route exists
        check_query = "SELECT route_id FROM routes WHERE route_id = $1"
        existing = await database.fetch_one(check_query, route_id)
        
        if not existing:
            raise NotFoundException("Route not found")
        
        # Check if route has active schedules
        schedules_query = """
            SELECT COUNT(*) as count 
            FROM bus_schedules 
            WHERE route_id = $1 AND is_active = true
        """
        schedules_count = await database.fetch_one(schedules_query, route_id)
        
        if schedules_count['count'] > 0:
            raise BadRequestException(
                f"Cannot delete route. {schedules_count['count']} active schedules are using this route. "
                "Deactivate all schedules first."
            )
        
        # Soft delete - set is_active to false
        delete_query = """
            UPDATE routes
            SET is_active = false
            WHERE route_id = $1
            RETURNING route_id
        """
        
        await database.fetch_one(delete_query, route_id)
        
        return {
            "status": "success",
            "message": "Route deleted successfully"
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete route: {str(e)}"
        )
