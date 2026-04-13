import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import '../css/busSearch.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const parseSearchParams = (search) => {
  const params = new URLSearchParams(search)
  return {
    from: params.get('from') || '',
    to: params.get('to') || '',
    date: params.get('date') || '',
    destination: params.get('destination') || '',
  }
}

const SearchPage = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [buses, setBuses] = useState([])

  const query = useMemo(() => {
    return parseSearchParams(location.search)
  }, [location.search])

  useEffect(() => {
    const loadBuses = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_BASE}/api/buses`)
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to load bus list')
        }

        const busList = Array.isArray(data) ? data : (data.buses || [])
        setBuses(busList)
      } catch (err) {
        setError(err.message || 'Unable to load buses')
      } finally {
        setLoading(false)
      }
    }

    loadBuses()
  }, [])

  const results = useMemo(() => {
    return buses.filter((bus) => {
      const fromPass = !query.from || bus.from_city?.toLowerCase().includes(query.from.toLowerCase())
      const toTerm = query.to || query.destination
      const toPass = !toTerm || bus.to_city?.toLowerCase().includes(toTerm.toLowerCase())
      return fromPass && toPass
    })
  }, [buses, query])

  const getBookingLink = (busId) => {
    const params = new URLSearchParams({ busId: String(busId) })
    if (query.date) {
      params.set('date', query.date)
    }
    return `/bookings?${params.toString()}`
  }

  return (
    <section className="container page-shell">
      <h1>Search Buses</h1>
      <p>Find active buses and continue to booking in one click.</p>
      <div className="query-preview">
        <p><strong>From:</strong> {query.from || '-'}</p>
        <p><strong>To:</strong> {query.to || '-'}</p>
        <p><strong>Date:</strong> {query.date || '-'}</p>
        <p><strong>Destination:</strong> {query.destination || '-'}</p>
      </div>

      {loading && <p className="admin-info">Loading buses...</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading && !error && (
        <div className="search-results-grid">
          {results.length === 0 ? (
            <article className="search-result-card">
              <h3>No buses found</h3>
              <p>Try changing from/to values or open all buses from Bus Details.</p>
              <Link className="btn-book" to="/bus-details">View All Bus Details</Link>
            </article>
          ) : (
            results.map((item) => (
              <article className="search-result-card" key={item.bus_id}>
                <div className="search-result-head">
                  <h3>{item.bus_name}</h3>
                  <span>{item.bus_type}</span>
                </div>
                <p>
                  <strong>Route:</strong> {item.from_city} {'->'} {item.to_city}
                </p>
                <p>
                  <strong>Price:</strong> Rs. {Number(item.price || 0).toFixed(0)} / seat
                </p>
                <p>
                  <strong>Available Seats:</strong> {item.seat_capacity || 0}
                </p>

                {user?.role === 'customer' ? (
                  <Link className="btn-book" to={getBookingLink(item.bus_id)}>
                    Continue to Booking
                  </Link>
                ) : (
                  <Link className="btn-book" to="/login">
                    Login to Book
                  </Link>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </section>
  )
}

export default SearchPage
