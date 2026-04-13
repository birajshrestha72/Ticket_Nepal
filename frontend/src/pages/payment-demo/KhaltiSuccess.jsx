import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { verifyKhaltiDemo } from '../../api/paymentDemoApi'

const KhaltiSuccess = () => {
  const [params] = useSearchParams()
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    const pidx = params.get('pidx')
    if (!pidx) {
      setState({ loading: false, error: 'Missing pidx in callback', data: null })
      return
    }

    verifyKhaltiDemo(pidx)
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
      <h1>Khalti Verification</h1>
      {state.loading && <p>Verifying payment...</p>}
      {state.error && <p className="admin-error">{state.error}</p>}
      {state.data && <p className="admin-success">Payment verified successfully for {state.data.transaction_id}</p>}
      <Link to="/demo/payment">Back to Demo Payment</Link>
    </section>
  )
}

export default KhaltiSuccess
