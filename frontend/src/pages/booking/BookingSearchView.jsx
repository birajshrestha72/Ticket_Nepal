import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { fetchSearchLocations } from '../../api/bookingApi'
import '../../css/bookingFlow.css'

const compareCities = (left, right) => String(left).localeCompare(String(right), 'en', { sensitivity: 'base' })
const todayLocalIso = () => {
  const now = new Date()
  const tzOffsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

const BookingSearchView = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [journeyDate, setJourneyDate] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const fromQuery = params.get('from') || ''
    const toQuery = params.get('to') || ''
    const dateQuery = params.get('date') || ''
    if (fromQuery) setFrom(fromQuery)
    if (toQuery) setTo(toQuery)
    if (dateQuery) setJourneyDate(dateQuery)
  }, [location.search])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const list = await fetchSearchLocations()
        setLocations(list)
      } catch (err) {
        setError(err.message || 'Unable to load route options')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const origins = useMemo(() => {
    return [...new Set(locations.map((item) => item.from_city).filter(Boolean))].sort(compareCities)
  }, [locations])

  const destinations = useMemo(() => {
    const base = from ? locations.filter((item) => item.from_city === from) : locations
    return [...new Set(base.map((item) => item.to_city).filter(Boolean))].sort(compareCities)
  }, [locations, from])

  const onSubmit = (e) => {
    e.preventDefault()
    const minDate = todayLocalIso()
    if (journeyDate && journeyDate < minDate) {
      setError('Journey date cannot be in the past')
      return
    }
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (journeyDate) params.set('date', journeyDate)
    navigate(`/booking/results?${params.toString()}`)
  }

  return (
    <section className="container page-shell booking-flow-page">
      <h1>Booking Search</h1>
      <p>Select route and travel date to see matching buses.</p>

      {loading && <p className="admin-info">Loading origin/destination options...</p>}
      {error && <p className="admin-error">{error}</p>}

      <form className="booking-search-form" onSubmit={onSubmit}>
        <label htmlFor="origin">Origin</label>
        <select id="origin" value={from} onChange={(e) => setFrom(e.target.value)} required>
          <option value="">Select origin</option>
          {origins.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <label htmlFor="destination">Destination</label>
        <select id="destination" value={to} onChange={(e) => setTo(e.target.value)} required>
          <option value="">Select destination</option>
          {destinations.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <label htmlFor="journeyDate">Journey Date</label>
        <input
          id="journeyDate"
          type="date"
          value={journeyDate}
          onChange={(e) => setJourneyDate(e.target.value)}
          min={todayLocalIso()}
          required
        />

        <button type="submit">Search Route Buses</button>
      </form>
    </section>
  )
}

export default BookingSearchView
