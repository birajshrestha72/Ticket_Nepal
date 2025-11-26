# 🎉 BACKEND & FRONTEND COMPLETION GUIDE

## ✅ COMPLETED WORK

### Backend APIs Created

#### 1. **Routes API** (`/backend/app/api/routes/routes.py`)
- ✅ `GET /api/v1/routes/all` - List all routes with filters
- ✅ `GET /api/v1/routes/popular` - Get popular routes for homepage
- ✅ `GET /api/v1/routes/cities` - Get unique cities list
- ✅ `GET /api/v1/routes/{route_id}` - Get route details with schedules
- ✅ `POST /api/v1/routes/create` - Create new route
- ✅ `PUT /api/v1/routes/{route_id}` - Update route
- ✅ `DELETE /api/v1/routes/{route_id}` - Soft delete route

#### 2. **Schedules API** (`/backend/app/api/routes/schedules.py`)
- ✅ `GET /api/v1/schedules/available` - Get available schedules for booking
- ✅ `GET /api/v1/schedules/{schedule_id}` - Get schedule details
- ✅ `GET /api/v1/schedules/vendor/all` - Get vendor's schedules
- ✅ `POST /api/v1/schedules/create` - Create new schedule
- ✅ `PUT /api/v1/schedules/{schedule_id}` - Update schedule
- ✅ `DELETE /api/v1/schedules/{schedule_id}` - Soft delete schedule

#### 3. **Vendor Bookings Endpoint** (`/backend/app/api/routes/bookings.py`)
- ✅ `GET /api/v1/bookings/vendor/all` - Get all bookings for vendor's buses
  - Filters: status, bus_id, date_from, date_to
  - Pagination: limit, offset
  - Returns: customer details, bus info, route, payment status

### Frontend Components Created

#### 1. **Route Management** (`AdminRoutes.jsx`)
- ✅ Full CRUD interface for routes
- ✅ Search and filter functionality
- ✅ Modal form with datalist for cities
- ✅ Status toggle (active/inactive)
- ✅ Connected to backend API
- ✅ Responsive CSS (`routeManagement.css`)

#### 2. **App.jsx Updated**
- ✅ Registered AdminRoutes component
- ✅ Added routes for `/admin/routes`, `/vendor/routes`
- ✅ Added routes for `/admin/billing`, `/vendor/billing`
- ✅ Added routes for `/admin/ratings`, `/vendor/ratings`
- ✅ Imported Billing and RatingsReviews components

---

## 🚀 NEXT STEPS TO COMPLETE SYSTEM

### IMMEDIATE ACTIONS NEEDED

#### 1. **Start Backend Server**
```bash
cd /Users/biraj/Ticket_Nepal/backend
python -m uvicorn main:app --reload --port 8000
```

#### 2. **Start Frontend Server**
```bash
cd /Users/biraj/Ticket_Nepal/bus-ticketing-frontend
npm run dev
```

#### 3. **Test New Endpoints**
Visit: http://localhost:8000/docs

Test these new endpoints:
- Routes: `/api/v1/routes/all`, `/api/v1/routes/popular`, `/api/v1/routes/cities`
- Schedules: `/api/v1/schedules/available`, `/api/v1/schedules/vendor/all`
- Bookings: `/api/v1/bookings/vendor/all`

---

### CRITICAL COMPONENTS STILL NEEDED

#### 1. **Schedule Management Component** (`AdminSchedules.jsx`)

**File:** `/bus-ticketing-frontend/src/pages/admin/AdminSchedules.jsx`

**Features Required:**
```jsx
- List all schedules with filters (bus, route, date)
- Create schedule form:
  * Bus dropdown (from vendor's buses API)
  * Route dropdown (from routes API)
  * Departure time (time picker)
  * Arrival time (time picker)
  * Price input
  * Operating days (Mon-Sun checkboxes)
  * Active toggle
- Edit/Delete schedules
- Display: bus number, route (origin → destination), times, price, operating days
- API Integration:
  * GET /api/v1/schedules/vendor/all
  * POST /api/v1/schedules/create
  * PUT /api/v1/schedules/{id}
  * DELETE /api/v1/schedules/{id}
```

**CSS File:** `/bus-ticketing-frontend/src/css/scheduleManagement.css`
- Similar to routeManagement.css
- Table with schedule details
- Modal form with time pickers
- Operating days checkbox grid

