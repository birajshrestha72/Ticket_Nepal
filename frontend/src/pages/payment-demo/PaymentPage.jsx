import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
  initiateEsewaDemo,
  initiateKhaltiDemo,
  manualConfirmDemo,
} from '../../api/paymentDemoApi'

const postEsewaForm = (action, payload) => {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action
  form.style.display = 'none'

  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = String(value ?? '')
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
}

const PaymentPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loadingMethod, setLoadingMethod] = useState('')
  const [error, setError] = useState('')
  const [lastTransactionId, setLastTransactionId] = useState('')

  const booking = useMemo(() => ({
    user_id: Number(searchParams.get('user_id') || 1),
    booking_id: Number(searchParams.get('booking_id') || 1001),
    amount: Number(searchParams.get('amount') || 500),
  }), [searchParams])

  const customerInfo = {
    name: 'Ticket Nepal Demo User',
    email: 'demo@ticketnepal.com',
    phone: '9800000000',
  }

  const onKhaltiPay = async () => {
    setLoadingMethod('khalti')
    setError('')
    try {
      const initiated = await initiateKhaltiDemo({
        ...booking,
        purchase_order_name: `Booking ${booking.booking_id}`,
        customer_info: customerInfo,
      })
      setLastTransactionId(initiated.pidx)
      globalThis.location.href = initiated.payment_url
    } catch (err) {
      setError(err.message || 'Failed to initiate Khalti payment')
    } finally {
      setLoadingMethod('')
    }
  }

  const onEsewaPay = async () => {
    setLoadingMethod('esewa')
    setError('')
    try {
      const initiated = await initiateEsewaDemo(booking)
      setLastTransactionId(initiated.payload.transaction_uuid)
      postEsewaForm(initiated.form_action, initiated.payload)
    } catch (err) {
      setError(err.message || 'Failed to initiate eSewa payment')
    } finally {
      setLoadingMethod('')
    }
  }

  const onManualConfirm = async () => {
    if (!lastTransactionId) {
      setError('No transaction available yet. Start a payment first.')
      return
    }

    setLoadingMethod('manual')
    setError('')
    try {
      const result = await manualConfirmDemo(lastTransactionId)
      navigate(`/demo/payment/failure?status=manual-success&transaction_id=${encodeURIComponent(result.transaction_id)}`)
    } catch (err) {
      setError(err.message || 'Manual confirm failed')
    } finally {
      setLoadingMethod('')
    }
  }

  return (
    <section className="container page-shell">
      <h1>Demo Payment Page</h1>
      <p>Booking #{booking.booking_id} | Amount: Rs. {booking.amount.toFixed(2)}</p>

      {error && <p className="admin-error">{error}</p>}

      <div className="payment-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button type="button" onClick={onKhaltiPay} disabled={!!loadingMethod}>
          {loadingMethod === 'khalti' ? 'Redirecting...' : 'Pay with Khalti'}
        </button>
        <button type="button" onClick={onEsewaPay} disabled={!!loadingMethod}>
          {loadingMethod === 'esewa' ? 'Redirecting...' : 'Pay with eSewa'}
        </button>
        <button type="button" onClick={onManualConfirm} disabled={!!loadingMethod}>
          {loadingMethod === 'manual' ? 'Confirming...' : 'Confirm Payment (Presentation Fallback)'}
        </button>
      </div>

      <article className="booking-detail-card" style={{ marginTop: '16px' }}>
        <h3>Sandbox Credentials</h3>
        <p>Khalti phone: 9800000000 to 9800000005 | MPIN: 1111 | OTP: 987654</p>
        <p>eSewa ID: 9806800001 | password: Nepal@123 | MPIN: 1122</p>
        <p>Manual confirm works only when backend ALLOW_MANUAL_CONFIRM=true.</p>
      </article>
    </section>
  )
}

export default PaymentPage
