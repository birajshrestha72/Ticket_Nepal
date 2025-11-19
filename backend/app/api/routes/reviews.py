"""
Reviews API Routes
Handles customer reviews and ratings for completed journeys
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.config.database import database
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


# Request Models
class CreateReviewRequest(BaseModel):
    bookingId: int
    busId: int
    vendorId: int
    overallRating: int = Field(ge=1, le=5)
    cleanlinessRating: Optional[int] = Field(default=0, ge=0, le=5)
    punctualityRating: Optional[int] = Field(default=0, ge=0, le=5)
    driverBehaviorRating: Optional[int] = Field(default=0, ge=0, le=5)
    comfortRating: Optional[int] = Field(default=0, ge=0, le=5)
    safetyRating: Optional[int] = Field(default=0, ge=0, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)


@router.post("/create")
async def create_review(
    review_data: CreateReviewRequest,
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a review for a completed booking
    Only the booking owner can review, and only once per booking
    """
    try:
        user_id = current_user.get("id")
        
        # Verify booking belongs to user and is completed
        booking_query = """
            SELECT id, booking_status, journey_date
            FROM bookings
            WHERE id = $1 AND user_id = $2
        """
        
        booking = await database.fetch_one(
            booking_query,
            review_data.bookingId,
            user_id
        )
        
        if not booking:
            raise NotFoundException("Booking not found or access denied")
        
        if booking['booking_status'] != 'completed':
            raise BadRequestException("Can only review completed bookings")
        
        # Check if already reviewed
        existing_review_query = """
            SELECT id FROM reviews WHERE booking_id = $1
        """
        existing_review = await database.fetch_one(
            existing_review_query,
            review_data.bookingId
        )
        
        if existing_review:
            raise BadRequestException("You have already reviewed this booking")
        
        # Create review
        insert_query = """
            INSERT INTO reviews (
                booking_id, user_id, bus_id, vendor_id,
                overall_rating, cleanliness_rating, punctuality_rating,
                driver_behavior_rating, comfort_rating, safety_rating,
                comment, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING *
        """
        
        new_review = await database.fetch_one(
            insert_query,
            review_data.bookingId,
            user_id,
            review_data.busId,
            review_data.vendorId,
            review_data.overallRating,
            review_data.cleanlinessRating,
            review_data.punctualityRating,
            review_data.driverBehaviorRating,
            review_data.comfortRating,
            review_data.safetyRating,
            review_data.comment
        )
        
        # Update bus and vendor average ratings
        await update_bus_rating(review_data.busId)
        await update_vendor_rating(review_data.vendorId)
        
        return {
            "status": "success",
            "data": {"review": dict(new_review)},
            "message": "Review submitted successfully"
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create review: {str(e)}"
        )


@router.get("/bus/{bus_id}")
async def get_bus_reviews(
    bus_id: int,
    limit: int = 10,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Get reviews for a specific bus
    """
    try:
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM reviews WHERE bus_id = $1"
        total_result = await database.fetch_one(count_query, bus_id)
        total_reviews = total_result['total']
        
        # Get reviews with user info
        query = """
            SELECT 
                r.*,
                u.full_name as reviewer_name,
                b.journey_date,
                b.booking_reference
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN bookings b ON r.booking_id = b.id
            WHERE r.bus_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        """
        
        reviews = await database.fetch_all(query, bus_id, limit, offset)
        
        # Get average ratings
        avg_query = """
            SELECT 
                AVG(overall_rating) as avg_overall,
                AVG(cleanliness_rating) as avg_cleanliness,
                AVG(punctuality_rating) as avg_punctuality,
                AVG(driver_behavior_rating) as avg_driver,
                AVG(comfort_rating) as avg_comfort,
                AVG(safety_rating) as avg_safety
            FROM reviews
            WHERE bus_id = $1
        """
        averages = await database.fetch_one(avg_query, bus_id)
        
        return {
            "status": "success",
            "data": {
                "reviews": [dict(r) for r in reviews],
                "averages": dict(averages) if averages else {},
                "pagination": {
                    "total": total_reviews,
                    "limit": limit,
                    "offset": offset,
                    "hasMore": (offset + limit) < total_reviews
                }
            },
            "message": "Reviews retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch reviews: {str(e)}"
        )


@router.get("/vendor/{vendor_id}")
async def get_vendor_reviews(
    vendor_id: int,
    limit: int = 10,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Get reviews for all buses of a vendor
    """
    try:
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM reviews WHERE vendor_id = $1"
        total_result = await database.fetch_one(count_query, vendor_id)
        total_reviews = total_result['total']
        
        # Get reviews
        query = """
            SELECT 
                r.*,
                u.full_name as reviewer_name,
                b.journey_date,
                bus.bus_number,
                bus.bus_type
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN bookings b ON r.booking_id = b.id
            JOIN buses bus ON r.bus_id = bus.id
            WHERE r.vendor_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        """
        
        reviews = await database.fetch_all(query, vendor_id, limit, offset)
        
        # Get average ratings
        avg_query = """
            SELECT 
                AVG(overall_rating) as avg_overall,
                COUNT(*) as review_count
            FROM reviews
            WHERE vendor_id = $1
        """
        stats = await database.fetch_one(avg_query, vendor_id)
        
        return {
            "status": "success",
            "data": {
                "reviews": [dict(r) for r in reviews],
                "statistics": dict(stats) if stats else {},
                "pagination": {
                    "total": total_reviews,
                    "limit": limit,
                    "offset": offset,
                    "hasMore": (offset + limit) < total_reviews
                }
            },
            "message": "Reviews retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch vendor reviews: {str(e)}"
        )


async def update_bus_rating(bus_id: int):
    """
    Update bus average rating based on reviews
    """
    try:
        query = """
            UPDATE buses
            SET rating = (
                SELECT AVG(overall_rating)
                FROM reviews
                WHERE bus_id = $1
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        """
        await database.execute(query, bus_id)
    except Exception as e:
        print(f"Failed to update bus rating: {str(e)}")


async def update_vendor_rating(vendor_id: int):
    """
    Update vendor average rating based on all reviews
    """
    try:
        query = """
            UPDATE vendors
            SET rating = (
                SELECT AVG(overall_rating)
                FROM reviews
                WHERE vendor_id = $1
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        """
        await database.execute(query, vendor_id)
    except Exception as e:
        print(f"Failed to update vendor rating: {str(e)}")
