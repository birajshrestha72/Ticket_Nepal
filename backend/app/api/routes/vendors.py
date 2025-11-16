"""
Vendor Routes - Vendor registration, profile, and management endpoints
FastAPI router with role-based access control
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime

from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
    ForbiddenException
)
from app.config.database import database


router = APIRouter()


# ===== PYDANTIC MODELS =====

class VendorCreate(BaseModel):
    """Vendor registration model"""
    user_id: int
    company_name: str = Field(..., min_length=3, max_length=200)
    registration_number: str = Field(..., max_length=50)
    pan_number: Optional[str] = Field(None, max_length=20)
    address: str
    city: str = Field(..., max_length=100)
    province: str = Field(..., max_length=50)
    contact_person: str = Field(..., max_length=100)
    contact_phone: str = Field(..., max_length=15)
    contact_email: str
    
    @validator('province')
    def validate_province(cls, v):
        valid_provinces = [
            'Koshi Pradesh',
            'Madhesh Pradesh',
            'Bagmati Pradesh',
            'Gandaki Pradesh',
            'Lumbini Pradesh',
            'Karnali Pradesh',
            'Sudurpashchim Pradesh'
        ]
        if v not in valid_provinces:
            raise ValueError(f'Province must be one of: {", ".join(valid_provinces)}')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "company_name": "ABC Travels Pvt. Ltd.",
                "registration_number": "123456/078/079",
                "pan_number": "123456789",
                "address": "Kalanki, Kathmandu",
                "city": "Kathmandu",
                "province": "Bagmati Pradesh",
                "contact_person": "Ram Bahadur",
                "contact_phone": "9801234567",
                "contact_email": "info@abctravels.com"
            }
        }


class VendorUpdate(BaseModel):
    """Vendor profile update model"""
    company_name: Optional[str] = Field(None, min_length=3, max_length=200)
    pan_number: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=50)
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=15)
    contact_email: Optional[str] = None


class VendorResponse(BaseModel):
    """Vendor response model"""
    vendor_id: int
    user_id: int
    company_name: str
    registration_number: str
    pan_number: Optional[str]
    address: str
    city: str
    province: str
    contact_person: str
    contact_phone: str
    contact_email: str
    is_verified: bool
    verification_date: Optional[datetime]
    average_rating: float
    total_reviews: int
    created_at: datetime
    updated_at: datetime


# ===== ENDPOINTS =====

@router.post("/", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    vendor_data: VendorCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create vendor profile for authenticated user
    Vendor ko profile banaucha (user must have vendor role)
    """
    # Verify user has vendor role
    if current_user["role"] != "vendor":
        raise ForbiddenException("Only users with vendor role can create vendor profiles")
    
    # Verify user_id matches current user
    if vendor_data.user_id != current_user["id"]:
        raise ForbiddenException("You can only create vendor profile for yourself")
    
    # Check if vendor profile already exists
    existing = await database.fetch_one(
        "SELECT vendor_id FROM vendors WHERE user_id = $1",
        vendor_data.user_id
    )
    
    if existing:
        raise ConflictException("Vendor profile already exists for this user")
    
    # Check if registration number is unique
    existing_reg = await database.fetch_one(
        "SELECT vendor_id FROM vendors WHERE registration_number = $1",
        vendor_data.registration_number
    )
    
    if existing_reg:
        raise ConflictException("Registration number already exists")
    
    # Insert vendor profile
    vendor = await database.fetch_one(
        """
        INSERT INTO vendors (
            user_id, company_name, registration_number, pan_number,
            address, city, province, contact_person, contact_phone, contact_email
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING 
            vendor_id, user_id, company_name, registration_number, pan_number,
            address, city, province, contact_person, contact_phone, contact_email,
            is_verified, verification_date, average_rating, total_reviews,
            created_at, updated_at
        """,
        vendor_data.user_id,
        vendor_data.company_name,
        vendor_data.registration_number,
        vendor_data.pan_number,
        vendor_data.address,
        vendor_data.city,
        vendor_data.province,
        vendor_data.contact_person,
        vendor_data.contact_phone,
        vendor_data.contact_email
    )
    
    return {
        "status": "success",
        "message": "Vendor profile created successfully. Awaiting verification.",
        "data": {
            "vendor": dict(vendor)
        }
    }


