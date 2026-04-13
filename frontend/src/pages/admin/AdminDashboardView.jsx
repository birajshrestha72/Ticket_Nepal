import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import '../../css/adminDashboard.css'
import { useAuth } from '../../context/AuthContext'
import { fetchAdminDashboardData } from '../../api/adminApi'
import AnalyticsSection from './AnalyticsSection'
import BookingsSection from './BookingsSection'
import BusesCrudSection from './BusesCrudSection'
import DashboardHomeSection from './DashboardHomeSection'
import RoutesCrudSection from './RoutesCrudSection'
import ReviewsSection from './ReviewsSection'
import SchedulesCrudSection from './SchedulesCrudSection'
import SeatManagementSection from './SeatManagementSection'

const tabs = [
  { key: 'home', label: 'Dashboard Home' },
  { key: 'bookings', label: 'View Bookings' },
  { key: 'buses', label: 'Manage Buses' },
  { key: 'routes', label: 'Manage Routes' },
  { key: 'schedules', label: 'Manage Schedules' },
  { key: 'reviews', label: 'Ride Reviews' },
  { key: 'seats', label: 'Seat Management' },
  { key: 'analytics', label: 'Analytics' },
]

const AdminDashboardView = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [bookings, setBookings] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [schedules, setSchedules] = useState([])
  const [reviews, setReviews] = useState([])

  const showError = (message) => {
    setSuccess('')
    setError(message || 'Something went wrong')
  }

  const showSuccess = (message) => {
    setError('')
    setSuccess(message)
  }

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAdminDashboardData()
      const isVendorAccount = user?.role === 'vendor' && user?.user_id != null

      if (isVendorAccount) {
        const vendorId = String(user.user_id)
        const vendorBookings = (data.bookings || []).filter((booking) => String(booking.vendor_id ?? '') === vendorId)
        const bookingIds = new Set(vendorBookings.map((booking) => String(booking.booking_id)))
        const vendorReviews = (data.reviews || []).filter((review) => bookingIds.has(String(review.booking_id ?? '')))
        const totalRevenue = vendorBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0)
        const bookedSeats = vendorBookings.reduce((sum, booking) => sum + Number(booking.seats || booking.number_of_seats || 0), 0)

        setBookings(vendorBookings)
        setBuses(data.buses || [])
        setRoutes(data.routes || [])
        setSchedules(data.schedules || [])
        setAnalytics({
          total_bookings: vendorBookings.length,
          total_revenue: totalRevenue,
          booked_seats: bookedSeats,
          occupancy_rate: 0,
          active_buses: 0,
          active_routes: 0,
          active_schedules: 0,
          total_buses: 0,
          total_routes: 0,
          total_schedules: 0,
        })
        setReviews(vendorReviews)
        return
      }

      setBookings(data.bookings)
      setBuses(data.buses)
      setRoutes(data.routes)
      setSchedules(data.schedules)
      setAnalytics(data.analytics)
      setReviews(data.reviews)
    } catch (err) {
      setError(err.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (!tab) return
    if (tabs.some((item) => item.key === tab)) {
      setActiveTab(tab)
    }
  }, [location.search])

  return (
    <section className="container page-shell admin-dashboard admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h1>Ticket Nepal</h1>
          <p>Vendor Command Center</p>
        </div>

        <nav className="admin-tabs side-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
          <Link to="/admin/profile" className="admin-tab admin-tab-link">
            View/Edit Profile
          </Link>
        </nav>
      </aside>

      <div className="admin-main">
        <div className="admin-header">
          <h2>Admin Dashboard ({user?.name || 'Vendor'})</h2>
          <p>Manage bookings, buses, routes, schedules, seat maps, and analytics</p>
        </div>

        {loading && <p className="admin-info">Loading admin data...</p>}
        {error && <p className="admin-error">{error}</p>}
        {success && <p className="admin-success">{success}</p>}

        {activeTab === 'home' && (
          <DashboardHomeSection
            analytics={analytics}
            bookings={bookings}
            buses={buses}
            routes={routes}
            schedules={schedules}
            reviews={reviews}
            onQuickNavigate={setActiveTab}
          />
        )}

        {activeTab === 'bookings' && <BookingsSection bookings={bookings} />}

        {activeTab === 'buses' && (
          <BusesCrudSection
            buses={buses}
            onDataChanged={loadDashboardData}
            showError={showError}
            showSuccess={showSuccess}
          />
        )}

        {activeTab === 'routes' && (
          <RoutesCrudSection
            routes={routes}
            onDataChanged={loadDashboardData}
            showError={showError}
            showSuccess={showSuccess}
          />
        )}

        {activeTab === 'schedules' && (
          <SchedulesCrudSection
            schedules={schedules}
            buses={buses}
            routes={routes}
            onDataChanged={loadDashboardData}
            showError={showError}
            showSuccess={showSuccess}
          />
        )}

        {activeTab === 'reviews' && <ReviewsSection reviews={reviews} />}

        {activeTab === 'seats' && (
          <SeatManagementSection
            buses={buses}
            onDataChanged={loadDashboardData}
            showError={showError}
            showSuccess={showSuccess}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsSection
            bookings={bookings}
            buses={buses}
            routes={routes}
            schedules={schedules}
            reviews={reviews}
          />
        )}
      </div>
    </section>
  )
}

export default AdminDashboardView
