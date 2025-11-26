# Review System - 24-Hour Validation Implementation

## Overview
Implemented a comprehensive review system that enforces a **24-hour waiting period** after the actual ride start time before customers can submit reviews. This ensures reviews are authentic and based on completed journey experiences.

---

## Key Features

### 1. **Precise Time Calculation**
- Uses **ride_start_time = journey_date + departure_time** for accurate validation
- Prevents premature reviews before ride completion
- Ensures consistent 24-hour enforcement regardless of departure time

### 2. **Dual Validation**
- **Backend filtering**: `/bookings/eligible-for-review` only returns bookings ready for review
- **Backend validation**: `/reviews/create` validates 24-hour rule on submission
- Prevents circumventing client-side logic

### 3. **User-Friendly Error Messages**
- Shows remaining wait time: "Please wait X more hour(s)"
- Clear feedback prevents confusion

---

## Implementation Details

### Backend Changes

#### **File: `/backend/app/api/routes/bookings.py`**

**1. Added Missing Imports** (Lines 6, 13):
```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.dependencies import get_current_user, require_role
```

**2. Updated `eligible-for-review` Query** (Lines 177-218):
```python
# Changed from: b.journey_date <= CURRENT_DATE - INTERVAL '1 day'
# Changed to:   (b.journey_date + bs.departure_time) <= (CURRENT_TIMESTAMP - INTERVAL '24 hours')

query = """
    SELECT 
        b.id,
        b.booking_reference,
        b.journey_date,
        bs.departure_time,
        (b.journey_date + bs.departure_time) as ride_start_time,
        -- other fields...
    FROM bookings b
    INNER JOIN bus_schedules bs ON b.schedule_id = bs.id
    WHERE b.user_id = :user_id
        AND b.booking_status = 'completed'
        AND (b.journey_date + bs.departure_time) <= (CURRENT_TIMESTAMP - INTERVAL '24 hours')
        AND b.payment_status = 'completed'
"""
```

**Why this matters:**
- **Old logic**: Only checked if `journey_date` was yesterday or earlier
  - Bug: Bus departing at 10 PM would be reviewable at midnight (2 hours later)
  - Inconsistent: Different wait times based on departure hour
- **New logic**: Calculates exact ride start timestamp
  - Fix: Bus departing at 10 PM requires waiting until 10 PM next day (full 24 hours)
  - Consistent: Same 24-hour wait for all rides

---

#### **File: `/backend/app/api/routes/reviews.py`**

**1. Updated `create_review` Validation** (Lines 41-74):

```python
# Updated booking query to include ride_start_time
query = """
    SELECT 
        b.id,
        b.user_id,
        b.bus_id,
        b.schedule_id,
        bs.vendor_id,
        b.booking_status,
        (b.journey_date + bs.departure_time) as ride_start_time,
        EXISTS(
            SELECT 1 FROM reviews r 
            WHERE r.booking_id = b.id
        ) as has_review
    FROM bookings b
    INNER JOIN bus_schedules bs ON b.schedule_id = bs.id
    WHERE b.id = :booking_id
"""

# Added 24-hour validation logic
ride_start_time = booking['ride_start_time']
hours_since_ride = (datetime.now() - ride_start_time).total_seconds() / 3600

if hours_since_ride < 24:
    hours_remaining = 24 - hours_since_ride
    raise BadRequestException(
        f"Reviews can only be submitted 24 hours after ride completion. "
        f"Please wait {int(hours_remaining)} more hour(s)."
    )
```

**Key Improvements:**
- Calculates exact hours since ride start using Python datetime
- Blocks review submission if less than 24 hours have passed
- Shows user-friendly error with remaining wait time
- Prevents API abuse (direct API calls bypassing UI)

---

### Frontend Changes

#### **File: `/bus-ticketing-frontend/src/pages/customer/ReviewNotification.jsx`**

**1. Simplified Eligible Bookings Logic** (Lines 63-70):
```javascript
// BEFORE: Client-side filtering with departure time calculation
const filtered = (data.data.bookings || []).filter(booking => {
  const departureDateTime = new Date(`${booking.journeyDate} ${booking.departureTime}`);
  const completionTime = new Date(departureDateTime.getTime() + 24 * 60 * 60 * 1000);
  return (
    booking.bookingStatus === 'completed' &&
    now >= completionTime &&
    !booking.hasReview
  );
});

// AFTER: Trust backend filtering, only filter reviewed bookings
const bookings = data.data.bookings || [];
const filtered = bookings.filter(booking => !booking.hasReview);
```

**Reasoning:**
- Backend already enforces 24-hour rule accurately
- Avoids timezone issues and client-side clock manipulation
- Simplifies frontend logic

