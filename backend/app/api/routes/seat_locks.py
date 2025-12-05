"""
Seat Locking API Routes
Handles temporary seat reservation during booking process
Prevents race conditions and double bookings
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import uuid

from app.config.database import database
from app.core.dependencies import get_current_user
from app.core.exceptions import BadRequestException, NotFoundException

router = APIRouter()


# Request Models
class LockSeatsRequest(BaseModel):
    scheduleId: int
    journeyDate: str  # YYYY-MM-DD
    seatNumbers: List[str]
    sessionId: Optional[str] = None  # Optional, will generate if not provided


class UnlockSeatsRequest(BaseModel):
    scheduleId: int
    journeyDate: str
    seatNumbers: List[str]
    sessionId: str


@router.post("/lock")
async def lock_seats(
    lock_data: LockSeatsRequest,
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Lock seats temporarily (10 minutes) during booking process
    
    Flow:
    1. Check if seats are already booked (confirmed bookings)
    2. Check if seats are locked by someone else
    3. If locked by same session, extend lock
    4. Create new locks for available seats
    
    Returns:
    - List of successfully locked seats
    - List of unavailable seats (with reasons)
    """
    try:
        user_id = current_user.get("id")
        
        # Generate or use provided session ID
        session_id = lock_data.sessionId or str(uuid.uuid4())
        
        # Validate date
        try:
            journey_date = datetime.strptime(lock_data.journeyDate, '%Y-%m-%d').date()
        except ValueError:
            raise BadRequestException("Invalid date format. Use YYYY-MM-DD")
        
        # Validate schedule exists
        schedule_check = await database.fetch_one(
            "SELECT schedule_id FROM bus_schedules WHERE schedule_id = $1 AND is_active = true",
            lock_data.scheduleId
        )
        
        if not schedule_check:
            raise NotFoundException("Schedule not found or inactive")
        
        # Clean expired locks first
        await database.execute(
            "DELETE FROM seat_locks WHERE expires_at < CURRENT_TIMESTAMP"
        )
        
        # Check for confirmed bookings
        booked_seats_query = """
            SELECT seat_numbers
            FROM bookings
            WHERE schedule_id = $1
              AND journey_date = $2
              AND booking_status IN ('confirmed', 'completed')
        """
        
        booked_records = await database.fetch_all(
            booked_seats_query,
            lock_data.scheduleId,
            journey_date
        )
        
        # Flatten booked seats
        confirmed_booked = []
        for record in booked_records:
            if record['seat_numbers']:
                confirmed_booked.extend(record['seat_numbers'])
        
        # Check existing locks
        existing_locks_query = """
            SELECT seat_number, session_id, expires_at
            FROM seat_locks
            WHERE schedule_id = $1
              AND journey_date = $2
              AND seat_number = ANY($3)
              AND expires_at > CURRENT_TIMESTAMP
        """
        
        existing_locks = await database.fetch_all(
            existing_locks_query,
            lock_data.scheduleId,
            journey_date,
            lock_data.seatNumbers
        )
        
        # Categorize seats
        locked_seats = []
        unavailable_seats = []
        
        for seat in lock_data.seatNumbers:
            # Check if confirmed booked
            if seat in confirmed_booked:
                unavailable_seats.append({
                    "seatNumber": seat,
                    "reason": "already_booked",
                    "message": "Seat is already booked"
                })
                continue
            
            # Check if locked by someone else
            existing_lock = next((lock for lock in existing_locks if lock['seat_number'] == seat), None)
            
            if existing_lock:
                if existing_lock['session_id'] == session_id:
                    # Extend our own lock
                    await database.execute(
                        """
                        UPDATE seat_locks
                        SET expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes',
                            locked_at = CURRENT_TIMESTAMP
                        WHERE schedule_id = $1
                          AND journey_date = $2
                          AND seat_number = $3
                          AND session_id = $4
                        """,
                        lock_data.scheduleId,
                        journey_date,
                        seat,
                        session_id
                    )
                    locked_seats.append(seat)
                else:
                    unavailable_seats.append({
                        "seatNumber": seat,
                        "reason": "locked_by_other",
                        "message": f"Seat is locked by another user (expires: {existing_lock['expires_at']})"
                    })
            else:
                # Create new lock
                try:
                    await database.execute(
                        """
                        INSERT INTO seat_locks (
                            schedule_id, journey_date, seat_number, user_id, session_id, expires_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, CURRENT_TIMESTAMP + INTERVAL '10 minutes'
                        )
                        ON CONFLICT (schedule_id, journey_date, seat_number)
                        DO UPDATE SET
                            expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes',
                            locked_at = CURRENT_TIMESTAMP,
                            session_id = EXCLUDED.session_id
                        WHERE seat_locks.session_id = EXCLUDED.session_id
                        """,
                        lock_data.scheduleId,
                        journey_date,
                        seat,
                        user_id,
                        session_id
                    )
                    locked_seats.append(seat)
                except Exception as e:
                    unavailable_seats.append({
                        "seatNumber": seat,
                        "reason": "error",
                        "message": f"Failed to lock seat: {str(e)}"
                    })
        
        return {
            "status": "success",
            "data": {
                "sessionId": session_id,
                "lockedSeats": locked_seats,
                "unavailableSeats": unavailable_seats,
                "expiresIn": 600,  # 10 minutes in seconds
                "expiresAt": (datetime.now() + timedelta(minutes=10)).isoformat()
            },
            "message": f"Successfully locked {len(locked_seats)} seat(s)"
        }
        
    except (BadRequestException, NotFoundException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to lock seats: {str(e)}"
        )


