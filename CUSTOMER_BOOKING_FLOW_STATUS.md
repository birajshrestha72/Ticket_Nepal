# Customer Booking Flow - Implementation Complete

## ✅ Completed Work

### 1. Search Functionality (Search.jsx)
**Status: FIXED & CONNECTED TO DATABASE**

#### Changes Made:
- **Connected to Schedules API** (`/schedules/available`)
- **Query Parameters:**
  - `origin`: From city
  - `destination`: To city
  - `journey_date`: Selected date (YYYY-MM-DD format)
- **Data Processing:**
  - Groups schedules by bus type
  - Extracts unique vendors
  - Applies price range filters client-side
  - Filters by selected vendor
- **Display:**
  - Shows unique bus types with schedule counts
  - Displays vendor names with ratings
  - Shows price ranges and seat availability
  - Lists 2 quick schedules per bus type
  - "Select from X Buses" button redirects to `/booking` with schedules data

#### API Integration:
```javascript
const response = await fetch(`${API_URL}/schedules/available?${queryParams}`);
// Returns: { status: "success", data: { schedules: [...], total: N } }
```

#### Data Flow:
```
Landing Page (origin, destination, date) 
  → Search Page (/search?from=X&to=Y&date=Z)
  → Fetch /schedules/available
  → Group by bus_type
  → Display cards
  → Click "Select" → /booking (with schedules array)
```

---

### 2. Customer Bookings (MyBookings.jsx)
**Status: FIXED WITH CANCELLATION & REFUND LOGIC**

#### Changes Made:
- **Connected to API** (`/bookings/my-bookings`)
- **Authentication:** Bearer token with 401 redirect to login
- **Cancellation System:**
  - Cancel button visible only for confirmed bookings
  - Can cancel if ≥12 hours before journey
  - Refund calculation:
    * **48+ hours before:** 90% refund
    * **12-48 hours before:** 25% refund
    * **<12 hours:** No refund (button hidden)
- **Cancellation Modal:**
  - Shows booking details summary
  - Displays refund information with percentage
  - Confirmation dialog with "Keep Booking" / "Confirm Cancellation"
  - Calls `/bookings/{booking_id}/cancel` (POST)

#### Refund Calculation Logic:
```javascript
const calculateRefund = (journeyDate, totalAmount) => {
  const hoursUntilJourney = (new Date(journeyDate) - new Date()) / (1000 * 60 * 60);
  
  if (hoursUntilJourney >= 48) return { percentage: 90, amount: totalAmount * 0.9 };
  if (hoursUntilJourney >= 12) return { percentage: 25, amount: totalAmount * 0.25 };
  return { percentage: 0, amount: 0 };
};
```

#### CSS Additions:
- Cancel button styling (`.btn-danger`)
- Modal overlay with backdrop blur
- Cancellation warning banner
- Booking summary section
- Refund info panel (green background)
- Modal animations (slide-in effect)

---

## 🔄 Customer Booking Flow (Current State)

### Complete User Journey:

1. **Landing Page** (`/`)
   - User enters: Origin, Destination, Date
   - Clicks "Search Buses"
   - Redirects to `/search?from=X&to=Y&date=Z`

2. **Search Page** (`/search`) ✅ WORKING
   - Fetches schedules from `/schedules/available`
   - Groups by bus type, shows vendors
   - User selects a bus type
   - Clicks "Select from X Buses" → `/booking` with `state.schedules`

3. **Booking/Seat Selection** (`/booking`) ⚠️ NEEDS UPDATE
   - **Current:** Static seat layout
   - **Required:**
     * Real-time seat status from database
     * Color coding: Available (green), Booked (red), Selected (yellow), Pending (orange)
     * Dynamic seat numbers based on bus configuration
     * Seat locking mechanism during selection
     * Display: Bus info, Route info, Schedule time, Price per seat
   - **Next Step:** User selects seats → "Confirm Booking" → `/booking-bill`

4. **Booking Bill** (`/booking-bill`) ⚠️ NEEDS UPDATE
   - **Required:**
     * Display selected schedule details
     * Show route: Origin → Destination
     * Bus details: Number, Type, Vendor
     * Seat numbers selected
     * Price breakdown: Base fare × seats
     * Total amount calculation
     * "Proceed to Payment" button → `/payment`

5. **Payment Page** (`/payment`) ⚠️ NEEDS INTEGRATION
   - **Required:**
     * Wallet selection: Khalti or eSewa
     * Integration with payment gateway APIs
     * Redirect to wallet's payment page
     * Handle callback/webhook for payment status
     * On success: Call `/bookings/create` API
   - **Backend Endpoint:** `POST /bookings/create`
     ```json
     {
       "scheduleId": 123,
       "journeyDate": "2025-11-25",
       "numberOfSeats": 2,
       "seatNumbers": ["A1", "A2"],
       "passengerName": "John Doe",
       "passengerPhone": "+9779812345678",
       "passengerEmail": "john@example.com",
       "pickupPoint": "Kathmandu",
       "dropPoint": "Pokhara",
       "totalAmount": 3000,
       "paymentMethod": "khalti",
       "paymentStatus": "paid"
     }
     ```

