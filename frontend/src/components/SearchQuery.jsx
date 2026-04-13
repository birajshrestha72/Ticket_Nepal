import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import { fetchSearchLocations } from '../api/bookingApi'
import '../css/searchQuery.css'

const todayLocalIso = () => {
  const now = new Date()
  const tzOffsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

const SearchQuery = ({ variant = 'default' }) => {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [locations, setLocations] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [cityError, setCityError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true)
      setCityError('')
      try {
        const list = await fetchSearchLocations()
        setLocations(list)
      } catch (err) {
        setCityError(err.message || 'Failed to load locations')
        setLocations([])
      } finally {
        setLoadingCities(false)
      }
    }

    loadCities()
  }, [])

  const origins = useMemo(() => {
    return [...new Set(locations.map((item) => item.from_city).filter(Boolean))].sort((left, right) => (
      String(left).localeCompare(String(right), 'en', { sensitivity: 'base' })
    ))
  }, [locations])

  const destinations = useMemo(() => {
    const base = from ? locations.filter((item) => item.from_city === from) : locations
    return [...new Set(base.map((item) => item.to_city).filter(Boolean))].sort((left, right) => (
      String(left).localeCompare(String(right), 'en', { sensitivity: 'base' })
    ))
  }, [locations, from])

  useEffect(() => {
    if (!to) {
      return
    }
    const stillAvailable = destinations.includes(to)
    if (!stillAvailable) {
      setTo('')
    }
  }, [destinations, to])

  const onSubmit = (e) => {
    e.preventDefault()
    const minDate = todayLocalIso()
    if (date.trim() && date.trim() < minDate) {
      setCityError('Journey date cannot be in the past')
      return
    }
    const params = new URLSearchParams()
    if (from.trim()) params.set('from', from.trim())
    if (to.trim()) params.set('to', to.trim())
    if (date.trim()) params.set('date', date.trim())
    navigate(`/search?${params.toString()}`)
  }

  return (
    <form className={`search-query ${variant}`} onSubmit={onSubmit}>
      <select
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        disabled={loadingCities}
        required
      >
        <option value="">{loadingCities ? 'Loading origins...' : 'Select origin'}</option>
        {origins.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
      <select
        value={to}
        onChange={(e) => setTo(e.target.value)}
        disabled={loadingCities || destinations.length === 0}
        required
      >
        <option value="">{loadingCities ? 'Loading destinations...' : 'Select destination'}</option>
        {destinations.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
      <input type="date" value={date} min={todayLocalIso()} onChange={(e) => setDate(e.target.value)} />
      <button type="submit">Search Buses</button>
      {cityError && <p className="search-query-error">{cityError}</p>}
    </form>
  )
}

export default SearchQuery

SearchQuery.propTypes = {
  variant: PropTypes.string,
}

SearchQuery.defaultProps = {
  variant: 'default',
}
