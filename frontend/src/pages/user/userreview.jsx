import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import '../../css/userReview.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const toJourneyStart = (booking) => {
  const date = booking?.journey_date
  const departure = booking?.departure_time || '00:00'
  if (!date) return null
  return new Date(`${date}T${departure}:00`)
}

const UserReviewView = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [drafts, setDrafts] = useState({})

  const loadData = useCallback(async () => {
    if (!user?.user_id) return

    setLoading(true)
    setError('')
    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE}/api/bookings?user_id=${user.user_id}`),
        fetch(`${API_BASE}/api/reviews?user_id=${user.user_id}`),
      ])
      const [bookingsData, reviewsData] = await Promise.all([bookingsRes.json(), reviewsRes.json()])

      if (!bookingsRes.ok || !reviewsRes.ok) {
        throw new Error('Failed to load review data')
      }

      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      setReviews(reviewsData.reviews || [])
    } catch (err) {
      setError(err.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [user?.user_id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const reviewedBookingIds = useMemo(() => {
    return new Set(reviews.map((item) => item.booking_id).filter(Boolean))
  }, [reviews])

  const { eligibleBookings, upcomingBookings } = useMemo(() => {
    const now = new Date()

    const eligible = []
    const upcoming = []

    bookings.forEach((booking) => {
      if (!booking?.booking_id) return
      if (booking.status === 'cancelled') return
      if (reviewedBookingIds.has(booking.booking_id)) return

      const journeyStart = toJourneyStart(booking)
      if (!journeyStart || Number.isNaN(journeyStart.getTime())) return

      const eligibleAt = new Date(journeyStart.getTime() + 24 * 60 * 60 * 1000)
      if (now >= eligibleAt) {
        eligible.push({ ...booking, eligible_at: eligibleAt.toISOString() })
      } else {
        upcoming.push({ ...booking, eligible_at: eligibleAt.toISOString() })
      }
    })

    return { eligibleBookings: eligible, upcomingBookings: upcoming }
  }, [bookings, reviewedBookingIds])

  const updateDraft = (bookingId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        rating: prev[bookingId]?.rating || 5,
        review_text: prev[bookingId]?.review_text || '',
        [field]: value,
      },
    }))
  }

  const submitReview = async (bookingId) => {
    const draft = drafts[bookingId] || { rating: 5, review_text: '' }

    setError('')
    setSuccess('')
    try {
      const response = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          booking_id: bookingId,
          rating: Number(draft.rating || 5),
          review_text: draft.review_text || '',
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit review')
      }

      setSuccess('Review submitted successfully.')
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[bookingId]
        return next
      })
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to submit review')
    }
  }

  return (
    <section className="container page-shell user-review-page">
      <div className="user-review-header">
        <h1>User Reviews</h1>
        <p>One review per booking. Reviews open 24 hours after journey start time.</p>
      </div>

      <div className="user-review-actions">
        <Link to="/user" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      {loading && <p className="admin-info">Loading review page...</p>}
      {error && <p className="admin-error">{error}</p>}
      {success && <p className="admin-success">{success}</p>}

      <article className="user-review-card">
        <h2>Available for Review</h2>
        {eligibleBookings.length === 0 ? (
          <p>No bookings are currently eligible for review.</p>
        ) : (
          <div className="user-review-list">
            {eligibleBookings.map((booking) => (
              <div key={booking.booking_id} className="user-review-item">
                <div>
                  <strong>Booking #{booking.booking_id}</strong>
                  <p>Date: {booking.journey_date} | Departure: {booking.departure_time || '--:--'}</p>
                  <p>Seat(s): {(booking.seat_labels || []).join(', ') || '-'}</p>
                </div>

                <div className="user-review-form">
                  <select
                    value={drafts[booking.booking_id]?.rating || 5}
                    onChange={(e) => updateDraft(booking.booking_id, 'rating', e.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} stars</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Write your review"
                    value={drafts[booking.booking_id]?.review_text || ''}
                    onChange={(e) => updateDraft(booking.booking_id, 'review_text', e.target.value)}
                  />
                  <button type="button" onClick={() => submitReview(booking.booking_id)}>
                    Submit Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="user-review-card">
        <h2>Upcoming Review Availability</h2>
        {upcomingBookings.length === 0 ? (
          <p>No pending review windows.</p>
        ) : (
          <div className="user-review-list">
            {upcomingBookings.map((booking) => (
              <div key={booking.booking_id} className="user-review-item">
                <div>
                  <strong>Booking #{booking.booking_id}</strong>
                  <p>Date: {booking.journey_date} | Departure: {booking.departure_time || '--:--'}</p>
                </div>
                <p className="user-review-eligible-at">
                  Available at: {new Date(booking.eligible_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="user-review-card">
        <h2>Submitted Reviews</h2>
        {reviews.length === 0 ? (
          <p>No submitted reviews yet.</p>
        ) : (
          <div className="user-review-list">
            {reviews.map((item) => (
              <div key={item.review_id} className="user-review-item">
                <div>
                  <strong>{item.ride?.route || 'Ride'}</strong>
                  <p>Booking: {item.ride?.booking_reference || item.booking_id}</p>
                </div>
                <p>Rating: {item.rating}/5</p>
                <p>{item.review_text || 'No text review.'}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}

export default UserReviewView