**Register in App.jsx:**
```jsx
import AdminSchedules from './pages/admin/AdminSchedules.jsx';

// Add routes:
<Route path="/admin/schedules" element={<ProtectedRoute allowedRoles={["system_admin", "vendor"]}><AdminSchedules /></ProtectedRoute>} />
<Route path="/vendor/schedules" element={<ProtectedRoute allowedRoles={["vendor"]}><AdminSchedules /></ProtectedRoute>} />
```

---

#### 2. **Vendor Bookings List Component** (`VendorBookings.jsx`)

**File:** `/bus-ticketing-frontend/src/pages/admin/VendorBookings.jsx`

**Features Required:**
```jsx
- Bookings table:
  * Booking reference
  * Customer name/phone
  * Bus number
  * Route (origin → destination)
  * Journey date
  * Departure time
  * Seats booked
  * Total amount
  * Payment method
  * Payment status
  * Booking status (completed/pending/cancelled)
- Filters:
  * Date range (from - to)
  * Bus dropdown
  * Status dropdown (all/pending/completed/cancelled)
  * Search by booking reference/customer name
- Stats cards:
  * Today's bookings
  * Today's revenue
  * Pending bookings
  * Total bookings
- Actions:
  * View booking details (modal)
  * Export to CSV
  * Print booking
- API Integration:
  * GET /api/v1/bookings/vendor/all?status=&bus_id=&date_from=&date_to=
```

**CSS File:** `/bus-ticketing-frontend/src/css/vendorBookings.css`
- Similar to billing.css
- Stats cards grid
- Filters grid
- Bookings table with status badges
- Details modal

**Register in App.jsx:**
```jsx
import VendorBookings from './pages/admin/VendorBookings.jsx';

// Add routes:
<Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={["system_admin"]}><VendorBookings /></ProtectedRoute>} />
<Route path="/vendor/bookings" element={<ProtectedRoute allowedRoles={["vendor"]}><VendorBookings /></ProtectedRoute>} />
```

---

#### 3. **Admin Booking Creation** (`AdminCreateBooking.jsx`)

**File:** `/bus-ticketing-frontend/src/pages/admin/AdminCreateBooking.jsx`

**Features Required:**
```jsx
- Multi-step wizard:
  
Step 1: Select Schedule
  * Date picker for journey date
  * Route filter (origin → destination)
  * Show available schedules
  * Display: bus number, bus type, departure time, price, available seats
  * Select schedule button

Step 2: Select Seats
  * Visual seat layout (grid based on bus type)
  * Show booked seats (red/disabled)
  * Show selected seats (green)
  * Show available seats (gray)
  * Display: selected count, total amount
  * Fetch booked seats: GET /api/v1/buses/{bus_id}/booked-seats?date=YYYY-MM-DD

Step 3: Customer Details
  * Name (required)
  * Phone (required)
  * Email (optional)
  * Age (optional)
  * Pickup point (dropdown or text)

Step 4: Payment
  * Payment method: Cash/eSewa/Khalti/Bank
  * Amount display (auto-calculated)
  * Payment status: Completed (for counter booking)
  * Discount field (optional)

Step 5: Confirmation
  * Summary display
  * Create booking button
  * POST /api/v1/bookings/create
  * Show success with booking reference
  * Print ticket button
```

**CSS File:** `/bus-ticketing-frontend/src/css/adminBooking.css`
- Wizard steps indicator
- Seat grid layout (responsive)
- Summary cards
- Print styles for ticket

**Register in App.jsx:**
```jsx
import AdminCreateBooking from './pages/admin/AdminCreateBooking.jsx';

// Add routes:
<Route path="/admin/create-booking" element={<ProtectedRoute allowedRoles={["system_admin", "vendor"]}><AdminCreateBooking /></ProtectedRoute>} />
<Route path="/vendor/create-booking" element={<ProtectedRoute allowedRoles={["vendor"]}><AdminCreateBooking /></ProtectedRoute>} />
```

---

#### 4. **Update AdminDashboard Sidebar Links**

**File:** `/bus-ticketing-frontend/src/pages/admin/AdminDashboard.jsx`

Update the sidebar navigation to use `<Link>` instead of state:

