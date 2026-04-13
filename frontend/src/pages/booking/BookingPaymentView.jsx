// ============================================================================
// Booking Payment View / Booking Payment Ko Page
// ============================================================================
// Yo component ma payment method selection garne, mock payment credentials
// dekhane, ra payment complete bhada ticket download garne ko option huncha.
// This component handles payment method selection, displays test credentials,
// and shows success screen with ticket download option after confirming payment.
// ============================================================================

import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import {
  confirmBookingPayment,
  createPaymentOrder,
  createBooking,
  initiateEsewaOrder,
  initiateKhaltiOrder,
} from '../../api/bookingApi'
import '../../css/bookingFlow.css'

// ============================================================================
// Mock Payment Gateway Credentials / Parkhaunu Ko Proof
// ============================================================================
// Yo mock gateways ko credentials development time ma use garir hun sancha.
// Real production ma remove garne need huncha.
const MOCK_GATEWAYS = {
  esewa: {
    testIds: (import.meta.env.VITE_ESEWA_TEST_IDS || '9806800001,9806800002,9806800003,9806800004,9806800005').split(','),
    password: import.meta.env.VITE_ESEWA_PASSWORD || 'Set in VITE_ESEWA_PASSWORD',
    mpin: import.meta.env.VITE_ESEWA_MPIN || '1122',
    token: import.meta.env.VITE_ESEWA_TOKEN || '123456',
    formUrl: import.meta.env.VITE_ESEWA_FORM_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    statusUrl: import.meta.env.VITE_ESEWA_STATUS_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/',
    docsUrl: 'https://developer.esewa.com.np',
  },
  khalti: {
    // Khalti ko test IDs
    testIds: (import.meta.env.VITE_KHALTI_TEST_IDS || '9800000000,9800000001,9800000002,9800000003,9800000004,9800000005').split(','),
    mpin: import.meta.env.VITE_KHALTI_MPIN || '1111',
    otp: import.meta.env.VITE_KHALTI_OTP || '987654',
    sandboxBase: import.meta.env.VITE_KHALTI_SANDBOX_BASE || 'https://dev.khalti.com/api/v2',
    initiatePath: '/epayment/initiate/',
    lookupPath: '/epayment/lookup/',
    docsUrl: 'https://docs.khalti.com/khalti-epayment/',
  },
}

const submitEsewaForm = (action, fields) => {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action
  form.style.display = 'none'

  Object.entries(fields || {}).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = String(value ?? '')
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
}

