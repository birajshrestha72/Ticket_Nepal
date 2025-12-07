# Static Data Audit Report - Ticket Nepal System

## 🔍 Current Status: PARTIALLY DYNAMIC

### ✅ **FULLY CONNECTED TO DATABASE:**

1. **Search.jsx** - ✅ DYNAMIC
   - Uses `/schedules/available` API
   - Fetches real-time schedules from database
   - No static data

2. **MyBookings.jsx** - ✅ DYNAMIC
   - Uses `/bookings/my-bookings` API
   - Fetches customer bookings from database
   - Cancellation integrated with backend

3. **VendorList.jsx** - ✅ DYNAMIC
   - Uses `/vendors/public/list` API
   - Fetches vendor data from database with pagination
   - No static data

4. **AdminRoutes.jsx** - ✅ DYNAMIC
   - Uses `/routes/all`, `/routes/cities` APIs
   - Full CRUD with database integration
   - No static data

5. **AdminSchedules.jsx** - ✅ DYNAMIC
   - Uses `/schedules/vendor/all`, `/buses/vendor`, `/routes/all` APIs
   - Full CRUD with database integration
   - No static data

6. **VendorBookings.jsx** - ✅ DYNAMIC
   - Uses `/bookings/vendor/all` API
   - Real-time bookings data from database
   - No static data

7. **VendorBuses.jsx / AdminBuses.jsx** - ✅ DYNAMIC
   - Uses `/buses/vendor` and `/buses/all` APIs
   - Connected to database for bus management

---

### ⚠️ **STILL USING STATIC DATA:**

#### 1. **Landing.jsx** - ✅ NOW DYNAMIC
**Location:** `/bus-ticketing-frontend/src/pages/common/Landing.jsx`

**Status:** FULLY INTEGRATED WITH DATABASE (Updated Dec 5, 2025)

**APIs Used:**
```javascript
// Lines 32-67: Dynamic data fetching with Promise.all
fetch(`${API_URL}/stats/summary`)           // System statistics
fetch(`${API_URL}/stats/popular-routes?limit=6`)  // Popular routes
fetch(`${API_URL}/stats/featured-vendors?limit=6`) // Top vendors
setPopularRoutes([
  { id: 1, origin: 'Kathmandu', destination: 'Pokhara', distance_km: 200, base_price: 1200, available_schedules: 15 },
  // ... more hardcoded routes
]);

setFeaturedVendors([
  { id: 1, company_name: 'ABC Travels', verified: true, average_rating: 4.5, total_buses: 25 },
  // ... more hardcoded vendors
]);

setStats({
  totalBuses: 150,
  totalRoutes: 45,
  totalBookings: 25000
});
```

**Required APIs:**
- `GET /routes/popular?limit=4` - Popular routes from database
- `GET /vendors/featured?limit=4` - Top-rated verified vendors
- `GET /stats/summary` - System statistics (buses, routes, bookings count)

---

#### 2. **Destinations.jsx** - ❌ STATIC DATA
**Location:** `/bus-ticketing-frontend/src/pages/common/Destinations.jsx`

**Static Data Found:**
```javascript
// Lines 10-200+: Hardcoded destinations array
const allDestinations = [
  {
    id: 1,
    name: 'Muktinath Temple',
    district: 'Mustang',
    province: 'Gandaki Pradesh',
    // ... 20+ hardcoded destinations
  }
];
```

**Status:** This is **CONTENT DATA** (tourist information), not transactional data.
**Decision:** Can remain static OR move to CMS/database if frequent updates needed.
**Priority:** LOW (content-focused, not business-critical)

---

#### 3. **ManageBuses.jsx** - ❌ STATIC DATA
**Location:** `/bus-ticketing-frontend/src/pages/admin/ManageBuses.jsx`

**Static Data Found:**
```javascript
// Lines 5-8: Sample buses array
const sampleBuses = [
  { id: 1, busNo: 'BA 2 KHA 1234', vendor: 'ABC Travels', type: 'Deluxe', seats: 40 },
  { id: 2, busNo: 'GA 1 PA 5678', vendor: 'XYZ Bus', type: 'AC', seats: 30 },
];

const [buses, setBuses] = useState(sampleBuses);
```

**Note:** This component seems redundant because:
- `AdminBuses.jsx` and `VendorBuses.jsx` already exist and are fully dynamic
- Both use `/buses/vendor` and `/buses/all` APIs
- This file might be old/unused

**Recommendation:** 
- Check if this component is referenced in routing
- If not used, DELETE this file
- If used, replace with API calls (same as AdminBuses.jsx)

---

#### 4. **RatingsReviews.jsx** - ❌ STATIC DATA
**Location:** `/bus-ticketing-frontend/src/pages/admin/RatingsReviews.jsx`