@router.post("/unlock")
async def unlock_seats(
    unlock_data: UnlockSeatsRequest,
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Unlock seats (release temporary lock)
    Only the session that locked the seats can unlock them
    """
    try:
        # Validate date
        try:
            journey_date = datetime.strptime(unlock_data.journeyDate, '%Y-%m-%d').date()
        except ValueError:
            raise BadRequestException("Invalid date format. Use YYYY-MM-DD")
        
        # Delete locks for this session
        result = await database.execute(
            """
            DELETE FROM seat_locks
            WHERE schedule_id = $1
              AND journey_date = $2
              AND seat_number = ANY($3)
              AND session_id = $4
            """,
            unlock_data.scheduleId,
            journey_date,
            unlock_data.seatNumbers,
            unlock_data.sessionId
        )
        
        return {
            "status": "success",
            "data": {
                "unlockedCount": result
            },
            "message": f"Successfully unlocked {result} seat(s)"
        }
        
    except BadRequestException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlock seats: {str(e)}"
        )


@router.get("/check")
async def check_seat_locks(
    schedule_id: int,
    journey_date: str,
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Check which seats are currently locked for a schedule
    Returns active locks (non-expired)
    """
    try:
        # Validate date
        try:
            date_obj = datetime.strptime(journey_date, '%Y-%m-%d').date()
        except ValueError:
            raise BadRequestException("Invalid date format. Use YYYY-MM-DD")
        
        # Clean expired locks first
        await database.execute(
            "DELETE FROM seat_locks WHERE expires_at < CURRENT_TIMESTAMP"
        )
        
        # Get active locks
        locks_query = """
            SELECT 
                seat_number as "seatNumber",
                session_id as "sessionId",
                locked_at as "lockedAt",
                expires_at as "expiresAt",
                EXTRACT(EPOCH FROM (expires_at - CURRENT_TIMESTAMP)) as "secondsRemaining"
            FROM seat_locks
            WHERE schedule_id = $1
              AND journey_date = $2
              AND expires_at > CURRENT_TIMESTAMP
            ORDER BY seat_number
        """
        
        locks = await database.fetch_all(locks_query, schedule_id, date_obj)
        
        return {
            "status": "success",
            "data": {
                "locks": [dict(lock) for lock in locks],
                "totalLocked": len(locks)
            }
        }
        
    except BadRequestException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check locks: {str(e)}"
        )


@router.delete("/cleanup")
async def cleanup_expired_locks() -> Dict[str, Any]:
    """
    Manually trigger cleanup of expired locks
    Usually runs automatically, but can be called for maintenance
    """
    try:
        result = await database.execute(
            "DELETE FROM seat_locks WHERE expires_at < CURRENT_TIMESTAMP"
        )
        
        return {
            "status": "success",
            "data": {
                "deletedCount": result
            },
            "message": f"Cleaned up {result} expired lock(s)"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup locks: {str(e)}"
        )
