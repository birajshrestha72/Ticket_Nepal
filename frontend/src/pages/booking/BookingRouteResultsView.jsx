import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { fetchActiveBuses } from '../../api/bookingApi'
import '../../css/bookingFlow.css'

const BookingRouteResultsView = () => {
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [buses, setBuses] = useState([])

  const query = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const to = params.get('to') || params.get('destination') || ''
    return {
      from: params.get('from') || '',
      to,
      date: params.get('date') || '',
    }
  }, [location.search])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const list = await fetchActiveBuses()
        setBuses(list)
      } catch (err) {
        setError(err.message || 'Unable to load buses')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const matches = useMemo(() => {
    return buses.filter((item) => {
      const fromPass = !query.from || item.from_city === query.from
      const toPass = !query.to || item.to_city === query.to
      return fromPass && toPass
    })
  }, [buses, query])

  return (
    <section className="container page-shell booking-flow-page">
      <h1>Route Buses</h1>
      <p>
        From: <strong>{query.from || '-'}</strong> | To: <strong>{query.to || '-'}</strong> | Date:{' '}
        <strong>{query.date || '-'}</strong>
      </p>

      {loading && <p className="admin-info">Loading buses...</p>}
      {error && <p className="admin-error">{error}</p>}

      <div className="booking-results-grid">
        {!loading && !error && matches.length === 0 && (
          <article className="booking-result-card">
            <h3>No buses found for this route</h3>
            <Link to="/" className="btn-book">Search from Home</Link>
          </article>
        )}

        {!loading && !error && matches.map((item) => (
          <article className="booking-result-card" key={item.bus_id}>
            <h3>{item.bus_name}</h3>
            <p><strong>Vendor:</strong> {item.vendor_name || `${item.bus_type} Operator`}</p>
            <p><strong>Origin:</strong> {item.from_city || query.from || '-'}</p>
            <p><strong>Destination:</strong> {item.to_city || query.to || '-'}</p>
            <p><strong>Bus Type:</strong> {item.bus_type}</p>
            <p><strong>Price:</strong> Rs. {Number(item.price || 0).toFixed(0)}</p>
            <p><strong>Seats:</strong> {item.seat_capacity || 0}</p>
            <Link
              className="btn-book"
              to={`/booking/seats?busId=${item.bus_id}&date=${query.date}`}
            >
              Select Seats
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default BookingRouteResultsView