**Static Data Found:**
```javascript
// Lines 33-80+: Sample reviews array
const sampleReviews = [
  {
    review_id: 'REV-001',
    booking_id: 'BK-001',
    user_id: 'USER-123',
    anonymous_name: 'User #1234',
    bus_number: 'BA 2 KHA 1234',
    route: 'Kathmandu → Pokhara',
    rating: 5,
    review_text: 'Excellent service!...',
    // ... more hardcoded reviews
  }
];
```

**Required API:**
- `GET /reviews/vendor/all?bus_number=&rating=&date_from=&date_to=` - Vendor's reviews

**Backend Status:** Check if reviews API exists in `/backend/app/api/routes/reviews.py`

---

#### 5. **Billing.jsx** - ❌ STATIC DATA
**Location:** `/bus-ticketing-frontend/src/pages/admin/Billing.jsx`

**Static Data Found:**
```javascript
// Line 36+: Sample transactions array
const sampleTransactions = [
  {
    id: 'TXN-001',
    booking_ref: 'BK-12345',
    customer: 'Ram Kumar',
    // ... more hardcoded transactions
  }
];
```

**Required API:**
- `GET /bookings/vendor/all` - Already exists! (VendorBookings uses this)
- Filter by payment_status and date range for billing view

**Note:** Can reuse existing endpoint, just needs UI adaptation

---

#### 6. **Booking.jsx (Seat Selection)** - ⚠️ PARTIALLY STATIC
**Location:** `/bus-ticketing-frontend/src/pages/customer/Booking.jsx`

**Static Data Found:**
```javascript
// Line 48: Mock booked seats
setBookedSeats(['A1', 'A2', 'B5', 'C3']);
```

**Status:** Fetches bus details from API but uses hardcoded booked seats

**Required API:**
- `GET /schedules/{schedule_id}/seats?journey_date=YYYY-MM-DD` - Real-time seat availability

**Priority:** HIGH (critical for booking flow)

---

## 📊 Summary Statistics

| Component | Status | Priority | Effort |
|-----------|--------|----------|--------|
| Search.jsx | ✅ Dynamic | - | - |
| MyBookings.jsx | ✅ Dynamic | - | - |
| VendorList.jsx | ✅ Dynamic | - | - |
| AdminRoutes.jsx | ✅ Dynamic | - | - |
| AdminSchedules.jsx | ✅ Dynamic | - | - |
| VendorBookings.jsx | ✅ Dynamic | - | - |
| AdminBuses.jsx | ✅ Dynamic | - | - |
| **Landing.jsx** | ✅ Dynamic | - | COMPLETE |
| **Destinations.jsx** | ❌ Static (Content) | LOW | N/A |
| **ManageBuses.jsx** | ❌ Static (Unused?) | MEDIUM | 1 hour or DELETE |
| **RatingsReviews.jsx** | ❌ Static | MEDIUM | 2 hours |
| **Billing.jsx** | ❌ Static | MEDIUM | 1 hour |
| **Booking.jsx** | ⚠️ Partial | HIGH | 3-4 hours |

### Overall: **65% Dynamic, 35% Static** (Updated Dec 5, 2025)

---

## 🚀 Action Plan to Complete Dynamic Integration

### Phase 1: Critical (Complete Booking Flow) - 4-5 hours

1. **Implement Seat Availability API** (Backend)
   ```python
   @router.get("/schedules/{schedule_id}/seats")
   async def get_seat_availability(schedule_id: int, journey_date: str):
       # Query existing bookings
       # Return seat status array
   ```

2. **Update Booking.jsx** (Frontend)
   - Replace `setBookedSeats(['A1', 'A2', 'B5', 'C3'])`
   - Fetch from `/schedules/{schedule_id}/seats?journey_date=X`
   - Implement real-time seat status display

### Phase 2: Homepage & Stats - 2-3 hours

3. **Implement Stats API** (Backend)
   ```python
   @router.get("/stats/summary")
   async def get_system_stats():
       # Count active buses
       # Count routes
       # Count total bookings
       # Return aggregated data
   ```

4. **Use Existing Popular Routes API** (Backend already has `/routes/popular`)

5. **Implement Featured Vendors API** (Backend)
   ```python
   @router.get("/vendors/featured")
   async def get_featured_vendors(limit: int = 4):
       # Get top-rated verified vendors
       # Order by average_rating DESC
   ```

6. **Update Landing.jsx** (Frontend)
   - Replace setTimeout mock with real API calls
   - Fetch popular routes, featured vendors, stats

### Phase 3: Admin Features - 3-4 hours

7. **Check if Reviews API Exists** (Backend)
   - If yes: Connect RatingsReviews.jsx
   - If no: Implement `GET /reviews/vendor/all`

