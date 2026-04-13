import { Link, useSearchParams } from 'react-router-dom'

const PaymentFailureView = () => {
  const [params] = useSearchParams()
  const gateway = params.get('gateway') || 'payment'
  const reason = params.get('reason') || 'unknown'

  return (
    <section className="container page-shell booking-flow-page">
      <h1>Payment Failed</h1>
      <p className="admin-error">
        {gateway} payment could not be completed. Reason: {reason}
      </p>
      <div className="payment-actions">
        <Link className="btn-primary" to="/search">Try Again</Link>
        <Link className="btn-secondary" to="/bookings">Go to My Bookings</Link>
      </div>
    </section>
  )
}

export default PaymentFailureView