6. **Booking Success** (`/booking-success`) ⚠️ NEEDS UPDATE
   - **Required:**
     * Show success message with booking reference
     * Display ticket number
     * Generate PDF invoice (TODO)
     * Download PDF button
     * Email PDF to customer (TODO)
     * QR code for ticket verification (TODO)
     * "View My Bookings" button → `/bookings`

7. **My Bookings** (`/bookings`) ✅ WORKING
   - Lists all bookings with filters
   - Can cancel with refund calculation
   - Download ticket option (PDF TODO)
   - View details modal

---

## 🚧 Remaining Work

### Priority 1: Seat Selection System

**File: `/bus-ticketing-frontend/src/pages/customer/Booking.jsx`**

#### Requirements:
1. **Receive schedules from Search page** via `location.state.schedules`
2. **Display schedule selection** if multiple schedules passed
3. **Fetch real-time seat availability:**
   ```javascript
   GET /schedules/{schedule_id}/seats?journey_date=2025-11-25
   ```
   Should return:
   ```json
   {
     "status": "success",
     "data": {
       "seats": [
         { "seat_number": "A1", "status": "available" },
         { "seat_number": "A2", "status": "booked" },
         { "seat_number": "A3", "status": "pending" }
       ],
       "bus_layout": { "rows": 10, "columns": 4, "type": "2x2" }
     }
   }
   ```

4. **Seat status colors:**
   - Available: `#4caf50` (green)
   - Booked: `#f44336` (red)
   - Selected (by user): `#ffc107` (yellow)
   - Pending (other users): `#ff9800` (orange)

5. **Real-time updates:** WebSocket or polling every 5 seconds

6. **Seat selection logic:**
   - Click to select/deselect available seats
   - Cannot select booked/pending seats
   - Show selected count and total amount
   - "Confirm Booking" button → `/booking-bill` with selected data

#### Backend Endpoint Needed:
```python
@router.get("/schedules/{schedule_id}/seats")
async def get_seat_availability(
    schedule_id: int,
    journey_date: str
):
    # Query bookings for this schedule + date
    # Return seat status array
    pass
```

---

### Priority 2: Payment Integration

**Files:**
- `/bus-ticketing-frontend/src/pages/customer/Payment.jsx`
- `/backend/app/api/routes/payments.py` (new file)

#### Khalti Integration:
1. **Initialize payment:**
   ```javascript
   POST /payments/khalti/init
   {
     "amount": 3000,
     "booking_reference": "TN20251121ABC123",
     "return_url": "http://localhost:5173/payment/verify"
   }
   ```

2. **Redirect to Khalti** with payment URL

3. **Verify payment callback:**
   ```javascript
   GET /payments/khalti/verify?pidx=abc123&status=Completed
   ```

4. **Update booking status** to confirmed

5. **Generate ticket & invoice**

#### eSewa Integration:
Similar flow with eSewa API endpoints

---

### Priority 3: PDF Invoice Generation

**Backend: `/backend/app/utils/pdf_generator.py`**

#### Requirements:
1. Use library: `reportlab` or `weasyprint`
2. Template with:
   - Ticket Nepal logo
   - Booking reference & ticket number
   - QR code (booking reference encoded)
   - Customer details
   - Bus details (number, type, vendor)
   - Route: Origin → Destination
   - Journey date & time
   - Seat numbers
   - Amount paid & payment method
   - Terms & conditions

3. Store PDF in `/backend/invoices/{booking_reference}.pdf`

4. Return download URL: `/invoices/download/{booking_reference}`

5. Email integration:
   - Use SMTP (Gmail or SendGrid)
   - Attach PDF
   - Send to `passenger_email`

---

### Priority 4: Real-time Seat Locking

**Prevent double booking during seat selection**

#### Implementation:
1. **Temporary seat lock** when user selects seats:
   ```python
   POST /bookings/lock-seats
   {
     "schedule_id": 123,
     "journey_date": "2025-11-25",
     "seat_numbers": ["A1", "A2"],
     "lock_duration": 300  # 5 minutes
   }
   ```

2. **Redis or database table** for locks:
   ```sql
   CREATE TABLE seat_locks (
     id SERIAL PRIMARY KEY,
     schedule_id INT,
     journey_date DATE,
     seat_number VARCHAR(10),
     locked_by_user_id INT,
     locked_at TIMESTAMP,
     expires_at TIMESTAMP
   );
   ```

3. **Auto-release locks** after timeout or payment completion

4. **WebSocket updates** to notify other users when seats become available

---

## 📊 API Endpoints Summary

### Already Implemented:
✅ `GET /schedules/available` - Search bus schedules
✅ `GET /bookings/my-bookings` - Customer booking history
✅ `POST /bookings/{booking_id}/cancel` - Cancel booking
✅ `POST /bookings/create` - Create booking after payment

