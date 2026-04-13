import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const KhaltiQuickDemo = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleKhaltiPayment = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/payments/khalti/initiate`, {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to initiate Khalti payment')
      }

      if (!data.payment_url) {
        throw new Error('Khalti payment_url missing in response')
      }

      // Required demo behavior: redirect user to Khalti hosted wallet page.
      globalThis.location.href = data.payment_url
    } catch (err) {
      setError(err.message || 'Khalti payment initiation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container page-shell booking-flow-page">
      <h1>Khalti Quick Demo</h1>
      <p>One-click sandbox redirect to Khalti wallet login.</p>
      {error && <p className="admin-error">{error}</p>}
      <button type="button" onClick={handleKhaltiPayment} disabled={loading}>
        {loading ? 'Redirecting...' : 'Pay With Khalti (Demo)'}
      </button>
    </section>
  )
}

export default KhaltiQuickDemo
