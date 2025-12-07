"""
Bookings API Routes
Handles booking management, retrieval, and customer booking history
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel, EmailStr, Field
import uuid

from app.config.database import database
from app.core.dependencies import get_current_user, require_role
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
    Enhanced validations:
    - Schedule existence and status
    - Journey date validation
    - Seat availability check
    - Seat number format validation
    - Payment status verification
    """
    try:
        user_id = current_user.get("id")
        
        # Validate journey date is not in the past
        try:
            journey_date = datetime.strptime(booking_data.journeyDate, '%Y-%m-%d').date()
            if journey_date < date.today():
                raise BadRequestException("Cannot book for past dates")
        except ValueError:
            raise BadRequestException("Invalid date format. Use YYYY-MM-DD")
        
        # Validate seat numbers format (should be alphanumeric, e.g., A1, B2)
        for seat in booking_data.seatNumbers:
            if not seat or len(seat) > 10:
                raise BadRequestException(f"Invalid seat number format: {seat}")
        
        # Validate number of seats matches seat numbers array length
        if len(booking_data.seatNumbers) != booking_data.numberOfSeats:
            raise BadRequestException("Number of seats does not match selected seat numbers")
        
        # Validate payment method
        valid_payment_methods = ['khalti', 'esewa', 'cash', 'card']
        if booking_data.paymentMethod.lower() not in valid_payment_methods:
            raise BadRequestException(f"Invalid payment method. Must be one of: {', '.join(valid_payment_methods)}")
        
        # Validate payment status
        valid_payment_statuses = ['paid', 'pending', 'failed']
        if booking_data.paymentStatus.lower() not in valid_payment_statuses:
            raise BadRequestException(f"Invalid payment status. Must be one of: {', '.join(valid_payment_statuses)}")
        
        # Generate unique booking reference
        booking_reference = f"TN{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"
        
        # Validate schedule exists and is active
        schedule_query = """
            SELECT bs.*, bus.vendor_id, bus.bus_number, bus.bus_type, bus.total_seats
            FROM bus_schedules bs
            JOIN buses bus ON bs.bus_id = bus.bus_id
            WHERE bs.schedule_id = $1 AND bs.is_active = true
        """
        schedule = await database.fetch_one(schedule_query, booking_data.scheduleId)
        
        if not schedule:
            raise NotFoundException("Bus schedule not found or inactive")
        
        # Validate total seats doesn't exceed bus capacity
        if booking_data.numberOfSeats > schedule['total_seats']:
            raise BadRequestException(f"Cannot book {booking_data.numberOfSeats} seats. Bus capacity is {schedule['total_seats']}")
        
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
            journey_date
        )
        
        # Flatten booked seats
        booked_seats = []
        for booking in existing_bookings:
            if booking['seat_numbers']:
                booked_seats.extend(booking['seat_numbers'])
        
        # Check for conflicts
        conflicts = set(booking_data.seatNumbers) & set(booked_seats)
        if conflicts:
            raise BadRequestException(f"Seats already booked: {', '.join(sorted(conflicts))}. Please select different seats.")
        
        # Validate total amount calculation
        # In production, fetch actual price from schedule
        # For now, just ensure amount is positive
        if booking_data.totalAmount <= 0:
            raise BadRequestException("Total amount must be greater than zero")
        
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
            journey_date,
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
    Get bookings eligible for review (completed + 24 hours after ride start time)
    Ride start time = journey_date + departure_time
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
              AND (b.journey_date + bs.departure_time) <= (CURRENT_TIMESTAMP - INTERVAL '24 hours')
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
        # Handle both Firebase tokens (uid) and JWT tokens (id)
        uid = current_user.get("uid")
        user_id = current_user.get("id")
        email = current_user.get("email")
        
        # Get actual user_id from database if we have Firebase UID
        if uid and not user_id:
            user_record = await database.fetch_one(
                "SELECT user_id FROM users WHERE firebase_uid = $1 OR email = $2",
                uid, email
            )
            if user_record:
                user_id = user_record["user_id"]
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        # Query to fetch all bookings for the user with related data
        query = """
            SELECT 
                b.booking_id as id,
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
                bs.price as "price",
                
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
                r.estimated_duration_minutes as "estimatedDurationMinutes",
                
                -- Payment details
                p.payment_method as "paymentMethod",
                p.payment_status as "paymentStatus",
                p.paid_at as "paidAt",
                
                -- Ticket details
                t.ticket_number as "ticketNumber",
                t.qr_code_url as "qrCodeUrl"
                
            FROM bookings b
            LEFT JOIN bus_schedules bs ON b.schedule_id = bs.schedule_id
            LEFT JOIN buses bus ON bs.bus_id = bus.bus_id
            LEFT JOIN vendors v ON bus.vendor_id = v.vendor_id
            LEFT JOIN routes r ON bs.route_id = r.route_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            LEFT JOIN tickets t ON b.booking_id = t.booking_id
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
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in get_my_bookings: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
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
            LEFT JOIN bus_schedules bs ON b.schedule_id = bs.schedule_id
            LEFT JOIN buses bus ON bs.bus_id = bus.bus_id
            LEFT JOIN vendors v ON bus.vendor_id = v.vendor_id
            LEFT JOIN routes r ON bs.route_id = r.route_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            LEFT JOIN tickets t ON b.booking_id = t.booking_id
            WHERE b.booking_id = $1 AND b.user_id = $2
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


@router.get("/vendor/all")
async def get_vendor_bookings(
    current_user: Dict = Depends(require_role("vendor", "system_admin")),
    status_filter: Optional[str] = Query(None, description="Filter by status", alias="status"),
    bus_id: Optional[int] = Query(None, description="Filter by bus"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
) -> Dict[str, Any]:
    """
    Get all bookings for vendor's buses
    Vendors can see bookings for all their buses
    """
    try:
        print(f"🔍 get_vendor_bookings called")
        print(f"👤 Current user: {current_user}")
        print(f"🆔 User ID: {current_user.get('id')}")
        print(f"👔 User Role: {current_user.get('role')}")
        
        # Get vendor_id from vendors table
        vendor_id = None
        if current_user.get('role') == 'vendor':
            vendor_query = """
                SELECT vendor_id FROM vendors WHERE user_id = $1
            """
            vendor_result = await database.fetch_one(vendor_query, current_user.get('id'))
            if vendor_result:
                vendor_id = vendor_result['vendor_id']
            print(f"🔍 Vendor lookup: user_id={current_user.get('id')}, vendor_id={vendor_id}")
        
        conditions = []
        params = []
        param_count = 1
        
        # Filter by vendor
        if current_user.get('role') == 'vendor':
            if vendor_id:
                conditions.append(f"v.vendor_id = ${param_count}")
                params.append(vendor_id)
                param_count += 1
            else:
                # No vendor_id found, return empty result
                return {
                    "status": "success",
                    "data": {
                        "bookings": [],
                        "total": 0,
                        "limit": limit,
                        "offset": offset
                    }
                }
        
        # Filter by status
        if status_filter:
            conditions.append(f"b.booking_status = ${param_count}")
            params.append(status_filter)
            param_count += 1
        
        # Filter by bus
        if bus_id:
            conditions.append(f"bus.bus_id = ${param_count}")
            params.append(bus_id)
            param_count += 1
        
        # Filter by date range
        if date_from:
            conditions.append(f"b.journey_date >= ${param_count}")
            # Convert string to date if needed
            try:
                from datetime import datetime
                if isinstance(date_from, str):
                    date_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                    params.append(date_obj)
                else:
                    params.append(date_from)
            except:
                params.append(date_from)
            param_count += 1
        
        if date_to:
            conditions.append(f"b.journey_date <= ${param_count}")
            # Convert string to date if needed
            try:
                from datetime import datetime
                if isinstance(date_to, str):
                    date_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                    params.append(date_obj)
                else:
                    params.append(date_to)
            except:
                params.append(date_to)
            param_count += 1
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
            SELECT 
                b.booking_id,
                b.booking_reference,
                b.user_id,
                b.schedule_id,
                b.seat_numbers,
                b.passenger_name,
                b.passenger_email,
                b.passenger_phone,
                b.journey_date,
                b.total_amount,
                b.booking_status,
                b.created_at,
                u.name as customer_name,
                u.email as customer_email,
                u.phone as customer_phone,
                bus.bus_id,
                bus.bus_number,
                bus.bus_type,
                r.origin,
                r.destination,
                bs.departure_time,
                bs.arrival_time,
                p.payment_method,
                p.payment_status,
                v.company_name as vendor_name
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            JOIN bus_schedules bs ON b.schedule_id = bs.schedule_id
            JOIN buses bus ON bs.bus_id = bus.bus_id
            JOIN routes r ON bs.route_id = r.route_id
            JOIN vendors v ON bus.vendor_id = v.vendor_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            {where_clause}
            ORDER BY b.created_at DESC
            LIMIT ${param_count}
            OFFSET ${param_count + 1}
        """
        
        params.extend([limit, offset])
        print(f"📊 Query params: {params}")
        print(f"🔍 WHERE clause: {where_clause}")
        bookings = await database.fetch_all(query, *params)
        print(f"📦 Bookings found: {len(bookings)}")
        
        # Get total count
        count_params = params[:-2]  # Remove limit and offset
        count_query = f"""
            SELECT COUNT(*) as total
            FROM bookings b
            JOIN bus_schedules bs ON b.schedule_id = bs.schedule_id
            JOIN buses bus ON bs.bus_id = bus.bus_id
            JOIN vendors v ON bus.vendor_id = v.vendor_id
            {where_clause}
        """
        total = await database.fetch_one(count_query, *count_params)
        
        result = []
        for booking in bookings:
            result.append({
                "booking_id": booking['booking_id'],
                "booking_reference": booking['booking_reference'],
                "customer": {
                    "name": booking['customer_name'] or booking['passenger_name'],
                    "email": booking['customer_email'] or booking['passenger_email'],
                    "phone": booking['customer_phone'] or booking['passenger_phone']
                },
                "bus": {
                    "bus_id": booking['bus_id'],
                    "bus_number": booking['bus_number'],
                    "bus_type": booking['bus_type']
                },
                "route": {
                    "origin": booking['origin'],
                    "destination": booking['destination']
                },
                "journey_date": booking['journey_date'].isoformat() if booking['journey_date'] else None,
                "departure_time": str(booking['departure_time'])[:5] if booking['departure_time'] else None,
                "arrival_time": str(booking['arrival_time'])[:5] if booking['arrival_time'] else None,
                "seat_numbers": booking['seat_numbers'] or [],
                "total_amount": float(booking['total_amount']) if booking['total_amount'] else 0.0,
                "payment_method": booking['payment_method'],
                "payment_status": booking['payment_status'],
                "status": booking['booking_status'],
                "created_at": booking['created_at'].isoformat() if booking['created_at'] else None
            })
        
        return {
            "status": "success",
            "data": {
                "bookings": result,
                "total": total['total'] if total else 0,
                "limit": limit,
                "offset": offset
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vendor bookings: {str(e)}"
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
            LEFT JOIN bus_schedules bs ON b.schedule_id = bs.schedule_id
            LEFT JOIN buses bus ON bs.bus_id = bus.bus_id
            LEFT JOIN vendors v ON bus.vendor_id = v.vendor_id
            LEFT JOIN routes r ON bs.route_id = r.route_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
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