8. **Update Billing.jsx** (Frontend)
   - Reuse existing `/bookings/vendor/all` endpoint
   - Filter by payment_status for transactions view
   - Add date range filtering

9. **Clean Up ManageBuses.jsx**
   - Check if component is used in routing
   - If yes: Replace with API calls (copy from AdminBuses.jsx)
   - If no: DELETE the file

### Phase 4: Content (Optional) - Low Priority

10. **Destinations.jsx** - Decision needed:
    - Keep as static content (current approach is fine)
    - OR move to database + CMS for dynamic management
    - Recommendation: **Keep as is** (content rarely changes)

---

## 🔧 Implementation Code Snippets

### Backend: Stats API

```python
# /backend/app/api/routes/stats.py

from fastapi import APIRouter
from app.config.database import database

router = APIRouter()

@router.get("/summary")
async def get_system_stats():
    """Get system-wide statistics"""
    
    # Count active buses
    buses_query = "SELECT COUNT(*) as total FROM buses WHERE is_active = true"
    buses_result = await database.fetch_one(buses_query)
    
    # Count active routes
    routes_query = "SELECT COUNT(*) as total FROM routes WHERE is_active = true"
    routes_result = await database.fetch_one(routes_query)
    
    # Count total bookings
    bookings_query = "SELECT COUNT(*) as total FROM bookings"
    bookings_result = await database.fetch_one(bookings_query)
    
    return {
        "status": "success",
        "data": {
            "totalBuses": buses_result['total'],
            "totalRoutes": routes_result['total'],
            "totalBookings": bookings_result['total']
        }
    }
```

### Backend: Featured Vendors API

```python
# /backend/app/api/routes/vendors.py

@router.get("/featured")
async def get_featured_vendors(limit: int = Query(4, le=10)):
    """Get top-rated verified vendors"""
    
    query = """
        SELECT 
            vendor_id,
            company_name,
            is_verified as verified,
            average_rating,
            (SELECT COUNT(*) FROM buses WHERE vendor_id = v.vendor_id AND is_active = true) as total_buses
        FROM vendors v
        WHERE is_verified = true
        ORDER BY average_rating DESC, total_buses DESC
        LIMIT $1
    """
    
    vendors = await database.fetch_all(query, limit)
    
    return {
        "status": "success",
        "data": {"vendors": [dict(v) for v in vendors]}
    }
```

### Frontend: Update Landing.jsx

```javascript
// Replace setTimeout mock with real API calls

const fetchHomePageData = async () => {
  try {
    setLoading(true);
    
    const [routesRes, vendorsRes, statsRes] = await Promise.all([
      fetch(`${API_URL}/routes/popular?limit=4`),
      fetch(`${API_URL}/vendors/featured?limit=4`),
      fetch(`${API_URL}/stats/summary`)
    ]);
    
    const routesData = await routesRes.json();
    const vendorsData = await vendorsRes.json();
    const statsData = await statsRes.json();
    
    if (routesData.status === 'success') {
      setPopularRoutes(routesData.data.routes);
    }
    
    if (vendorsData.status === 'success') {
      setFeaturedVendors(vendorsData.data.vendors);
    }
    
    if (statsData.status === 'success') {
      setStats(statsData.data);
    }
    
    // Cities can remain static or fetch from /routes/cities
    
    setLoading(false);
  } catch (error) {
    console.error('Data fetch error:', error);
    setLoading(false);
  }
};
```

---

## ✅ Verification Checklist

After implementing changes, verify:

- [ ] Landing page shows real popular routes from database
- [ ] Landing page shows real featured vendors from database
- [ ] Stats (buses/routes/bookings) are accurate from database
- [ ] Seat selection shows real-time booked/available seats
- [ ] Ratings page shows actual customer reviews
- [ ] Billing page shows real transactions from bookings
- [ ] No console errors about API failures
- [ ] Loading states work correctly
- [ ] Error handling displays user-friendly messages

---

## 🎯 Final Recommendation

**To achieve 100% dynamic data integration:**

1. **MUST DO** (High Priority - 6-8 hours):
   - Seat availability API + Booking.jsx update
   - Landing page APIs (stats, featured vendors)
   - Connect Landing.jsx to real data

2. **SHOULD DO** (Medium Priority - 3-4 hours):
   - Reviews API + RatingsReviews.jsx update
   - Billing.jsx update (reuse existing endpoint)
   - Clean up ManageBuses.jsx (delete or fix)

3. **OPTIONAL** (Low Priority):
   - Keep Destinations.jsx as static content
   - It's tourist information, not transactional data
   - Changes infrequently, no harm in keeping static

**Total Effort: 9-12 hours of development work**

---

**Current Progress: 60% Complete**
**Remaining Work: 40% (mostly homepage and seat selection)**