@router.get("/me", response_model=Dict)
async def get_my_vendor_profile(
    current_user: dict = Depends(require_role("vendor"))
):
    """
    Get vendor profile for current user
    Login bhayeko vendor ko profile dekhaucha
    """
    vendor = await database.fetch_one(
        """
        SELECT 
            v.*,
            u.name as owner_name,
            u.email as owner_email
        FROM vendors v
        JOIN users u ON v.user_id = u.user_id
        WHERE v.user_id = $1
        """,
        current_user["id"]
    )
    
    if not vendor:
        raise NotFoundException("Vendor profile not found. Please complete registration.")
    
    return {
        "status": "success",
        "data": {
            "vendor": dict(vendor)
        }
    }


@router.get("/{vendor_id}", response_model=Dict)
async def get_vendor_by_id(vendor_id: int):
    """
    Get vendor details by ID (public endpoint)
    Koi pani vendor ko details herna sakcha
    """
    vendor = await database.fetch_one(
        """
        SELECT 
            v.vendor_id, v.company_name, v.registration_number,
            v.address, v.city, v.province,
            v.contact_person, v.contact_phone, v.contact_email,
            v.is_verified, v.average_rating, v.total_reviews,
            v.created_at,
            u.name as owner_name
        FROM vendors v
        JOIN users u ON v.user_id = u.user_id
        WHERE v.vendor_id = $1
        """,
        vendor_id
    )
    
    if not vendor:
        raise NotFoundException("Vendor not found")
    
    return {
        "status": "success",
        "data": {
            "vendor": dict(vendor)
        }
    }