**2. Enhanced Error Handling** (Lines 142-145):
```javascript
// Check response status and show backend error messages
if (response.ok && data.status === 'success') {
  // Success flow
} else {
  // Shows backend error: "Please wait X more hour(s)"
  throw new Error(data.message || 'Failed to submit review');
}
```

**Benefits:**
- Displays precise wait time from backend
- Consistent error messages across all clients
- Better user experience

---

## Review System Architecture

### **Database Schema**

```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE REFERENCES bookings(id),
    user_id INTEGER REFERENCES users(id),
    bus_id INTEGER REFERENCES buses(id),
    vendor_id INTEGER REFERENCES vendors(id),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
    punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
    driver_behavior_rating INTEGER CHECK (driver_behavior_rating BETWEEN 1 AND 5),
    comfort_rating INTEGER CHECK (comfort_rating BETWEEN 1 AND 5),
    safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Constraints:**
- `booking_id UNIQUE`: One review per booking (prevents spam)
- `CHECK (rating BETWEEN 1 AND 5)`: Valid rating range
- `overall_rating + 5 category ratings`: Comprehensive feedback

---

### **API Endpoints**

#### **1. GET `/bookings/eligible-for-review`**
**Purpose**: Fetch completed bookings ready for review

**Authorization**: Requires valid JWT token (user role)

**Response**:
```json
{
  "status": "success",
  "message": "Eligible bookings retrieved successfully",
  "data": {
    "bookings": [
      {
        "id": 123,
        "bookingReference": "BK20241121001",
        "journeyDate": "2024-11-20",
        "departureTime": "10:00:00",
        "busType": "AC Deluxe",
        "busNumber": "BA 2 KHA 1234",
        "vendorName": "ABC Travels",
        "pickupPoint": "Kathmandu",
        "dropPoint": "Pokhara",
        "seatNumbers": ["A1", "A2"],
        "hasReview": false
      }
    ],
    "total": 1
  }
}
```

**Filters Applied (Backend)**:
- `booking_status = 'completed'`
- `payment_status = 'completed'`
- `(journey_date + departure_time) <= (CURRENT_TIMESTAMP - INTERVAL '24 hours')`
- Excludes bookings with existing reviews

---

#### **2. POST `/reviews/create`**
**Purpose**: Submit a review for a completed booking

**Authorization**: Requires valid JWT token (user role)

**Request Body**:
```json
{
  "bookingId": 123,
  "busId": 45,
  "vendorId": 12,
  "overallRating": 5,
  "cleanlinessRating": 5,
  "punctualityRating": 4,
  "driverBehaviorRating": 5,
  "comfortRating": 4,
  "safetyRating": 5,
  "comment": "Excellent service! Very comfortable journey."
}
```

**Validations**:
1. ✅ Booking exists and belongs to current user
2. ✅ Booking status is 'completed'
3. ✅ 24 hours have passed since ride_start_time
4. ✅ No duplicate review for this booking
5. ✅ All ratings are between 1-5

**Success Response**:
```json
{
  "status": "success",
  "message": "Review submitted successfully",
  "data": {
    "reviewId": 789,
    "bookingId": 123
  }
}
```

**Error Response (Too Early)**:
```json
{
  "status": "error",
  "message": "Reviews can only be submitted 24 hours after ride completion. Please wait 5 more hour(s).",
  "code": "BAD_REQUEST"
}
```

---

#### **3. GET `/reviews/bus/{bus_id}`**
**Purpose**: Get all reviews for a specific bus

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "status": "success",
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "id": 789,
        "userName": "John Doe",
        "overallRating": 5,
        "cleanlinessRating": 5,
        "punctualityRating": 4,
        "driverBehaviorRating": 5,
        "comfortRating": 4,
        "safetyRating": 5,
        "comment": "Excellent service!",
        "createdAt": "2024-11-21T10:30:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3
  }
}
```

---

#### **4. GET `/reviews/vendor/{vendor_id}`**
**Purpose**: Get all reviews for a specific vendor (all their buses)

**Query Parameters**: Same as bus reviews

**Response**: Same structure as bus reviews

---

## User Flow

### **Step 1: Complete Journey**
1. User books a bus ticket
2. Journey date arrives, bus departs
3. User travels and completes the journey
4. Booking status changes to `completed`

### **Step 2: Wait 24 Hours**
- System calculates: `ride_start_time = journey_date + departure_time`
- Example: Journey on Nov 20, departure at 10:00 PM
- Review available: Nov 21 at 10:00 PM (24 hours later)

### **Step 3: Review Notification**
1. User navigates to **ReviewNotification** page
2. Frontend calls `/bookings/eligible-for-review`
3. Backend returns only bookings where 24+ hours have passed
4. UI shows list of completed journeys ready for review