// ============================================================================
// Component: BookingPaymentView / Booking Payment View
// ============================================================================
// Payment page main component - payment method select, confirmation, success
const BookingPaymentView = () => {
  const { user } = useAuth()
  const location = useLocation()
  
  // ============================================================================
  // State Management / State Ko Sambhalna
  // ============================================================================
  const [paymentMethod, setPaymentMethod] = useState('khalti')
  const [loading, setLoading] = useState(false)                            // Payment processing state
  const [error, setError] = useState('')                                   // Error message display
  const [success, setSuccess] = useState('')
  const [payLaterBooking, setPayLaterBooking] = useState(null)
  let confirmButtonLabel = 'Confirm Payment'
  if (loading) {
    confirmButtonLabel = 'Processing...'
  }

  const canPayLater = user?.role === 'vendor'

  // ============================================================================
  // Parse URL Parameters / URL Parameters Padhne
  // ============================================================================
  // URL ma busId, date, seats, total parameters huncha seat selection uta vata aera
  const details = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const seats = (params.get('seats') || '').split(',').filter(Boolean)
    const total = Number(params.get('total') || 0)
    return {
      busId: params.get('busId') || '',
      tripId: params.get('tripId') || '',
      date: params.get('date') || '',
      seats,
      total,
    }
  }, [location.search])

  // ============================================================================
  // Payment Confirmation Handler / Payment Confirm Garne
  // ============================================================================
  const onConfirm = async (methodOverride = null) => {
    const chosenMethod = methodOverride || paymentMethod

    // User login chha kina check garne
    if (!user?.user_id) {
      setError('You must login first')
      return
    }

    // Booking details complete chha kina check garne
    if (!details.busId || !details.date || details.seats.length === 0) {
      setError('Incomplete booking details. Please reselect seats.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (chosenMethod === 'pay_later' && canPayLater) {
        await onPayLater()
        return
      }

      if (!details.tripId) {
        throw new Error('Missing trip information. Please select seats again.')
      }

      const order = await createPaymentOrder({
        user_id: user.user_id,
        trip_id: Number(details.tripId),
        journey_date: details.date,
        seat_labels: details.seats,
        amount: details.total,
      })

      if (chosenMethod === 'esewa') {
        const payment = await initiateEsewaOrder({
          order_id: order.id,
          user_id: user.user_id,
        })

        if (!payment.form_action || !payment.form_fields) {
          throw new Error('Failed to prepare eSewa checkout form')
        }

        submitEsewaForm(payment.form_action, payment.form_fields)
        return
      }

      const payment = await initiateKhaltiOrder({
        order_id: order.id,
        user_id: user.user_id,
      })

      if (payment.payment_url) {
        globalThis.location.href = payment.payment_url
      } else {
        throw new Error('Failed to get Khalti payment URL')
      }
    } catch (err) {
      setError(err.message || 'Payment confirmation failed')
    } finally {
      setLoading(false)
    }
  }

  const onChooseGateway = (method) => {
    setPaymentMethod(method)
    onConfirm(method)
  }

  const onPayLater = async () => {
    if (!user?.user_id) {
      setError('You must login first')
      return
    }

    if (!details.busId || !details.date || details.seats.length === 0) {
      setError('Incomplete booking details. Please reselect seats.')
      return
    }

    if (!canPayLater) {
      setError('Pay later is only available for vendor bookings')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const booking = await createBooking({
        user_id: user.user_id,
        bus_id: Number(details.busId),
        journey_date: details.date,
        seats: details.seats.length,
        seat_labels: details.seats,
        payment_method: 'pay_later',
        is_counter_booking: false,
      })

      await confirmBookingPayment(booking.booking_id, {
        user_id: user.user_id,
        payment_method: 'pay_later',
        pay_later: true,
      })

      setPayLaterBooking(booking)
      setSuccess(`Booking confirmed as pay later. Reference: ${booking.booking_reference}`)
    } catch (err) {
      setError(err.message || 'Unable to confirm pay later booking')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // Render: Payment Selection Screen / Payment Method Select Garne Ko Page
  // ============================================================================
  return (
    <section className="container page-shell booking-flow-page">
      <h1>Payment</h1>
      <p>Select gateway and continue to test-mode checkout.</p>

      {/* Error message display */}
      {error && <p className="admin-error">{error}</p>}
      {success && <p className="admin-success">{success}</p>}

      {payLaterBooking && (
        <article className="booking-detail-card">
          <h3>Pay Later Booking Created</h3>
          <p><strong>Booking Reference:</strong> {payLaterBooking.booking_reference}</p>
          <p>Your vendor booking has been confirmed with pay later status.</p>
          <div className="payment-actions">
            <Link className="btn-secondary" to="/admin">Go to Vendor Dashboard</Link>
            <Link className="btn-primary" to="/search">Create Another Booking</Link>
          </div>
        </article>
      )}

      {/* Booking Summary - selected seats, date, total price */}
      <article className="booking-detail-card">
        <h3>Payment Summary</h3>
        <p><strong>Journey Date:</strong> {details.date || '-'}</p>
        <p><strong>Seats:</strong> {details.seats.join(', ') || '-'}</p>
        <p><strong>Total:</strong> Rs. {details.total.toFixed(0)}</p>
      </article>

      {/* Payment Method Selection - eSewa vs Khalti */}
      <fieldset className="payment-options">
        <legend className="payment-options-label">Choose Payment Method</legend>
        <button
          type="button"
          className={`payment-method-btn ${paymentMethod === 'esewa' ? 'active' : ''}`}
          onClick={() => onChooseGateway('esewa')}
          aria-pressed={paymentMethod === 'esewa'}
          disabled={loading}
        >
          Pay with eSewa
        </button>
        <button
          type="button"
          className={`payment-method-btn ${paymentMethod === 'khalti' ? 'active' : ''}`}
          onClick={() => onChooseGateway('khalti')}
          aria-pressed={paymentMethod === 'khalti'}
          disabled={loading}
        >
          Pay with Khalti
        </button>
        {canPayLater && (
          <button
            type="button"
            className="payment-method-btn"
            onClick={() => setPaymentMethod('pay_later')}
            aria-pressed={paymentMethod === 'pay_later'}
            disabled={loading}
          >
            Pay Later
          </button>
        )}
      </fieldset>

      {/* Test Credentials Display - payment test garrne ko credentials */}
      <article className="booking-detail-card">
        <h3>Gateway Test Credentials</h3>
        <p><strong>Test eSewa IDs:</strong> {MOCK_GATEWAYS.esewa.testIds.join(', ')}</p>
        <p><strong>Password:</strong> {MOCK_GATEWAYS.esewa.password}</p>
        <p><strong>MPIN (app):</strong> {MOCK_GATEWAYS.esewa.mpin}</p>
        <p><strong>OTP Token:</strong> {MOCK_GATEWAYS.esewa.token}</p>
        <p><strong>Form Endpoint:</strong> {MOCK_GATEWAYS.esewa.formUrl}</p>
        <p><strong>Status Check Endpoint:</strong> {MOCK_GATEWAYS.esewa.statusUrl}</p>
        <p><strong>Reference:</strong> <a href={MOCK_GATEWAYS.esewa.docsUrl} target="_blank" rel="noreferrer">eSewa ePay Docs</a></p>
        <hr />
        <p><strong>Test Khalti IDs:</strong> {MOCK_GATEWAYS.khalti.testIds.join(', ')}</p>
        <p><strong>MPIN:</strong> {MOCK_GATEWAYS.khalti.mpin}</p>
        <p><strong>OTP:</strong> {MOCK_GATEWAYS.khalti.otp}</p>
        <p><strong>Sandbox API Base:</strong> {MOCK_GATEWAYS.khalti.sandboxBase}</p>
        <p><strong>Initiate API:</strong> {MOCK_GATEWAYS.khalti.initiatePath}</p>
        <p><strong>Lookup API:</strong> {MOCK_GATEWAYS.khalti.lookupPath}</p>
        <p><strong>Reference:</strong> <a href={MOCK_GATEWAYS.khalti.docsUrl} target="_blank" rel="noreferrer">Khalti Web Checkout Docs</a></p>
        <p><strong>Note:</strong> Booking is created only after verified Khalti callback.</p>
        <p><strong>Refund:</strong> Gateway refund API is not used for this project. Refund proof is handled via mailed receipt.</p>
      </article>

      {/* Action Buttons - confirm payment ya back to search */}
      <div className="payment-actions">
        <Link className="btn-secondary" to="/search">Back to Search</Link>
        <button type="button" onClick={onConfirm} disabled={loading}>
          {confirmButtonLabel}
        </button>
        {canPayLater && (
          <button type="button" onClick={onPayLater} disabled={loading} className="btn-secondary">
            {loading ? 'Processing...' : 'Confirm as Pay Later'}
          </button>
        )}
      </div>
    </section>
  )
}

export default BookingPaymentView
