"""
Test Routes - Database connection testing
"""

from fastapi import APIRouter, HTTPException
from app.config.database import database

router = APIRouter()


@router.get("/db-status")
async def test_database_connection():
    """Test database connection and return database info"""
    try:
        # Test basic query
        result = await database.fetch_one("SELECT version();")
        version = result['version'] if result else "Unknown"
        
        # Count tables
        tables_result = await database.fetch_one("""
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        """)
        table_count = tables_result['table_count'] if tables_result else 0
        
        # Count views
        views_result = await database.fetch_one("""
            SELECT COUNT(*) as view_count 
            FROM information_schema.views 
            WHERE table_schema = 'public';
        """)
        view_count = views_result['view_count'] if views_result else 0
        
        return {
            "status": "success",
            "message": "Database connection successful",
            "database": "ticket_nepal",
            "postgres_version": version.split(',')[0] if version else "Unknown",
            "statistics": {
                "tables": table_count,
                "views": view_count
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )


@router.get("/users/count")
async def get_users_count():
    """Get count of users by role"""
    try:
        result = await database.fetch_all("""
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role 
            ORDER BY role;
        """)
        
        users_by_role = {row['role']: row['count'] for row in result}
        total = sum(users_by_role.values())
        
        return {
            "status": "success",
            "total_users": total,
            "by_role": users_by_role
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users: {str(e)}"
        )


@router.get("/vendors/list")
async def get_vendors():
    """Get list of all vendors"""
    try:
        result = await database.fetch_all("""
            SELECT 
                v.vendor_id,
                v.company_name,
                v.city,
                v.is_verified,
                v.average_rating,
                v.total_reviews,
                u.name as owner_name,
                u.email as owner_email
            FROM vendors v
            JOIN users u ON v.user_id = u.user_id
            ORDER BY v.company_name;
        """)
        
        vendors = []
        for row in result:
            vendors.append({
                "vendor_id": row['vendor_id'],
                "company_name": row['company_name'],
                "city": row['city'],
                "is_verified": row['is_verified'],
                "average_rating": float(row['average_rating']) if row['average_rating'] else 0.0,
                "total_reviews": row['total_reviews'],
                "owner": {
                    "name": row['owner_name'],
                    "email": row['owner_email']
                }
            })
        
        return {
            "status": "success",
            "count": len(vendors),
            "vendors": vendors
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vendors: {str(e)}"
        )


@router.get("/routes/active")
async def get_active_routes():
    """Get all active routes"""
    try:
        result = await database.fetch_all("""
            SELECT 
                route_id,
                origin,
                destination,
                distance_km,
                estimated_duration_minutes,
                base_price,
                is_active
            FROM routes
            WHERE is_active = true
            ORDER BY origin, destination;
        """)
        
        routes = []
        for row in result:
            routes.append({
                "route_id": row['route_id'],
                "origin": row['origin'],
                "destination": row['destination'],
                "distance_km": float(row['distance_km']),
                "duration_minutes": row['estimated_duration_minutes'],
                "base_price": float(row['base_price']),
                "route_name": f"{row['origin']} → {row['destination']}"
            })
        
        return {
            "status": "success",
            "count": len(routes),
            "routes": routes
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch routes: {str(e)}"
        )