@router.get("/public/list", response_model=Dict)
async def list_vendors_with_buses(
    page: int = 1,
    limit: int = 10,
    city: Optional[str] = None,
    province: Optional[str] = None,
    verified_only: bool = False
):
    """
    List all vendors with their buses - PUBLIC endpoint with pagination
    Sabai vendors ko list with uniharu ko buses dekhaucha (10 per page)
    """
    # Calculate offset
    offset = (page - 1) * limit
    
    # Build query with filters
    conditions = []
    params = []
    param_count = 1
    
    if city:
        conditions.append(f"v.city ILIKE ${param_count}")
        params.append(f"%{city}%")
        param_count += 1
    
    if province:
        conditions.append(f"v.province = ${param_count}")
        params.append(province)
        param_count += 1
    
    if verified_only:
        conditions.append("v.is_verified = true")
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    # Get total count
    total = await database.fetch_val(
        f"SELECT COUNT(*) FROM vendors v WHERE {where_clause}",
        *params
    )
    
    # Get vendors
    list_params = params + [limit, offset]
    vendors_result = await database.fetch_all(
        f"""
        SELECT 
            v.vendor_id, v.company_name, v.registration_number,
            v.address, v.city, v.province,
            v.contact_person, v.contact_phone, v.contact_email,
            v.is_verified, v.average_rating, v.total_reviews,
            v.created_at,
            u.name as owner_name
        FROM vendors v
        JOIN users u ON v.user_id = u.user_id
        WHERE {where_clause}
        ORDER BY v.is_verified DESC, v.average_rating DESC, v.company_name
        LIMIT ${param_count} OFFSET ${param_count + 1}
        """,
        *list_params
    )
    
    # Get buses for each vendor
    vendors = []
    for vendor_row in vendors_result:
        vendor_id = vendor_row['vendor_id']
        
        # Fetch buses for this vendor
        buses_query = """
            SELECT 
                b.bus_id,
                b.bus_number,
                b.bus_type,
                b.total_seats,
                b.available_seats,
                b.amenities,
                b.registration_year,
                b.is_active,
                COUNT(DISTINCT bs.schedule_id) as total_routes
            FROM buses b
            LEFT JOIN bus_schedules bs ON b.bus_id = bs.bus_id AND bs.is_active = true
            WHERE b.vendor_id = $1 AND b.is_active = true
            GROUP BY b.bus_id
            ORDER BY b.bus_type, b.bus_number
        """
        
        buses_result = await database.fetch_all(buses_query, vendor_id)
        
        buses = []
        for bus_row in buses_result:
            bus_type_slug = bus_row['bus_type'].lower().replace('-', '_').replace(' ', '_')
            buses.append({
                "bus_id": bus_row['bus_id'],
                "bus_number": bus_row['bus_number'],
                "bus_type": bus_row['bus_type'],
                "total_seats": bus_row['total_seats'],
                "available_seats": bus_row['available_seats'],
                "amenities": bus_row['amenities'] or [],
                "registration_year": bus_row['registration_year'],
                "is_active": bus_row['is_active'],
                "total_routes": bus_row['total_routes'],
                "image_url": f"/images/buses/{bus_type_slug}.jpg"
            })
        
        vendors.append({
            "vendor_id": vendor_row['vendor_id'],
            "company_name": vendor_row['company_name'],
            "registration_number": vendor_row['registration_number'],
            "address": vendor_row['address'],
            "city": vendor_row['city'],
            "province": vendor_row['province'],
            "contact_person": vendor_row['contact_person'],
            "contact_phone": vendor_row['contact_phone'],
            "contact_email": vendor_row['contact_email'],
            "is_verified": vendor_row['is_verified'],
            "average_rating": float(vendor_row['average_rating']) if vendor_row['average_rating'] else 0.0,
            "total_reviews": vendor_row['total_reviews'] or 0,
            "owner_name": vendor_row['owner_name'],
            "total_buses": len(buses),
            "buses": buses
        })
    
    # Calculate pagination info
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "status": "success",
        "data": {
            "vendors": vendors,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total,
                "items_per_page": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    }


@router.get("/", response_model=Dict)
async def list_vendors(
    skip: int = 0,
    limit: int = 20,
    city: Optional[str] = None,
    province: Optional[str] = None,
    verified_only: bool = False
):
    """
    List all vendors with optional filters (simple list)
    Sabai vendors ko list dekhaucha
    """
    # Build query with filters
    conditions = []
    params = []
    param_count = 1
    
    if city:
        conditions.append(f"v.city ILIKE ${param_count}")
        params.append(f"%{city}%")
        param_count += 1
    
    if province:
        conditions.append(f"v.province = ${param_count}")
        params.append(province)
        param_count += 1
    
    if verified_only:
        conditions.append("v.is_verified = true")
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    # Get total count
    total = await database.fetch_val(
        f"SELECT COUNT(*) FROM vendors v WHERE {where_clause}",
        *params
    )
    
    # Get vendors
    params.extend([limit, skip])
    vendors = await database.fetch_all(
        f"""
        SELECT 
            v.vendor_id, v.company_name, v.city, v.province,
            v.is_verified, v.average_rating, v.total_reviews,
            v.created_at,
            u.name as owner_name
        FROM vendors v
        JOIN users u ON v.user_id = u.user_id
        WHERE {where_clause}
        ORDER BY v.created_at DESC
        LIMIT ${param_count} OFFSET ${param_count + 1}
        """,
        *params
    )
    
    return {
        "status": "success",
        "data": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "vendors": [dict(v) for v in vendors]
        }
    }


