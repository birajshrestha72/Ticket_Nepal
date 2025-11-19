"""
Bookings API Routes
Handles booking management, retrieval, and customer booking history
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel, EmailStr, Field
import uuid

from app.config.database import database
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


# Request Models
class CreateBookingRequest(BaseModel):
    scheduleId: int
    journeyDate: str  # ISO date string
    numberOfSeats: int = Field(ge=1, le=10)
    seatNumbers: List[str]
    passengerName: str
    passengerPhone: str
    passengerEmail: EmailStr
    pickupPoint: str
    dropPoint: str
    specialRequests: Optional[str] = None
    totalAmount: float
    paymentMethod: str
    paymentStatus: str = "paid"


@router.post("/create")
async def create_booking(
    booking_data: CreateBookingRequest,
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new booking after payment verification
    """
    try:
        user_id = current_user.get("id")
        
        # Generate unique booking reference
        booking_reference = f"TN{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"
        
        # Validate schedule exists and is active
        schedule_query = """
            SELECT bs.*, bus.vendor_id, bus.bus_number, bus.bus_type
            FROM bus_schedules bs
            JOIN buses bus ON bs.bus_id = bus.id
            WHERE bs.id = $1 AND bs.is_active = true
        """
        schedule = await database.fetch_one(schedule_query, booking_data.scheduleId)
        
        if not schedule:
            raise NotFoundException("Bus schedule not found or inactive")
        
        # Check seat availability (in production, implement proper seat locking)
        # For now, we'll just check if seats are not already booked
        seat_check_query = """
            SELECT seat_numbers
            FROM bookings
            WHERE schedule_id = $1
              AND journey_date = $2
              AND booking_status IN ('confirmed', 'pending')
        """
        existing_bookings = await database.fetch_all(
            seat_check_query,
            booking_data.scheduleId,
            booking_data.journeyDate
        )
        
        # Flatten booked seats
        booked_seats = []
        for booking in existing_bookings:
            if booking['seat_numbers']:
                booked_seats.extend(booking['seat_numbers'])
        
        # Check for conflicts
        conflicts = set(booking_data.seatNumbers) & set(booked_seats)
        if conflicts:
            raise BadRequestException(f"Seats already booked: {', '.join(conflicts)}")
        
        # Create booking
        booking_insert_query = """
            INSERT INTO bookings (
                user_id, schedule_id, booking_reference, journey_date,
                number_of_seats, seat_numbers, passenger_name, passenger_phone,
                passenger_email, pickup_point, drop_point, special_requests,
                total_amount, booking_status, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING *
        """
        
        new_booking = await database.fetch_one(
            booking_insert_query,
            user_id,
            booking_data.scheduleId,
            booking_reference,
            booking_data.journeyDate,
            booking_data.numberOfSeats,
            booking_data.seatNumbers,
            booking_data.passengerName,
            booking_data.passengerPhone,
            booking_data.passengerEmail,
            booking_data.pickupPoint,
            booking_data.dropPoint,
            booking_data.specialRequests,
            booking_data.totalAmount,
            'confirmed' if booking_data.paymentStatus == 'paid' else 'pending'
        )
        
        booking_id = new_booking['id']
        
        # Create payment record
        payment_insert_query = """
            INSERT INTO payments (
                booking_id, payment_method, amount, payment_status,
                paid_at, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id
        """
        
        await database.execute(
            payment_insert_query,
            booking_id,
            booking_data.paymentMethod,
            booking_data.totalAmount,
            booking_data.paymentStatus,
            datetime.now() if booking_data.paymentStatus == 'paid' else None
        )
        
        # Generate ticket
        ticket_number = f"TKT{booking_reference}"
        ticket_insert_query = """
            INSERT INTO tickets (
                booking_id, ticket_number, created_at, updated_at
            ) VALUES (
                $1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id, ticket_number
        """
        
        ticket = await database.fetch_one(ticket_insert_query, booking_id, ticket_number)
        
        # TODO: Generate QR code and save URL
        # TODO: Send confirmation email
        # TODO: Send SMS notification
        
        return {
            "status": "success",
            "data": {
                "booking": {
                    "id": booking_id,
                    "booking_reference": booking_reference,
                    "ticket_number": ticket['ticket_number'],
                    **dict(new_booking)
                }
            },
            "message": "Booking created successfully"
        }
        
    except (NotFoundException, BadRequestException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create booking: {str(e)}"
        )


@router.get("/eligible-for-review")
async def get_eligible_for_review(
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get bookings eligible for review (completed + 24 hours after journey)
    """
    try:
        user_id = current_user.get("id")
        
        query = """
            SELECT 
                b.id,
                b.booking_reference as "bookingReference",
                b.journey_date as "journeyDate",
                b.seat_numbers as "seatNumbers",
                b.booking_status as "bookingStatus",
                bs.departure_time as "departureTime",
                bus.id as "busId",
                bus.bus_number as "busNumber",
                bus.bus_type as "busType",
                v.id as "vendorId",
                v.company_name as "vendorName",
                r.origin as "pickupPoint",
                r.destination as "dropPoint",
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM reviews 
                        WHERE booking_id = b.id
                    ) THEN true
                    ELSE false
                END as "hasReview"
            FROM bookings b
            JOIN bus_schedules bs ON b.schedule_id = bs.id
            JOIN buses bus ON bs.bus_id = bus.id
            JOIN vendors v ON bus.vendor_id = v.id
            JOIN routes r ON bs.route_id = r.id
            WHERE b.user_id = $1
              AND b.booking_status = 'completed'
              AND b.journey_date <= CURRENT_DATE - INTERVAL '1 day'
            ORDER BY b.journey_date DESC
        """
        
        bookings = await database.fetch_all(query, user_id)
        
        bookings_list = []
        for booking in bookings:
            booking_dict = dict(booking)
            if booking_dict.get('journeyDate'):
                booking_dict['journeyDate'] = booking_dict['journeyDate'].isoformat()
            bookings_list.append(booking_dict)
        
        return {
            "status": "success",
            "data": {
                "bookings": bookings_list,
                "count": len(bookings_list)
            },
            "message": f"Found {len(bookings_list)} booking(s) eligible for review"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch eligible bookings: {str(e)}"
        )


# Request Models
class CreateBookingRequest(BaseModel):
    scheduleId: int
    journeyDate: str  # ISO date string
    numberOfSeats: int = Field(ge=1, le=10)
    seatNumbers: List[str]
    passengerName: str
    passengerPhone: str
    passengerEmail: EmailStr
    pickupPoint: str
    dropPoint: str
    specialRequests: Optional[str] = None
    totalAmount: float
    paymentMethod: str
    paymentStatus: str = "paid"


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
