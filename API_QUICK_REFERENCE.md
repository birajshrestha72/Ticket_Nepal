# API Quick Reference - Ticket Nepal Backend

## 🚀 Server Status
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs
- **Database:** PostgreSQL (ticket_nepal)

---

## 📋 New Endpoints Summary

### Bookings API

#### Create Booking
```http
POST /api/v1/bookings/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "scheduleId": 1,
  "seatNumbers": ["A1", "A2"],
  "passengerName": "John Doe",
  "passengerEmail": "john@example.com",
  "passengerPhone": "9841234567",
  "passengerAge": 30,
  "totalAmount": 2500.00,
  "paymentMethod": "eSewa",
  "paymentStatus": "completed"
}
```

**Returns:** Booking object with `bookingId` and `bookingReference` (TN20240115ABC12345)

---

#### Get Eligible Reviews
```http
GET /api/v1/bookings/eligible-for-review
Authorization: Bearer <token>
```

**Returns:** Array of completed bookings eligible for review (24+ hours after journey)

---

### Reviews API

#### Create Review
```http
POST /api/v1/reviews/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": 1,
  "busId": 1,
  "vendorId": 1,
  "overallRating": 5,          // Required (1-5)
  "cleanlinessRating": 5,      // Optional (0-5)
  "punctualityRating": 4,      // Optional (0-5)
  "driverBehaviorRating": 5,   // Optional (0-5)
  "comfortRating": 4,          // Optional (0-5)
  "safetyRating": 5,           // Optional (0-5)
  "comment": "Great service!"  // Optional (max 1000 chars)
}
```

**Returns:** Created review object + updated bus/vendor ratings

---

#### Get Bus Reviews
```http
GET /api/v1/reviews/bus/{bus_id}?limit=10&offset=0
Authorization: Bearer <token>
```

**Returns:** Paginated reviews with average ratings for 6 categories

---

#### Get Vendor Reviews
```http
GET /api/v1/reviews/vendor/{vendor_id}?limit=10&offset=0
Authorization: Bearer <token>
```

**Returns:** Paginated reviews across all vendor's buses with statistics

---

## 🔐 Authentication

All endpoints require Bearer token from login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Returns:** 
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJ...",
  "token_type": "bearer"
}
```

Use token in headers:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJ...
```

---

## 🎯 Complete User Flow

### Booking Flow
1. **Search Buses** → `GET /api/v1/buses/search`
2. **Select Seats** → Frontend (Booking.jsx)
3. **Review Bill** → Frontend (BookingBill.jsx)
4. **Payment** → Frontend payment simulation
5. **Create Booking** → `POST /api/v1/bookings/create` ✅
6. **Show Success** → Frontend (BookingSuccess.jsx)

### Review Flow
1. **Check Eligible** → `GET /api/v1/bookings/eligible-for-review` ✅
2. **Filter 24hr** → Frontend (ReviewNotification.jsx)
3. **Submit Review** → `POST /api/v1/reviews/create` ✅
4. **Update Ratings** → Automatic backend aggregation

---

## ⚡ Key Features

### Booking Creation
- ✅ Unique reference generation (TN{date}{uuid})
- ✅ Seat conflict checking
- ✅ Atomic transaction (booking + payment + ticket)
- ✅ Auto-status based on payment

### Review System
- ✅ 24-hour eligibility rule (SQL-based)
- ✅ 6-rating system (overall + 5 categories)
- ✅ Duplicate prevention
- ✅ Ownership validation
- ✅ Auto-rating aggregation

---

## 🛠️ Development Commands

```bash
# Start backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Start frontend
cd bus-ticketing-frontend
npm run dev

# Check logs
tail -f /tmp/backend.log

# Test endpoint
curl http://localhost:8000/health
```

---

## 📊 Database Tables

### Main Tables
- `bookings` - Booking records
- `bus_schedules` - Schedule data
- `buses` - Bus info + rating
- `vendors` - Vendor info + rating
- `reviews` - Customer reviews (6 ratings)
- `payments` - Payment records
- `tickets` - Generated tickets

### Important Relationships
- Booking → Schedule → Bus → Vendor
- Review → Booking (one-to-one)
- Review → Bus/Vendor (for ratings)

---

## ✅ Validation Rules

### Booking
- Schedule must exist and be active
- Seats must not be already booked
- Payment status: "pending" | "completed" | "failed"

### Review
- Booking must be 'completed' status
- Journey date must be 24+ hours ago
- User must own the booking
- One review per booking only
- Overall rating: 1-5 (required)
- Category ratings: 0-5 (optional, 0 = not rated)

---

## 🎨 Frontend Integration

### State Passing Pattern
```javascript
// Booking.jsx
navigate('/booking-bill', { state: { bookingData } });

// BookingBill.jsx
navigate('/payment', { state: { bookingData } });

// Payment.jsx
await createBooking(bookingData);
navigate('/booking-success', { state: { bookingId, bookingData } });
```

### API Call Pattern
```javascript
const response = await fetch('http://localhost:8000/api/v1/bookings/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(bookingData)
});
```

---

## 🔍 Testing Checklist

- [ ] Login and get token
- [ ] Create booking with multiple seats
- [ ] Verify seat conflict prevention
- [ ] Check booking reference format
- [ ] Wait 24+ hours after journey (or modify test data)
- [ ] Get eligible reviews
- [ ] Submit review with all ratings
- [ ] Verify duplicate prevention
- [ ] Check bus rating updated
- [ ] Check vendor rating updated
- [ ] Paginate through reviews

---

## 🐛 Common Issues

### "Address already in use"
```bash
lsof -ti:8000 | xargs kill -9
```

### "Could not import module main"
```bash
cd /Users/biraj/Ticket_Nepal/backend
python -m uvicorn main:app --reload
```

### Frontend not loading
```bash
cd /Users/biraj/Ticket_Nepal/bus-ticketing-frontend
npm run dev
```

### Database connection failed
```bash
# Check Postgres.app is running
# Verify ticket_nepal database exists
psql -U postgres -d ticket_nepal -c "SELECT version();"
```

---

**Quick Start:**
```bash
# Terminal 1: Backend
cd /Users/biraj/Ticket_Nepal/backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd /Users/biraj/Ticket_Nepal/bus-ticketing-frontend
npm run dev

# Open browser: http://localhost:5173
# API Docs: http://localhost:8000/docs
```
