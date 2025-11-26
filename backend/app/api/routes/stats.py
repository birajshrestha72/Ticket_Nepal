"""
Statistics API Routes
Provides summary statistics for the landing page and dashboards
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
from app.config.database import database

router = APIRouter()


@router.get("/summary", response_model=Dict)
async def get_system_stats():
    """
    Get system-wide statistics for landing page
    Returns counts of buses, routes, bookings, and users
    """
    try:
        # Get total active buses
        buses_query = """
            SELECT COUNT(*) as total
            FROM buses
        """
        buses_result = await database.fetch_one(buses_query)
        total_buses = buses_result['total'] if buses_result else 0
        
        # Get total active routes
        routes_query = """
            SELECT COUNT(*) as total
            FROM routes
        """
        routes_result = await database.fetch_one(routes_query)
        total_routes = routes_result['total'] if routes_result else 0
        
        # Get total bookings
        bookings_query = """
            SELECT COUNT(*) as total
            FROM bookings
            WHERE booking_status IN ('confirmed', 'completed')
        """
        bookings_result = await database.fetch_one(bookings_query)
        total_bookings = bookings_result['total'] if bookings_result else 0
        
        # Get total registered users
        users_query = """
            SELECT COUNT(*) as total
            FROM users
            WHERE role = 'user'
        """
        users_result = await database.fetch_one(users_query)
        total_users = users_result['total'] if users_result else 0
        
        # Get total active vendors
        vendors_query = """
            SELECT COUNT(*) as total
            FROM vendors
        """
        vendors_result = await database.fetch_one(vendors_query)
        total_vendors = vendors_result['total'] if vendors_result else 0
        
        return {
            "status": "success",
            "message": "Statistics retrieved successfully",
            "data": {
                "stats": {
                    "totalBuses": total_buses,
                    "totalRoutes": total_routes,
                    "totalBookings": total_bookings,
                    "totalUsers": total_users,
                    "totalVendors": total_vendors
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch statistics: {str(e)}"
        )


@router.get("/popular-routes", response_model=Dict)
async def get_popular_routes(limit: int = 6):
    """
    Get most popular routes based on booking count
    Returns routes with schedule counts
    """
    try:
        query = """
            SELECT 
                r.route_id,
                r.origin,
                r.destination,
                r.distance_km,
                COUNT(DISTINCT bs.schedule_id) as available_schedules,
                COUNT(DISTINCT bk.booking_id) as total_bookings,
                AVG(bs.price) as avg_price
            FROM routes r
            LEFT JOIN bus_schedules bs ON r.route_id = bs.route_id
            LEFT JOIN bookings bk ON bs.schedule_id = bk.schedule_id
            GROUP BY r.route_id, r.origin, r.destination, r.distance_km
            HAVING COUNT(DISTINCT bs.schedule_id) > 0
            ORDER BY total_bookings DESC, available_schedules DESC
            LIMIT $1
        """
        
        routes = await database.fetch_all(query, limit)
        
        routes_list = []
        for route in routes:
            routes_list.append({
                "id": route['route_id'],
                "origin": route['origin'],
                "destination": route['destination'],
                "distanceKm": float(route['distance_km']) if route['distance_km'] else 0,
                "availableSchedules": route['available_schedules'],
                "totalBookings": route['total_bookings'] or 0,
                "avgPrice": float(route['avg_price']) if route['avg_price'] else 0
            })
        
        return {
            "status": "success",
            "message": "Popular routes retrieved successfully",
            "data": {
                "routes": routes_list
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch popular routes: {str(e)}"
        )


@router.get("/featured-vendors", response_model=Dict)
async def get_featured_vendors(limit: int = 6):
    """
    Get featured vendors based on ratings and bus count
    Returns top-rated vendors with stats
    """
    try:
        query = """
            SELECT 
                v.vendor_id,
                v.company_name,
                v.is_verified,
                COUNT(DISTINCT b.bus_id) as total_buses,
                COALESCE(AVG(rev.rating), 0) as average_rating,
                COUNT(DISTINCT rev.review_id) as total_reviews
            FROM vendors v
            LEFT JOIN buses b ON v.vendor_id = b.vendor_id
            LEFT JOIN reviews rev ON v.vendor_id = rev.vendor_id
            GROUP BY v.vendor_id, v.company_name, v.is_verified
            HAVING COUNT(DISTINCT b.bus_id) > 0
            ORDER BY average_rating DESC, total_buses DESC
            LIMIT $1
        """
        
        vendors = await database.fetch_all(query, limit)
        
        vendors_list = []
        for vendor in vendors:
            vendors_list.append({
                "id": vendor['vendor_id'],
                "companyName": vendor['company_name'],
                "verified": vendor['is_verified'],
                "totalBuses": vendor['total_buses'],
                "averageRating": round(float(vendor['average_rating']), 1) if vendor['average_rating'] else 0,
                "totalReviews": vendor['total_reviews'] or 0
            })
        
        return {
            "status": "success",
            "message": "Featured vendors retrieved successfully",
            "data": {
                "vendors": vendors_list
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch featured vendors: {str(e)}"
        )
