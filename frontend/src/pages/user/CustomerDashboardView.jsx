import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { downloadTicketPdf } from '../../api/bookingApi'
import '../../css/customerDashboard.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'bookings', label: 'My Bookings' },
  { key: 'reviews', label: 'Ride Reviews' },
  { key: 'account', label: 'Account' },
]

const BOOKINGS_PAGE_SIZE = 10
const REVIEWS_PAGE_SIZE = 6

const CustomerDashboardView = ({ initialTab = 'overview' }) => {
  const { user, updateProfile } = useAuth()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewDrafts, setReviewDrafts] = useState({})
  const [downloadingPdfId, setDownloadingPdfId] = useState(null)
  const [bookingQuery, setBookingQuery] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [bookingSortBy, setBookingSortBy] = useState('date')
  const [bookingSortDir, setBookingSortDir] = useState('desc')
  const [bookingPage, setBookingPage] = useState(1)
  const [reviewPage, setReviewPage] = useState(1)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState(user?.name || '')
  const [editPhone, setEditPhone] = useState(user?.phone || '')
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')

    if (!editName.trim()) {
      setEditError('Name is required')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to update profile')
      }

      const data = await response.json()
      const updatedUser = data.data?.user
      if (updatedUser) {
        localStorage.setItem('ticket-nepal-user', JSON.stringify(updatedUser))
        updateProfile(updatedUser)
      }
      setEditSuccess('Profile updated successfully')
      setEditMode(false)
      setTimeout(() => setEditSuccess(''), 3000)
    } catch (err) {
      setEditError(err.message || 'Failed to update profile')
    }
  }

  const loadDashboardData = useCallback(async () => {
    if (!user?.user_id) {
      setBookings([])
      setReviews([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const [bookingsRes, reviewsRes, busesRes] = await Promise.all([
        fetch(`${API_BASE}/api/bookings?user_id=${user.user_id}`),
        fetch(`${API_BASE}/api/reviews?user_id=${user.user_id}`),
        fetch(`${API_BASE}/api/buses`),
      ])

      const [bookingsData, reviewsData, busesData] = await Promise.all([
        bookingsRes.json(),
        reviewsRes.json(),
        busesRes.json(),
      ])

      if (!bookingsRes.ok || !reviewsRes.ok || !busesRes.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const myBookings = Array.isArray(bookingsData) ? bookingsData : []

      const busList = Array.isArray(busesData) ? busesData : (busesData.buses || [])
      const busById = Object.fromEntries(busList.map((item) => [item.bus_id, item]))

      const hydratedBookings = myBookings.map((item) => {
        const bus = busById[item.bus_id]

        return {
          ...item,
          bus_name: bus?.bus_name || 'Unknown Bus',
          bus_type: bus?.bus_type || 'Standard',
          route_name: bus ? `${bus.from_city} -> ${bus.to_city}` : 'Route unavailable',
          departure_time: '--:--',
          arrival_time: '--:--',
        }
      })

      const reviewList = reviewsData.reviews || []
      setBookings(hydratedBookings)
      setReviews(reviewList)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [user?.user_id])

  const cancelBooking = async (bookingId) => {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to cancel booking')
      }

      const refund = data.refund
      const refundText = refund
        ? `Booking cancelled. Refund Rs. ${Number(refund.refund_amount || 0).toFixed(0)} (${refund.refund_percent || 0}%).`
        : 'Booking cancelled.'
      setSuccess(refundText)
      await loadDashboardData()
    } catch (err) {
      setError(err.message || 'Failed to cancel booking')
    } finally {
      setSaving(false)
    }
  }

  const startReview = (bookingId) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [bookingId]: prev[bookingId] || { rating: 5, review_text: '' },
    }))
  }

  const updateReviewDraft = (bookingId, field, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { rating: 5, review_text: '' }),
        [field]: value,
      },
    }))
  }

  const submitReview = async (bookingId) => {
    const draft = reviewDrafts[bookingId]
    if (!draft) return

    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const response = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          booking_id: bookingId,
          rating: Number(draft.rating),
          review_text: draft.review_text,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit review')
      }

      setSuccess('Review submitted successfully.')
      setReviewDrafts((prev) => {
        const next = { ...prev }
        delete next[bookingId]
        return next
      })
      await loadDashboardData()
    } catch (err) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setSaving(false)
    }
  }

  const onDownloadTicketPdf = async (bookingId) => {
    if (!user?.user_id) return

    setDownloadingPdfId(bookingId)
    try {
      await downloadTicketPdf(bookingId, user.user_id)
    } catch (err) {
      setError(err.message || 'Failed to download ticket PDF')
    } finally {
      setDownloadingPdfId(null)
    }
  }

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const busId = params.get('busId')
    const date = params.get('date')
    if (busId || date) {
      setActiveTab('bookings')
    }
  }, [location.search])

  const today = new Date().toISOString().slice(0, 10)
  const upcomingBookings = useMemo(
    () => bookings.filter((item) => item.journey_date >= today),
    [bookings, today],
  )
  const completedBookings = useMemo(
    () => bookings.filter((item) => item.journey_date < today),
    [bookings, today],
  )
  const totalSpent = useMemo(
    () => bookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [bookings],
  )

  const reviewedBookingIds = useMemo(() => {
    return new Set(reviews.map((item) => item.booking_id).filter(Boolean))
  }, [reviews])

  const reviewPendingBookings = useMemo(() => {
    return bookings.filter((item) => !reviewedBookingIds.has(item.booking_id) && item.status !== 'cancelled')
  }, [bookings, reviewedBookingIds])

  const userInitial = (user?.name || 'Traveler').trim().charAt(0).toUpperCase()

  const bookingStatuses = useMemo(() => {
    return [...new Set(bookings.map((item) => String(item.status || '')).filter(Boolean))]
      .sort((left, right) => String(left).localeCompare(String(right), 'en', { sensitivity: 'base' }))
  }, [bookings])

  const visibleBookings = useMemo(() => {
    const q = bookingQuery.trim().toLowerCase()

    const filtered = bookings.filter((item) => {
      const statusMatch = bookingStatusFilter === 'all' || String(item.status || '').toLowerCase() === bookingStatusFilter
      if (!statusMatch) return false
      if (!q) return true

      const text = [
        item.booking_id,
        item.route_name,
        item.bus_name,
        item.journey_date,
        item.status,
        ...(item.seat_labels || []),
      ].join(' ').toLowerCase()
      return text.includes(q)
    })

    const order = bookingSortDir === 'asc' ? 1 : -1
    return [...filtered].sort((left, right) => {
      if (bookingSortBy === 'id') {
        return (Number(left.booking_id || 0) - Number(right.booking_id || 0)) * order
      }
      if (bookingSortBy === 'amount') {
        return (Number(left.total_amount || 0) - Number(right.total_amount || 0)) * order
      }
      if (bookingSortBy === 'status') {
        return String(left.status || '').localeCompare(String(right.status || ''), 'en', {
          sensitivity: 'base',
        }) * order
      }
      return String(left.journey_date || '').localeCompare(String(right.journey_date || ''), 'en', {
        sensitivity: 'base',
      }) * order
    })
  }, [bookingQuery, bookingSortBy, bookingSortDir, bookingStatusFilter, bookings])

  useEffect(() => {
    setBookingPage(1)
  }, [bookingQuery, bookingStatusFilter, bookingSortBy, bookingSortDir, bookings.length])

  const bookingTotalPages = Math.max(1, Math.ceil(visibleBookings.length / BOOKINGS_PAGE_SIZE))
  const safeBookingPage = Math.min(bookingPage, bookingTotalPages)

  useEffect(() => {
    if (safeBookingPage !== bookingPage) {
      setBookingPage(safeBookingPage)
    }
  }, [bookingPage, safeBookingPage])

  const paginatedBookings = useMemo(() => {
    const start = (safeBookingPage - 1) * BOOKINGS_PAGE_SIZE
    return visibleBookings.slice(start, start + BOOKINGS_PAGE_SIZE)
  }, [safeBookingPage, visibleBookings])

  const reviewTotalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PAGE_SIZE))
  const safeReviewPage = Math.min(reviewPage, reviewTotalPages)
  const paginatedReviews = useMemo(() => {
    const start = (safeReviewPage - 1) * REVIEWS_PAGE_SIZE
    return reviews.slice(start, start + REVIEWS_PAGE_SIZE)
  }, [reviews, safeReviewPage])

  return (
    <section className="container page-shell customer-dashboard customer-shell">
      <aside className="customer-sidebar">
        <div className="customer-brand">
          <span className="customer-brand-mark">{userInitial || 'T'}</span>
          <h1>Ticket Nepal</h1>
          <p>Traveler Dashboard</p>
        </div>

        <nav className="customer-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`customer-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="customer-main">
        <div className="customer-header">
          <div>
            <h2>Welcome back, {user?.name || 'Traveler'}</h2>
            <p>Track upcoming rides, manage profile, and explore new routes.</p>
          </div>
          <div className="customer-header-actions">
            <Link to="/search" className="btn btn-secondary">Book New Ride</Link>
            <Link to="/profile" className="btn btn-secondary">Profile</Link>
          </div>
        </div>

        {loading && <p className="admin-info">Loading your dashboard...</p>}
        {error && <p className="admin-error">{error}</p>}
        {success && <p className="admin-success">{success}</p>}

        {activeTab === 'overview' && (
          <div className="customer-overview-grid">
            <article className="customer-card stat">
              <h3>Total Bookings</h3>
              <p>{bookings.length}</p>
              <div className="dashboard-actions">
                <Link to="/bookings" className="btn btn-secondary">View Bookings</Link>
              </div>
            </article>
            <article className="customer-card stat">
              <h3>Upcoming Rides</h3>
              <p>{upcomingBookings.length}</p>
              <div className="dashboard-actions">
                <Link to="/bookings" className="btn btn-secondary">Open Upcoming</Link>
              </div>
            </article>
            <article className="customer-card stat">
              <h3>Completed Rides</h3>
              <p>{completedBookings.length}</p>
              <div className="dashboard-actions">
                <Link to="/bookings" className="btn btn-secondary">Open History</Link>
              </div>
            </article>
            <article className="customer-card stat">
              <h3>Total Spent</h3>
              <p>Rs. {totalSpent.toFixed(0)}</p>
              <div className="dashboard-actions">
                <Link to="/bookings" className="btn btn-secondary">View Payment History</Link>
              </div>
            </article>

            <article className="customer-card span-2">
              <h3>Next Ride</h3>
              {upcomingBookings[0] ? (
                <div className="ride-info">
                  <strong>{upcomingBookings[0].route_name}</strong>
                  <p>{upcomingBookings[0].bus_name} ({upcomingBookings[0].bus_type})</p>
                  <p>{upcomingBookings[0].journey_date} | {upcomingBookings[0].departure_time} - {upcomingBookings[0].arrival_time}</p>
                </div>
              ) : (
                <p>No upcoming rides. Plan one now.</p>
              )}
              <div className="dashboard-actions">
                <Link to="/search" className="btn btn-secondary">Search Buses</Link>
                <Link to="/vendors" className="btn btn-secondary">Browse Vendors</Link>
                {upcomingBookings[0] && <Link to="/bookings" className="btn btn-secondary">Manage Ride</Link>}
              </div>
            </article>

            <article className="customer-card">
              <h3>Review Pending</h3>
              <p className="customer-muted-copy">{reviewPendingBookings.length} booking(s) waiting for your feedback.</p>
              <div className="dashboard-actions">
                <Link to="/user/reviews" className="row-action-btn row-action-link">Open Reviews</Link>
              </div>
            </article>

            <article className="customer-card">
              <h3>Quick Account</h3>
              <p className="customer-muted-copy">Signed in as {user?.email || 'N/A'}</p>
              <div className="dashboard-actions">
                <Link to="/profile" className="btn btn-secondary">Edit Profile</Link>
                <Link to="/forgot-password" className="btn btn-secondary">Reset Password</Link>
              </div>
            </article>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="customer-card">
            <h3>My Bookings</h3>

            <p className="customer-muted-copy">
              New bookings are available from Search Buses and seat selection only.
            </p>
            <div className="dashboard-actions" style={{ marginBottom: '1rem' }}>
              <Link to="/search" className="btn btn-secondary">Search Buses</Link>
            </div>

            {bookings.length === 0 ? (
              <p>You have not made any bookings yet.</p>
            ) : (
              <>
                <div className="admin-table-wrap">
                <div className="table-filter-row customer-table-filters">
                  <input
                    type="text"
                    placeholder="Search booking/route/bus"
                    value={bookingQuery}
                    onChange={(e) => setBookingQuery(e.target.value)}
                  />
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {bookingStatuses.map((status) => (
                      <option key={status} value={String(status).toLowerCase()}>{status}</option>
                    ))}
                  </select>
                  <select value={bookingSortBy} onChange={(e) => setBookingSortBy(e.target.value)}>
                    <option value="date">Sort by date</option>
                    <option value="id">Sort by booking id</option>
                    <option value="amount">Sort by amount</option>
                    <option value="status">Sort by status</option>
                  </select>
                  <select value={bookingSortDir} onChange={(e) => setBookingSortDir(e.target.value)}>
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Route</th>
                      <th>Bus</th>
                      <th>Date</th>
                      <th>Seats</th>
                      <th>Seat Labels</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBookings.map((item) => (
                      <tr key={item.booking_id}>
                        <td>#{item.booking_id}</td>
                        <td>{item.route_name}</td>
                        <td>{item.bus_name}</td>
                        <td>{item.journey_date}</td>
                        <td>{item.seats}</td>
                        <td>{(item.seat_labels || []).join(', ') || '-'}</td>
                        <td>Rs. {Number(item.total_amount).toFixed(0)}</td>
                        <td>{item.status}</td>
                        <td>
                          {item.status === 'cancelled' ? 'Cancelled' : (
                            <div className="booking-action-stack">
                              <Link
                                to={`/booking/seats?bookingId=${item.booking_id}&busId=${item.bus_id}&date=${item.journey_date}`}
                                className="row-action-btn row-action-link"
                              >
                                Edit Booking
                              </Link>

                              <button
                                type="button"
                                className="row-action-btn"
                                disabled={downloadingPdfId === item.booking_id}
                                onClick={() => onDownloadTicketPdf(item.booking_id)}
                              >
                                {downloadingPdfId === item.booking_id ? 'Downloading PDF...' : 'Download PDF'}
                              </button>

                              <button
                                type="button"
                                className="row-action-btn"
                                disabled={saving}
                                onClick={() => cancelBooking(item.booking_id)}
                              >
                                Cancel Booking
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                <div className="table-pagination">
                  <span className="table-pagination-meta">
                    Showing {paginatedBookings.length} of {visibleBookings.length} booking(s)
                  </span>
                  <div className="table-pagination-controls">
                    <button
                      type="button"
                      className="table-page-btn"
                      onClick={() => setBookingPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeBookingPage <= 1}
                    >
                      Previous
                    </button>
                    <span className="table-page-indicator">Page {safeBookingPage} of {bookingTotalPages}</span>
                    <button
                      type="button"
                      className="table-page-btn"
                      onClick={() => setBookingPage((prev) => Math.min(bookingTotalPages, prev + 1))}
                      disabled={safeBookingPage >= bookingTotalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="customer-card">
            <h3>Ride Reviews</h3>

            <div className="review-pending-list">
              {reviewPendingBookings.length === 0 ? (
                <p>All your active bookings are already reviewed.</p>
              ) : reviewPendingBookings.map((item) => (
                <article key={item.booking_id} className="review-pending-item">
                  <div>
                    <strong>{item.route_name}</strong>
                    <p>Booking #{item.booking_id} | Date: {item.journey_date}</p>
                  </div>
                  {reviewDrafts[item.booking_id] ? (
                    <div className="review-form-inline">
                      <select
                        value={reviewDrafts[item.booking_id].rating}
                        onChange={(e) => updateReviewDraft(item.booking_id, 'rating', e.target.value)}
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>{value} stars</option>
                        ))}
                      </select>
                      <textarea
                        placeholder="Share your ride experience"
                        value={reviewDrafts[item.booking_id].review_text}
                        onChange={(e) => updateReviewDraft(item.booking_id, 'review_text', e.target.value)}
                      />
                      <button type="button" disabled={saving} onClick={() => submitReview(item.booking_id)}>
                        Submit
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="row-action-btn" onClick={() => startReview(item.booking_id)}>
                      Write Review
                    </button>
                  )}
                </article>
              ))}
            </div>

            {reviews.length === 0 ? (
              <p>No ride reviews linked to your bookings yet.</p>
            ) : (
              <div className="review-list">
                {paginatedReviews.map((item) => (
                  <article key={item.review_id} className="review-item">
                    <div>
                      <strong>{item.ride?.route || 'Ride'}</strong>
                      <p>Booking: {item.ride?.booking_reference || 'N/A'} | Date: {item.ride?.journey_date || 'N/A'}</p>
                    </div>
                    <p className="review-rating">Rating: {item.rating}/5</p>
                    <p>{item.review_text || 'No written review.'}</p>
                  </article>
                ))}
              </div>
            )}
            {reviews.length > 0 && (
              <div className="table-pagination">
                <span className="table-pagination-meta">
                  Showing {paginatedReviews.length} of {reviews.length} review(s)
                </span>
                <div className="table-pagination-controls">
                  <button
                    type="button"
                    className="table-page-btn"
                    onClick={() => setReviewPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeReviewPage <= 1}
                  >
                    Previous
                  </button>
                  <span className="table-page-indicator">Page {safeReviewPage} of {reviewTotalPages}</span>
                  <button
                    type="button"
                    className="table-page-btn"
                    onClick={() => setReviewPage((prev) => Math.min(reviewTotalPages, prev + 1))}
                    disabled={safeReviewPage >= reviewTotalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="customer-card">
            <h3>Account Settings</h3>
            {editMode ? (
              <form onSubmit={handleSaveProfile} className="account-edit-form">
                <div className="form-group">
                  <label htmlFor="edit-name">Full Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                  <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed after registration</small>
                </div>

                <div className="form-group">
                                      <label htmlFor="edit-phone">Phone Number</label>
                                      <input
                                        id="edit-phone"
                                        type="tel"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        placeholder="e.g., +977-9841234567"
                                      />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-role">Role</label>
                  <input
                    id="edit-role"
                    type="text"
                    value={user?.role || 'customer'}
                    disabled
                  />
                </div>

                {editError && <p className="form-error">{editError}</p>}
                {editSuccess && <p className="form-success">{editSuccess}</p>}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                                  <button type="button" onClick={() => { setEditMode(false); setEditName(user?.name || ''); setEditPhone(user?.phone || ''); setEditError(''); }} className="btn btn-ghost">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="account-summary-grid">
                  <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
                  <p><strong>Role:</strong> {user?.role || 'customer'}</p>
                </div>
                <div className="dashboard-actions">
                  <button type="button" onClick={() => setEditMode(true)} className="btn btn-secondary">Edit Profile</button>
                  <Link to="/forgot-password" className="btn btn-secondary">Reset Password</Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default CustomerDashboardView

CustomerDashboardView.propTypes = {
  initialTab: PropTypes.string,
}

CustomerDashboardView.defaultProps = {
  initialTab: 'overview',
}
