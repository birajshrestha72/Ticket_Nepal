import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { verifyKhaltiOrderByPidx } from '../../api/bookingApi'

const KhaltiSuccessView = () => {
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const hasVerifiedRef = useRef(false)

  useEffect(() => {
    if (hasVerifiedRef.current) {
      return
    }
    hasVerifiedRef.current = true

    const pidx = (params.get('pidx') || '').trim()
    const returnedStatus = (params.get('status') || '').trim().toLowerCase()

    if (!pidx) {
      setError('Missing Khalti transaction id (pidx).')
      setLoading(false)
      return
    }

    if (returnedStatus && returnedStatus !== 'completed') {
      setError(`Khalti returned non-success status: ${returnedStatus}`)
      setLoading(false)
      return
    }

    verifyKhaltiOrderByPidx(pidx)
      .then((payment) => {
        setResult(payment)
      })
      .catch((err) => {
        setError(err.message || 'Khalti payment verification failed')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [params])

  return (
    <section className="container page-shell booking-flow-page">
      <h1>Khalti Payment Verification</h1>
      {loading && <p className="admin-info">Verifying your payment...</p>}
      {!loading && error && <p className="admin-error">{error}</p>}
      {!loading && !error && (
        <article className="booking-detail-card">
          <h3>Payment Successful</h3>
          <p>Your Khalti payment was verified successfully.</p>
          <p><strong>Booking ID:</strong> {result?.booking_id || '-'}</p>
          <p><strong>Reference:</strong> {result?.booking_reference || '-'}</p>
          <div className="payment-actions">
            <Link className="btn-primary" to="/bookings">Go to My Bookings</Link>
            <Link className="btn-secondary" to="/search">Book Another Ticket</Link>
          </div>
        </article>
      )}
    </section>
  )
}

export default KhaltiSuccessView