### **Step 4: Submit Review**
1. User clicks "✍️ Write Review" on a booking
2. Fills out rating form:
   - ⭐ Overall rating (required)
   - 🧹 Cleanliness (optional)
   - ⏰ Punctuality (optional)
   - 👨‍✈️ Driver Behavior (optional)
   - 💺 Comfort (optional)
   - 🛡️ Safety (optional)
   - 💬 Written comment (optional)
3. Clicks "✅ Submit Review"
4. Frontend calls `/reviews/create`
5. Backend validates 24-hour rule
6. Review saved to database
7. Bus and vendor ratings updated

### **Step 5: Error Handling**
If user somehow attempts to review too early:
- Backend returns: `"Please wait X more hour(s)"`
- Frontend shows error alert
- User cannot submit review

---

## Testing Guide

### **Test Case 1: Review Eligible After 24 Hours**

**Setup:**
```sql
-- Create a completed booking with ride 25 hours ago
INSERT INTO bookings (
    user_id, schedule_id, journey_date, booking_status, payment_status, ...
) VALUES (
    1, 10, CURRENT_DATE - INTERVAL '2 days', 'completed', 'completed', ...
);

-- Bus departs at 10:00 AM, so ride started (CURRENT_DATE - 2 days) + '10:00:00'
-- Current time is 2 days later + 11:00 AM = 49 hours ago
```

**Expected:**
- ✅ Booking appears in `/bookings/eligible-for-review`
- ✅ User can submit review via `/reviews/create`
- ✅ Success message shown

---

### **Test Case 2: Review Blocked Before 24 Hours**

**Setup:**
```sql
-- Create a completed booking with ride 12 hours ago
INSERT INTO bookings (
    user_id, schedule_id, journey_date, booking_status, payment_status, ...
) VALUES (
    1, 10, CURRENT_DATE, 'completed', 'completed', ...
);

-- Bus departed at 10:00 AM today, current time is 10:00 PM (12 hours ago)
```

**Expected:**
- ❌ Booking does NOT appear in `/bookings/eligible-for-review`
- ❌ Direct POST to `/reviews/create` returns error
- ❌ Error message: "Please wait 12 more hour(s)"

---

### **Test Case 3: Duplicate Review Prevention**

**Setup:**
```sql
-- User already submitted review for booking 123
INSERT INTO reviews (booking_id, user_id, ...) VALUES (123, 1, ...);
```

**Expected:**
- ❌ Booking has `hasReview: true` flag
- ❌ Frontend filters it out from review list
- ❌ Direct POST to `/reviews/create` returns error: "Duplicate review"

---

### **Test Case 4: Timezone Edge Cases**

**Scenario**: User's browser timezone differs from server timezone

**Expected:**
- ✅ Backend uses PostgreSQL `CURRENT_TIMESTAMP` (server timezone)
- ✅ Calculation is consistent regardless of client timezone
- ✅ No client-side clock manipulation possible

---

## Security Considerations

### **1. Authorization**
- All review endpoints require JWT authentication
- Users can only review their own bookings
- `user_id` verified against token claims

### **2. Input Validation**
- Rating values: `1-5` (enforced by database constraints)
- Comment length: `1000 characters` (frontend + backend validation)
- Booking ownership: Verified in backend

### **3. Rate Limiting** (Recommended)
- Consider adding rate limits to prevent spam
- Example: Max 10 reviews per hour per user

### **4. SQL Injection Protection**
- All queries use parameterized statements
- User input never directly concatenated into SQL

---

## Future Enhancements

### **1. Review Moderation**
- Admin panel to approve/reject reviews
- Flag inappropriate content
- Auto-moderate offensive language

### **2. Vendor Response**
- Allow vendors to respond to reviews
- Build trust and transparency

### **3. Review Analytics**
- Average ratings dashboard
- Trend analysis (ratings over time)
- Category-wise insights

### **4. Verified Reviews Badge**
- Show "✅ Verified Ride" badge for confirmed bookings
- Increase review credibility

### **5. Photo Uploads**
- Allow users to upload bus photos
- Visual proof of journey experience

---

## Summary

The 24-hour review validation system is now **fully implemented and tested**:

✅ Backend correctly calculates ride_start_time (journey_date + departure_time)  
✅ Backend filters eligible bookings (24+ hours since ride start)  
✅ Backend validates on review submission (prevents API abuse)  
✅ Frontend simplified to trust backend logic  
✅ User-friendly error messages with remaining wait time  
✅ Consistent enforcement regardless of departure time  
✅ Server restarted and running successfully

**Next Steps:**
- Continue with remaining static data conversion (seat availability, landing page stats)
- Implement payment gateway integration (Khalti/eSewa)
- Add PDF invoice generation
- Integrate Firebase authentication
- Add real-time seat locking for concurrent bookings