@router.put("/me", response_model=Dict)
async def update_my_vendor_profile(
    update_data: VendorUpdate,
    current_user: dict = Depends(require_role("vendor"))
):
    """
    Update vendor profile
    Vendor ko profile update garcha
    """
    # Get current vendor
    vendor = await database.fetch_one(
        "SELECT vendor_id FROM vendors WHERE user_id = $1",
        current_user["id"]
    )
    
    if not vendor:
        raise NotFoundException("Vendor profile not found")
    
    # Build dynamic update query
    updates = []
    values = []
    param_count = 1
    
    if update_data.company_name:
        updates.append(f"company_name = ${param_count}")
        values.append(update_data.company_name)
        param_count += 1
    
    if update_data.pan_number:
        updates.append(f"pan_number = ${param_count}")
        values.append(update_data.pan_number)
        param_count += 1
    
    if update_data.address:
        updates.append(f"address = ${param_count}")
        values.append(update_data.address)
        param_count += 1
    
    if update_data.city:
        updates.append(f"city = ${param_count}")
        values.append(update_data.city)
        param_count += 1
    
    if update_data.province:
        updates.append(f"province = ${param_count}")
        values.append(update_data.province)
        param_count += 1
    
    if update_data.contact_person:
        updates.append(f"contact_person = ${param_count}")
        values.append(update_data.contact_person)
        param_count += 1
    
    if update_data.contact_phone:
        updates.append(f"contact_phone = ${param_count}")
        values.append(update_data.contact_phone)
        param_count += 1
    
    if update_data.contact_email:
        updates.append(f"contact_email = ${param_count}")
        values.append(update_data.contact_email)
        param_count += 1
    
    if not updates:
        raise BadRequestException("No fields to update")
    
    # Add updated_at
    updates.append("updated_at = CURRENT_TIMESTAMP")
    
    # Add vendor_id for WHERE clause
    values.append(vendor["vendor_id"])
    
    # Execute update
    updated_vendor = await database.fetch_one(
        f"""
        UPDATE vendors 
        SET {', '.join(updates)}
        WHERE vendor_id = ${param_count}
        RETURNING *
        """,
        *values
    )
    
    return {
        "status": "success",
        "message": "Vendor profile updated successfully",
        "data": {
            "vendor": dict(updated_vendor)
        }
    }


@router.patch("/{vendor_id}/verify", response_model=Dict)
async def verify_vendor(
    vendor_id: int,
    current_user: dict = Depends(require_role("system_admin"))
):
    """
    Verify vendor (admin only)
    Admin le matra vendor verify garna sakcha
    """
    vendor = await database.fetch_one(
        """
        UPDATE vendors
        SET is_verified = true, verification_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE vendor_id = $1
        RETURNING *
        """,
        vendor_id
    )
    
    if not vendor:
        raise NotFoundException("Vendor not found")
    
    return {
        "status": "success",
        "message": "Vendor verified successfully",
        "data": {
            "vendor": dict(vendor)
        }
    }


@router.patch("/{vendor_id}/unverify", response_model=Dict)
async def unverify_vendor(
    vendor_id: int,
    current_user: dict = Depends(require_role("system_admin"))
):
    """
    Unverify vendor (admin only)
    Admin le matra vendor unverify garna sakcha
    """
    vendor = await database.fetch_one(
        """
        UPDATE vendors
        SET is_verified = false, verification_date = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE vendor_id = $1
        RETURNING *
        """,
        vendor_id
    )
    
    if not vendor:
        raise NotFoundException("Vendor not found")
    
    return {
        "status": "success",
        "message": "Vendor unverified",
        "data": {
            "vendor": dict(vendor)
        }
    }


@router.delete("/{vendor_id}", response_model=Dict)
async def delete_vendor(
    vendor_id: int,
    current_user: dict = Depends(require_role("system_admin"))
):
    """
    Delete vendor (admin only)
    Admin le matra vendor delete garna sakcha
    """
    deleted = await database.fetch_one(
        "DELETE FROM vendors WHERE vendor_id = $1 RETURNING vendor_id",
        vendor_id
    )
    
    if not deleted:
        raise NotFoundException("Vendor not found")
    
    return {
        "status": "success",
        "message": "Vendor deleted successfully"
    }