### Need to Implement:
❌ `GET /schedules/{schedule_id}/seats?journey_date=X` - Seat availability
❌ `POST /bookings/lock-seats` - Temporary seat locking
❌ `POST /payments/khalti/init` - Initialize Khalti payment
❌ `GET /payments/khalti/verify` - Verify Khalti payment
❌ `POST /payments/esewa/init` - Initialize eSewa payment
❌ `GET /payments/esewa/verify` - Verify eSewa payment
❌ `GET /invoices/download/{booking_reference}` - Download PDF invoice

---

## 🔐 Authentication Flow (Firebase)

### Current Status:
- **Mock authentication** in `AuthContext.jsx`
- Firebase config exists in `src/firebase.js` but not integrated

### Required Implementation:

#### 1. Firebase Setup:
```javascript
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

#### 2. Update AuthContext:
```javascript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Email/Password Login
const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  
  // Send token to backend for validation
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firebase_token: token })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.data.access_token);
  localStorage.setItem('user', JSON.stringify(data.data.user));
};

// Google Login
const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const token = await result.user.getIdToken();
  // Same backend call as above
};
```

#### 3. Backend Token Validation:
```python
# backend/app/core/firebase_auth.py
import firebase_admin
from firebase_admin import credentials, auth

cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

async def verify_firebase_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        email = decoded_token['email']
        # Check if user exists in database, create if not
        return user_data
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## 🎯 Next Steps (Priority Order)

1. **Implement seat availability API** (1-2 hours)
   - Create `/schedules/{schedule_id}/seats` endpoint
   - Query existing bookings for seat status
   - Return seat layout + status array

2. **Update Booking.jsx for real-time seats** (2-3 hours)
   - Receive schedules from Search
   - Fetch seat availability
   - Implement seat grid with color coding
   - Add seat selection logic
   - Show selected count & total amount

3. **Implement seat locking mechanism** (2 hours)
   - Create seat_locks table or Redis
   - Lock seats API endpoint
   - Auto-expire locks after 5 minutes
   - Release on payment/cancel

4. **Payment gateway integration** (3-4 hours)
   - Khalti API integration
   - eSewa API integration
   - Payment verification endpoints
   - Update booking status on success

5. **PDF invoice generation** (2-3 hours)
   - Install reportlab/weasyprint
   - Create invoice template
   - Generate PDF on booking creation
   - Email PDF to customer

6. **Firebase authentication** (2 hours)
   - Configure Firebase project
   - Integrate Google sign-in
   - Update backend token validation
   - Test login/signup flow

---

## 📝 Testing Checklist

### Search Flow:
- [ ] Search with origin, destination, date returns results
- [ ] Filter by vendor works
- [ ] Filter by price range works
- [ ] Empty state shows when no results
- [ ] Clicking "Select" passes schedules to booking page

### Booking Flow:
- [ ] Seat layout displays correctly
- [ ] Seat colors match status (available/booked/selected)
- [ ] Cannot select booked seats
- [ ] Selected seats show in summary
- [ ] Total amount calculates correctly
- [ ] "Confirm Booking" proceeds to bill page

### Payment Flow:
- [ ] Khalti payment initializes correctly
- [ ] Payment callback updates booking status
- [ ] Failed payment shows error
- [ ] Booking created with correct data

### My Bookings:
- [ ] All bookings display correctly
- [ ] Filter tabs work (all/upcoming/completed/cancelled)
- [ ] Cancel button shows only for eligible bookings
- [ ] Refund calculation correct based on time
- [ ] Cancellation updates booking status
- [ ] Download ticket button works (after PDF implemented)

---

## 🐛 Known Issues & Limitations

1. **Seat locking:** Currently no temporary locks - race condition possible
2. **Payment integration:** Not implemented - requires API keys
3. **PDF generation:** Not implemented - need to add library
4. **Real-time updates:** Using polling, not WebSocket
5. **Email notifications:** Not configured - need SMTP setup
6. **QR code:** Not generated for tickets
7. **Firebase auth:** Mock system still active

---

## 📚 Documentation References

- **Khalti API:** https://docs.khalti.com/
- **eSewa API:** https://developer.esewa.com.np/
- **ReportLab (PDF):** https://www.reportlab.com/docs/reportlab-userguide.pdf
- **Firebase Auth:** https://firebase.google.com/docs/auth/web/start
- **FastAPI WebSockets:** https://fastapi.tiangolo.com/advanced/websockets/

---

## 💡 Recommendations

1. **Use WebSocket for real-time seat updates** instead of polling
2. **Implement seat locking with Redis** for better performance
3. **Add booking timeout** (10 minutes to complete payment)
4. **Implement queue system** for high-traffic routes
5. **Add caching** for popular routes/schedules
6. **Log all payment transactions** for audit trail
7. **Implement refund processing** via payment gateways
8. **Add SMS notifications** for booking confirmation
9. **Create admin panel** for managing bookings/refunds
10. **Add analytics** for popular routes and revenue tracking

---

**Last Updated:** November 21, 2025
**Status:** Search & MyBookings working with database. Seat selection, payment, and PDF generation pending.