```jsx
<Link to="/admin/buses" className="nav-item">
  <span className="nav-icon">🚌</span>
  <span className="nav-text">Manage Buses</span>
</Link>

<Link to="/admin/routes" className="nav-item">
  <span className="nav-icon">🗺️</span>
  <span className="nav-text">Manage Routes</span>
</Link>

<Link to="/admin/schedules" className="nav-item">
  <span className="nav-icon">📅</span>
  <span className="nav-text">Bus Schedules</span>
</Link>

<Link to="/admin/bookings" className="nav-item">
  <span className="nav-icon">🎫</span>
  <span className="nav-text">View Bookings</span>
</Link>

<Link to="/admin/create-booking" className="nav-item">
  <span className="nav-icon">➕</span>
  <span className="nav-text">Create Booking</span>
</Link>

<Link to="/admin/billing" className="nav-item">
  <span className="nav-icon">💰</span>
  <span className="nav-text">Billing</span>
</Link>

<Link to="/admin/ratings" className="nav-item">
  <span className="nav-icon">⭐</span>
  <span className="nav-text">Reviews</span>
</Link>
```

---

#### 5. **Connect Landing Page to Database**

**File:** `/bus-ticketing-frontend/src/pages/common/Landing.jsx`

Replace static data with API calls:

```jsx
// Popular Routes
useEffect(() => {
  const fetchPopularRoutes = async () => {
    try {
      const response = await fetch(`${API_URL}/routes/popular?limit=6`);
      if (response.ok) {
        const data = await response.json();
        setPopularRoutes(data.data?.routes || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };
  fetchPopularRoutes();
}, []);

// Featured Vendors
useEffect(() => {
  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_URL}/vendors/public/list?verified_only=true&limit=6`);
      if (response.ok) {
        const data = await response.json();
        setFeaturedVendors(data.data?.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };
  fetchVendors();
}, []);

