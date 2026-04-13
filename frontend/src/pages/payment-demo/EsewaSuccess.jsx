import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { verifyEsewaDemo } from '../../api/paymentDemoApi'

const parseEsewaDataParam = (rawValue) => {
  if (!rawValue) {
    return null
  }

  try {
    const normalized = String(rawValue).replaceAll(' ', '+')
    const decoded = atob(normalized)
    const payload = JSON.parse(decoded)
    return {
      transactionUuid: payload?.transaction_uuid,
      totalAmount: payload?.total_amount,
    }
  } catch {
    return null
  }
}

const EsewaSuccess = () => {
  const [params] = useSearchParams()
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    let transactionUuid = params.get('transaction_uuid')
    let totalAmount = params.get('total_amount')

    if (!transactionUuid || !totalAmount) {
      const decoded = parseEsewaDataParam(params.get('data'))
      transactionUuid = decoded?.transactionUuid || transactionUuid
      totalAmount = decoded?.totalAmount || totalAmount
    }

    if (!transactionUuid || !totalAmount) {
      setState({ loading: false, error: 'Missing transaction_uuid or total_amount in callback', data: null })
      return
    }

    verifyEsewaDemo(transactionUuid, totalAmount)
      .then((data) => {
        if (data.status !== 'success') {
          throw new Error(`Payment status: ${data.status}`)
        }
        setState({ loading: false, error: '', data })
      })
      .catch((err) => {
        setState({ loading: false, error: err.message || 'Verification failed', data: null })
      })
  }, [params])

  return (
    <section className="container page-shell">
      <h1>eSewa Verification</h1>
      {state.loading && <p>Verifying payment...</p>}
      {state.error && <p className="admin-error">{state.error}</p>}
      {state.data && <p className="admin-success">Payment verified successfully for {state.data.transaction_id}</p>}
      <Link to="/demo/payment">Back to Demo Payment</Link>
    </section>
  )
}

export default EsewaSuccess
