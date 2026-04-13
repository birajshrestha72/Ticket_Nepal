# ============================================================================
# FRONTEND SEPARATION OF CONCERNS - PROJECT STRUCTURE GUIDE
# CONCERN KO ALAG ALAG THALI - FRONTEND
# ============================================================================
#
# Yo frontend project structured component-based architecture use garchha.
# Hrek feature ko alag folder ra file organization huncha.
# Each feature (booking, auth, dashboard, admin) ma separate code organize gako chha.
#
# ============================================================================
# FRONTEND DIRECTORY STRUCTURE / FRONTEND KO SANRACHNA
# ============================================================================
#
# frontend/src/
# ├── main.jsx                      # Entry point
# ├── App.jsx                        # Main router setup
# ├── index.css                      # Global styles
# ├── context/
# │   └── AuthContext.jsx           # Global auth state (Redux alternative)
# ├── api/                           # API-only layer (SOC: UI bata alag)
# │   ├── bookingApi.js             # Booking feature ko HTTP calls
# │   ├── adminApi.js               # Vendor admin ko HTTP calls
# │   └── superadminApi.js          # System admin ko HTTP calls
# ├── pages/                         # Page-level components
# │   ├── LandingView.jsx           # Home page
# │   ├── SearchView.jsx            # Bus search page
# │   ├── booking/                   # Booking feature
# │   │   ├── BookingSearchView.jsx
# │   │   ├── BookingRouteResultsView.jsx
# │   │   ├── BookingSeatSelectionView.jsx
# │   │   └── BookingPaymentView.jsx
# │   ├── user/                      # Customer features
# │   │   ├── ProfileView.jsx       # User profile
# │   │   ├── CustomerDashboardView.jsx # Bookings/Reviews
# │   │   └── userreview.jsx
# │   ├── admin/                     # Vendor admin
# │   │   ├── AnalyticsSection.jsx
# │   │   └── ...
# │   └── supadmin/                  # System admin
# │       ├── SuperAdminDashboardView.jsx
# │       ├── SuperAdminBusesSection.jsx
# │       ├── SuperAdminRoutesSection.jsx
# │       └── SuperAdminSchedulesSection.jsx
# ├── css/
# │   ├── bookingFlow.css           # Booking pages styling
# │   ├── customerDashboard.css     # Dashboard styling
# │   └── ...                        # Feature-specific styles
# └── utils/                         # Utility functions
#     ├── api.js                     # Global API client setup
#     ├── storage.js                 # LocalStorage helpers
#     └── format.js                  # Data formatting (time, currency)
#
# ============================================================================
# COMPONENT ORGANIZATION / COMPONENT KO TARJIBO
# ============================================================================
#
# 1. PAGE COMPONENTS (High-level, full pages)
#    Located: src/pages/*/
#    Responsibility:
#    - Route handler (rendered at specific URL)
#    - Page-level state management
#    - API data fetching
#    - Layout and composition of smaller components
#
#    Pattern:
#    export default function PageView() {
#      const [state, setState] = useState(...)
#      const [loading, setLoading] = useState(false)
#      const [error, setError] = useState('')
#
#      useEffect(() => {
#        // Fetch data
#      }, [])
#
#      return (
#        <section>
#          {loading && <p>Loading...</p>}
#          {error && <p className="error">{error}</p>}
#          {data && <div>...render data...</div>}
#        </section>
#      )
#    }
#
# 2. API CLIENT FUNCTIONS (*Api.js files)
#    Located: src/api/
#    Responsibility:
#    - HTTP requests to backend
#    - Request/response formatting
#    - Error handling (convert to user-friendly messages)
#    - Data transformation if needed
#
#    Pattern:
#    export async function fetchBookings(userId) {
#      try {
#        const response = await fetch(
#          `${API_BASE}/api/bookings?user_id=${userId}`
#        )
#        if (!response.ok) {
#          const error = await response.json()
#          throw new Error(error.detail || 'Failed to fetch')
#        }
#        return await response.json()
#      } catch (error) {
#        throw new Error(error.message)
#      }
#    }
#
# 3. CONTEXT (Global App State)
#    Located: src/context/
#    Responsibility:
#    - User authentication state (logged-in user info)
#    - Global app state (theme, language, etc.)
#    - Provider wrapper for entire app
#
#    Pattern:
#    export const AuthContext = createContext()
#    
#    export function AuthProvider({ children }) {
#      const [user, setUser] = useState(null)
#      const [loading, setLoading] = useState(true)
#      
#      // Load user on app init
#      useEffect(() => { ... }, [])
#      
#      return (
#        <AuthContext.Provider value={{ user, setUser, loading }}>
#          {children}
#        </AuthContext.Provider>
#      )
#    }
#
# ============================================================================
# DATA FLOW PATTERNS / DATA KO CHALCHAL
# ============================================================================
#
# USER BOOKING FLOW:
#
#    1. SearchView
#       - User searches for buses
#       - Calls: searchBuses(fromCity, toCity, date) via searchApi.js
#       - Displays results in BookingRouteResultsView
#
#    2. BookingSeatSelectionView
#       - Shows bus seat layout
#       - Gets seat availability
#       - Calls: getAvailableSeats(busId, date) via src/api/bookingApi.js
#       - User selects seats
#
#    3. BookingPaymentView (THIS FILE)
#       - Shows payment methods
#       - Calls: createBooking({...}) → confirmBookingPayment({...})
#       - On success: Shows confirmation + download button
#       - Calls: downloadTicketPdf(bookingId, userId)
#
# USER DASHBOARD FLOW:
#
#    1. CustomerDashboardView
#       - User clicks "My Bookings" tab
#       - Fetches bookings: listBookings(userId)
#       - Displays bookings table
#       - Each booking has action buttons:
#         * Estimate Refund
#         * Modify Seats
#         * Download Ticket (PDF)
#         * Cancel Booking
#
# ============================================================================
# BILINGUAL COMMENT CONVENTION - FRONTEND / FRONTEND COMMENT KO NIYAM
# ============================================================================
#
# File header:
#    // ============================================================================
#    // Component Name / Nepali Component Name
#    // ============================================================================
#    // Brief description in Nepali
#    // Brief description in English
#
# Function docstring:
#    /**
#     * Nepali explanation - What this function does
#     * English explanation
#     *
#     * @param {type} name - Nepali param description / English
#     * @returns {type} - Nepali return description / English
#     */
#
# Inline comment:
#    // Nepali inline comment / English inline
#
# State management:
#    const [state, setState] = useState(null) // Variable ko use - what it stores
#
# Event handlers:
#    const handleClick = () => {
#      // Kya huncha - What happens when clicked
#    }
#
# ============================================================================
# KEY FEATURES EXPLANATION / MAIN FEATURES
# ============================================================================
#
# 1. BOOKING FLOW (Booking Ko Prakriya)
#    - User searches buses by route/date
#    - Selects seats on visual layout
#    - Confirms payment via eSewa/Khalti (mock in dev)
#    - Receives email confirmation automatically
#    - Can download ticket PDF immediately
#
# 2. CUSTOMER DASHBOARD
#    - View all personal bookings
#    - Estimate refund before cancelling
#    - Cancel booking (refund processed by backend)
#    - Modify booking seats (remove some, get partial refund)
#    - Download ticket PDF anytime
#    - Write reviews for completed journeys
#
# 3. VENDOR ADMIN
#    - View all bookings for their buses
#    - Accept/reject reviews
#    - View analytics (revenue, occupancy, etc)
#    - Manage bus inventory
#
# 4. SYSTEM ADMIN (SuperAdmin)
#    - Global CRUD operations
#    - Vendor verification (document approval)
#    - System-wide analytics
#    - User management
#
# ============================================================================
# ERROR HANDLING PATTERNS / ERROR HANDLE GARNE
# ============================================================================
#
# API calls wrap in try-catch:
#    try {
#      const data = await fetchBookings(userId)
#      setBookings(data)
#    } catch (err) {
#      setError(err.message || 'Failed to fetch bookings')
#    }
#
# Display of errors:
#    {error && <p className="admin-error">{error}</p>}
#
# Loading states:
#    {loading && <p>Loading your bookings...</p>}
#
# Form validation:
#    if (!email || !email.includes('@')) {
#      setError('Please enter valid email')
#      return
#    }
#
# ============================================================================
# STATE MANAGEMENT BEST PRACTICES / STATE SAMBHALNE KO NIYAM
# ============================================================================
#
# 1. Keep state in lowest common parent
#    - Don't lift state too high (causes unnecessary re-renders)
#
# 2. Use separate states for different concerns
#    - [data, setData] - The actual data
#    - [loading, setLoading] - Loading state
#    - [error, setError] - Error message
#
# 3. Use useEffect for side effects
#    - Fetch data on component mount
#    - Use dependency arrays correctly
#
# 4. Use context only for true global state
#    - Auth user (needed by entire app)
#    - NOT for passing data between siblings (use props)
#
# ============================================================================
# CSS ORGANIZATION / CSS KO SANGATHAN
# ============================================================================
#
# Feature-specific CSS files:
#    - bookingFlow.css - Booking pages styling
#    - customerDashboard.css - Dashboard styling
#    - Common classes:
#      * .container - Max-width wrapper
#      * .page-shell - Full page wrapper
#      * .btn-primary / .btn-secondary - Button styles
#      * .admin-error / .admin-success - Message styles
#      * .admin-table / .admin-table-wrap - Table styles
#
# BEM naming convention (Block Element Modifier):
#    .booking-flow-page - Block (main component)
#    .booking-flow-page__card - Element (sub-component)
#    .booking-flow-page--active - Modifier (state variant)
#
# ============================================================================
