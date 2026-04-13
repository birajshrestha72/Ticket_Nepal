import { Link, useSearchParams } from 'react-router-dom'

const Failure = () => {
  const [params] = useSearchParams()
  const status = params.get('status') || 'failed'
  const transactionId = params.get('transaction_id') || '-'

  return (
    <section className="container page-shell">
      <h1>Payment Result</h1>
      <p>Status: {status}</p>
      <p>Transaction ID: {transactionId}</p>
      <Link to="/demo/payment">Back to Demo Payment</Link>
    </section>
  )
}

export default Failure
