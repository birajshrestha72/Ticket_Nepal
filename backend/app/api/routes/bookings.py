"""
Bookings API Routes
Handles booking management, retrieval, and customer booking history
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, date

from app.config.database import database
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


@router.get("/my-bookings")
async def get_my_bookings(
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get all bookings for the current logged-in customer
    Returns booking history with bus, route, and payment details
    """
    try:
        user_id = current_user.get("id")
        
        # Query to fetch all bookings for the user with related data
        query = """
            SELECT 
                b.id,
                b.booking_reference as "bookingReference",
                b.journey_date as "journeyDate",
                b.number_of_seats as "numberOfSeats",
                b.seat_numbers as "seatNumbers",
                b.total_amount as "totalAmount",
                b.booking_status as "bookingStatus",
                b.passenger_name as "passengerName",
                b.passenger_phone as "passengerPhone",
                b.passenger_email as "passengerEmail",
                b.pickup_point as "pickupPoint",
                b.drop_point as "dropPoint",
                b.special_requests as "specialRequests",
                b.created_at as "createdAt",
                b.updated_at as "updatedAt",
                
                -- Bus schedule details
                bs.departure_time as "departureTime",
                bs.arrival_time as "arrivalTime",
                bs.base_fare as "baseFare",
                
                -- Bus details
                bus.bus_number as "busNumber",
                bus.bus_type as "busType",
                bus.total_seats as "totalSeats",
                bus.amenities,
                
                -- Vendor details
                v.company_name as "vendorName",
                v.contact_phone as "vendorPhone",
                
                -- Route details
                r.origin,
                r.destination,
                r.distance_km as "distanceKm",
                r.duration_hours as "durationHours",
                
                -- Payment details
                p.payment_method as "paymentMethod",
                p.payment_status as "paymentStatus",
                p.paid_at as "paidAt",
                
                -- Ticket details
                t.ticket_number as "ticketNumber",
                t.qr_code_url as "qrCodeUrl"
                
            FROM bookings b
            LEFT JOIN bus_schedules bs ON b.schedule_id = bs.id
            LEFT JOIN buses bus ON bs.bus_id = bus.id
            LEFT JOIN vendors v ON bus.vendor_id = v.id
            LEFT JOIN routes r ON bs.route_id = r.id
            LEFT JOIN payments p ON b.id = p.booking_id
            LEFT JOIN tickets t ON b.id = t.booking_id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
        """
        
        bookings = await database.fetch_all(query, user_id)
        
        # Convert to list of dictionaries
        bookings_list = []
        for booking in bookings:
            booking_dict = dict(booking)
            
            # Format dates
            if booking_dict.get('journeyDate'):
                booking_dict['journeyDate'] = booking_dict['journeyDate'].isoformat()
            if booking_dict.get('createdAt'):
                booking_dict['createdAt'] = booking_dict['createdAt'].isoformat()
            if booking_dict.get('updatedAt'):
                booking_dict['updatedAt'] = booking_dict['updatedAt'].isoformat()
            if booking_dict.get('paidAt'):
                booking_dict['paidAt'] = booking_dict['paidAt'].isoformat()
            
            bookings_list.append(booking_dict)
        
        return {
            "status": "success",
            "data": {
                "bookings": bookings_list,
                "totalBookings": len(bookings_list)
            },
            "message": f"Found {len(bookings_list)} booking(s)"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bookings: {str(e)}"
        )


