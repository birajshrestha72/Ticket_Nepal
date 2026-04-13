// ============================================================================
// Booking Payment Callback View / Payment Portal Redirect Callback
// ============================================================================
// Yo page ma user eSewa/Khalti payment portal ko lagi gako ani back aera
// verify garne ko flow huncha. Payment gateway ko redirect URL ma point huncha.
// This page handles redirects from eSewa and Khalti portals after payment attempt,
// verifies the transaction, and updates booking status accordingly.
// ============================================================================

import { useMemo } from 'react'
import { Link } from 'react-router-dom'

export function BookingCallbackView() {
  const callback = useMemo(() => {
    const params = new URLSearchParams(globalThis.location.search)
    return {
      status: params.get('status') || 'failure',
      bookingReference: params.get('booking_reference') || '',
      reason: params.get('reason') || '',
    }
  }, [])

  // ========================================================================
  // Processing State / Verification Chalairaako
  // ========================================================================
  if (callback.status === 'success') {
    return (
      <section className="container page-shell">
        <article className="booking-detail-card">
          <h1>Payment Successful</h1>
          <p>Your payment has been verified and booking is confirmed.</p>
          {callback.bookingReference && (
            <p className="booking-ref">
              Booking Reference: <strong>{callback.bookingReference}</strong>
            </p>
          )}
          <div className="payment-actions">
            <Link to="/bookings" className="btn-primary">
              View My Bookings
            </Link>
          </div>
        </article>
      </section>
    )
  }

  // ========================================================================
  // Cancelled State / User Cancel Garo
  // ========================================================================
  if (callback.status === 'cancel') {
    return (
      <section className="container page-shell">
        <article className="booking-detail-card">
          <h1>Payment Cancelled</h1>
          <p>Payment was cancelled. You can try again with a new order.</p>
          <div className="payment-actions">
            <Link to="/search" className="btn-primary">
              Try Another Booking
            </Link>
            <Link to="/bookings" className="btn-secondary">
              View My Bookings
            </Link>
          </div>
        </article>
      </section>
    )
  }

  // ========================================================================
  // Failure State / Payment Failed
  // ========================================================================
  if (callback.status === 'failure' || callback.status === 'error') {
    return (
      <section className="container page-shell">
        <article className="booking-detail-card">
          <h1>Payment Issue</h1>
          <p>{callback.reason ? `Verification failed: ${callback.reason}` : 'An error occurred during payment verification.'}</p>
          {callback.bookingReference && (
            <p className="booking-ref">
              Booking Reference: <strong>{callback.bookingReference}</strong>
            </p>
          )}
          <p>Please contact support if the issue persists.</p>
          <div className="payment-actions">
            <Link to="/search" className="btn-primary">
              Try Again
            </Link>
            <Link to="/bookings" className="btn-secondary">
              View My Bookings
            </Link>
          </div>
        </article>
      </section>
    )
  }

  return null
}

export default BookingCallbackView