// Statistics
useEffect(() => {
  const fetchStats = async () => {
    try {
      const [busesRes, routesRes] = await Promise.all([
        fetch(`${API_URL}/buses/all`),
        fetch(`${API_URL}/routes/all?is_active=true`)
      ]);
      
      if (busesRes.ok && routesRes.ok) {
        const busesData = await busesRes.json();
        const routesData = await routesRes.json();
        
        setStats({
          totalBuses: busesData.data?.buses?.length || 0,
          totalRoutes: routesData.data?.routes?.length || 0,
          totalBookings: 5000 // TODO: Create analytics endpoint
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  fetchStats();
}, []);
```

---

#### 6. **Connect Search Page to Database**

**File:** `/bus-ticketing-frontend/src/pages/common/Search.jsx`

Update search to use schedules API:

```jsx
const handleSearch = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const params = new URLSearchParams();
    if (filters.origin) params.append('origin', filters.origin);
    if (filters.destination) params.append('destination', filters.destination);
    if (filters.journeyDate) params.append('journey_date', filters.journeyDate);
    
    const response = await fetch(`${API_URL}/schedules/available?${params.toString()}`);
    
    if (!response.ok) throw new Error('Failed to fetch schedules');
    
    const data = await response.json();
    setBusResults(data.data?.schedules || []);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

#### 7. **Update VendorDashboard Links**

**File:** `/bus-ticketing-frontend/src/pages/admin/VendorDashboard.jsx`

Update quick action cards to use actual routes:

```jsx
<Link to="/vendor/buses" className="action-card">
  <div className="action-icon">🚌</div>
  <h3>Manage Buses</h3>
  <p>Add, edit, and manage your fleet</p>
</Link>

<Link to="/vendor/routes" className="action-card">
  <div className="action-icon">🗺️</div>
  <h3>Manage Routes</h3>
  <p>Create and manage routes</p>
</Link>

<Link to="/vendor/schedules" className="action-card">
  <div className="action-icon">📅</div>
  <h3>Bus Schedules</h3>
  <p>Set departure times and pricing</p>
</Link>

<Link to="/vendor/bookings" className="action-card">
  <div className="action-icon">🎫</div>
  <h3>View Bookings</h3>
  <p>See all customer bookings</p>
</Link>

<Link to="/vendor/create-booking" className="action-card">
  <div className="action-icon">➕</div>
  <h3>Create Booking</h3>
  <p>Book for walk-in customers</p>
</Link>

<Link to="/vendor/billing" className="action-card">
  <div className="action-icon">💰</div>
  <h3>Billing</h3>
  <p>View transactions and invoices</p>
</Link>

<Link to="/vendor/ratings" className="action-card">
  <div className="action-icon">⭐</div>
  <h3>Reviews</h3>
  <p>Check customer feedback</p>
</Link>
```

---

## 📊 IMPLEMENTATION PRIORITY

### Phase 1: Core Functionality (Must Have)
1. ✅ Routes API - DONE
2. ✅ Schedules API - DONE
3. ✅ Vendor Bookings API - DONE
4. ✅ Route Management UI - DONE
5. 🟡 **Schedule Management UI** - CREATE NEXT
6. 🟡 **Vendor Bookings List UI** - CREATE NEXT

### Phase 2: Enhanced Features (Should Have)
7. Admin Booking Creation (counter bookings)
8. Dashboard navigation updates
9. Landing page database connection
10. Search page database connection

### Phase 3: Polish (Nice to Have)
11. Real-time seat availability
12. Booking notifications
13. Analytics dashboard with charts
14. Export/Import functionality

---

## 🔧 TESTING CHECKLIST

Once components are created, test in this order:

### Backend Testing
- [ ] Test `/api/v1/routes/all` - Should return routes from database
- [ ] Test `/api/v1/routes/create` - Create a route (Kathmandu → Pokhara)
- [ ] Test `/api/v1/schedules/create` - Create schedule for a bus
- [ ] Test `/api/v1/schedules/vendor/all` - Should return vendor's schedules
- [ ] Test `/api/v1/bookings/vendor/all` - Should return vendor's bookings

### Frontend Testing
- [ ] Login as vendor
- [ ] Navigate to `/vendor/routes` - Should show route management
- [ ] Create new route - Should save to database
- [ ] Navigate to `/vendor/schedules` - Should show schedule management
- [ ] Create new schedule - Should link bus to route with timing
- [ ] Navigate to `/vendor/bookings` - Should show all bookings
- [ ] Filter bookings by date/status - Should work
- [ ] Navigate to `/vendor/create-booking` - Should show booking wizard
- [ ] Complete booking for customer - Should create in database

---

## 📝 QUICK IMPLEMENTATION TEMPLATES

### AdminSchedules.jsx Template
```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/scheduleManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    bus_id: '',
    route_id: '',
    departure_time: '',
    arrival_time: '',
    price: '',
    operating_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    is_active: true
  });

  useEffect(() => {
    fetchSchedules();
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchSchedules = async () => {
    // Implement GET /schedules/vendor/all
  };

  const fetchBuses = async () => {
    // Implement GET /buses/vendor or /buses/all
  };

  const fetchRoutes = async () => {
    // Implement GET /routes/all
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Implement POST /schedules/create or PUT /schedules/{id}
  };

  // Rest of implementation...
};

export default AdminSchedules;
```

### VendorBookings.jsx Template
```jsx
import React, { useState, useEffect } from 'react';
import '../../css/vendorBookings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const VendorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    bus_id: '',
    date_from: '',
    date_to: '',
    search: ''
  });
  const [stats, setStats] = useState({
    todayBookings: 0,
    todayRevenue: 0,
    pendingBookings: 0,
    totalBookings: 0
  });

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    // Implement GET /bookings/vendor/all with filters
  };

  const exportToCSV = () => {
    // Implement CSV export
  };

  // Rest of implementation...
};

export default VendorBookings;
```

---

## 🎯 FINAL SUMMARY

### What's Done ✅
- Routes API (full CRUD)
- Schedules API (full CRUD)
- Vendor Bookings endpoint
- Route Management UI
- App.jsx routing updated
- Backend registered in main.py

### What's Needed 🟡
- Schedule Management UI component
- Vendor Bookings List UI component
- Admin Booking Creation wizard
- Dashboard navigation links updates
- Landing/Search page database connections

### Time Estimates
- Schedule Management UI: ~3 hours
- Vendor Bookings List UI: ~2 hours
- Admin Booking Creation: ~4 hours
- Dashboard/Navigation updates: ~1 hour
- Page connections: ~2 hours
- **Total:** ~12 hours of development

---

## 🚀 START DEVELOPMENT NOW

**Recommended order:**
1. Create `AdminSchedules.jsx` + CSS
2. Create `VendorBookings.jsx` + CSS
3. Update Dashboard navigation
4. Connect Landing/Search to APIs
5. Create booking wizard
6. Test entire flow end-to-end

**You now have:**
- Complete backend infrastructure ✅
- Route management complete ✅
- Clear roadmap for remaining work ✅
- Templates to speed up development ✅

Start servers and begin implementing the remaining 3 components!