@router.get("/my-bookings/{booking_id}")
async def get_booking_details(
    booking_id: int,
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get detailed information about a specific booking
    Only the owner can view their booking details
    """
    try:
        user_id = current_user.get("id")
        
        query = """
            SELECT 
                b.*,
                bs.departure_time,
                bs.arrival_time,
                bus.bus_number,
                bus.bus_type,
                v.company_name as vendor_name,
                r.origin,
                r.destination,
                p.payment_method,
                p.payment_status,
                t.ticket_number,
                t.qr_code_url
            FROM bookings b
            LEFT JOIN bus_schedules bs ON b.schedule_id = bs.id
            LEFT JOIN buses bus ON bs.bus_id = bus.id
            LEFT JOIN vendors v ON bus.vendor_id = v.id
            LEFT JOIN routes r ON bs.route_id = r.id
            LEFT JOIN payments p ON b.id = p.booking_id
            LEFT JOIN tickets t ON b.id = t.booking_id
            WHERE b.id = $1 AND b.user_id = $2
        """
        
        booking = await database.fetch_one(query, booking_id, user_id)
        
        if not booking:
            raise NotFoundException("Booking not found or access denied")
        
        return {
            "status": "success",
            "data": {"booking": dict(booking)},
            "message": "Booking details retrieved successfully"
        }
        
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch booking details: {str(e)}"
        )


@router.post("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Cancel a booking
    Only pending or confirmed bookings can be cancelled
    """
    try:
        user_id = current_user.get("id")
        
        # Check if booking exists and belongs to user
        check_query = """
            SELECT id, booking_status, journey_date, total_amount
            FROM bookings
            WHERE id = $1 AND user_id = $2
        """
        
        booking = await database.fetch_one(check_query, booking_id, user_id)
        
        if not booking:
            raise NotFoundException("Booking not found or access denied")
        
        # Check if booking can be cancelled
        if booking['booking_status'] not in ['pending', 'confirmed']:
            raise BadRequestException(
                f"Cannot cancel booking with status: {booking['booking_status']}"
            )
        
        # Check if journey date is in the past
        if booking['journey_date'] < date.today():
            raise BadRequestException("Cannot cancel past bookings")
        
        # Update booking status
        update_query = """
            UPDATE bookings
            SET booking_status = 'cancelled',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        """
        
        updated_booking = await database.fetch_one(update_query, booking_id)
        
        # TODO: Process refund if payment was made
        # TODO: Release seats back to available pool
        # TODO: Send cancellation notification
        
        return {
            "status": "success",
            "data": {"booking": dict(updated_booking)},
            "message": "Booking cancelled successfully"
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel booking: {str(e)}"
        )


@router.get("/upcoming")
async def get_upcoming_bookings(
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get upcoming bookings for the current user
    Only confirmed bookings with future journey dates
    """
    try:
        user_id = current_user.get("id")
        
        query = """
            SELECT 
                b.*,
                bs.departure_time,
                bus.bus_number,
                bus.bus_type,
                v.company_name as vendor_name,
                r.origin,
                r.destination
            FROM bookings b
            JOIN bus_schedules bs ON b.schedule_id = bs.id
            JOIN buses bus ON bs.bus_id = bus.id
            JOIN vendors v ON bus.vendor_id = v.id
            JOIN routes r ON bs.route_id = r.id
            WHERE b.user_id = $1
              AND b.booking_status = 'confirmed'
              AND b.journey_date >= CURRENT_DATE
            ORDER BY b.journey_date ASC, bs.departure_time ASC
        """
        
        bookings = await database.fetch_all(query, user_id)
        
        return {
            "status": "success",
            "data": {
                "bookings": [dict(b) for b in bookings],
                "count": len(bookings)
            },
            "message": f"Found {len(bookings)} upcoming booking(s)"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch upcoming bookings: {str(e)}"
        )


@router.get("/history")
async def get_booking_history(
    current_user: Dict = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Get paginated booking history for the current user
    """
    try:
        user_id = current_user.get("id")
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM bookings WHERE user_id = $1"
        total_result = await database.fetch_one(count_query, user_id)
        total_bookings = total_result['total']
        
        # Get paginated bookings
        query = """
            SELECT 
                b.*,
                bs.departure_time,
                bus.bus_number,
                bus.bus_type,
                v.company_name as vendor_name,
                r.origin,
                r.destination,
                p.payment_status
            FROM bookings b
            LEFT JOIN bus_schedules bs ON b.schedule_id = bs.id
            LEFT JOIN buses bus ON bs.bus_id = bus.id
            LEFT JOIN vendors v ON bus.vendor_id = v.id
            LEFT JOIN routes r ON bs.route_id = r.id
            LEFT JOIN payments p ON b.id = p.booking_id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3
        """
        
        bookings = await database.fetch_all(query, user_id, limit, offset)
        
        return {
            "status": "success",
            "data": {
                "bookings": [dict(b) for b in bookings],
                "pagination": {
                    "total": total_bookings,
                    "limit": limit,
                    "offset": offset,
                    "hasMore": (offset + limit) < total_bookings
                }
            },
            "message": "Booking history retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch booking history: {str(e)}"
        )
