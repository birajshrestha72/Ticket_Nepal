import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../css/busSearch.css'
import acImage from '../assets/ac.png'
import acImage1 from '../assets/ac1.png'
import acImage2 from '../assets/ac2.png'
import deluxeImage from '../assets/delux.png'
import deluxeImage1 from '../assets/delux1.png'
import deluxeImage2 from '../assets/delux2.png'
import sleeperImage from '../assets/sleeper.png'
import sleeperImage1 from '../assets/sleeper1.png'
import sleeperImage2 from '../assets/sleeper2.png'
import standardImage from '../assets/standard.png'
import standardImage1 from '../assets/standard1.png'
import standardImage2 from '../assets/standard2.png'

const compareLabels = (left, right) => String(left).localeCompare(String(right), 'en', { sensitivity: 'base' })

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const BUS_IMAGE_GROUPS = {
  ac: [acImage, acImage1, acImage2],
  deluxe: [deluxeImage, deluxeImage1, deluxeImage2],
  sleeper: [sleeperImage, sleeperImage1, sleeperImage2],
  standard: [standardImage, standardImage1, standardImage2],
}

const resolveBusImage = (busType, busName, sequence = 0) => {
  const typeText = `${busType || ''} ${busName || ''}`.toLowerCase()

  if (typeText.includes('ac')) {
    return BUS_IMAGE_GROUPS.ac[sequence % BUS_IMAGE_GROUPS.ac.length]
  }
  if (typeText.includes('delux')) {
    return BUS_IMAGE_GROUPS.deluxe[sequence % BUS_IMAGE_GROUPS.deluxe.length]
  }
  if (typeText.includes('sleeper')) {
    return BUS_IMAGE_GROUPS.sleeper[sequence % BUS_IMAGE_GROUPS.sleeper.length]
  }

  return BUS_IMAGE_GROUPS.standard[sequence % BUS_IMAGE_GROUPS.standard.length]
}

const fetchBusesByType = async () => {
  const [busesRes, schedulesRes] = await Promise.all([
    fetch(`${API_BASE}/api/admin/buses`),
    fetch(`${API_BASE}/api/admin/schedules`),
  ])

  if (!busesRes.ok || !schedulesRes.ok) {
    throw new Error('Failed to fetch bus details')
  }

  const busesData = await busesRes.json()
  const schedulesData = await schedulesRes.json()
  const buses = busesData.buses || []
  const schedules = schedulesData.schedules || []

  return buses.reduce((acc, bus) => {
    const busType = bus.bus_type || 'Standard'
    const schedule = schedules.find((item) => item.bus_id === bus.bus_id)

    if (!acc[busType]) {
      acc[busType] = []
    }

    const departureRaw = schedule?.departure_time || ''
    const arrivalRaw = schedule?.arrival_time || ''
    const departureTime = departureRaw.includes('T') ? departureRaw.split('T')[1] : departureRaw || '--:--'
    const arrivalTime = arrivalRaw.includes('T') ? arrivalRaw.split('T')[1] : arrivalRaw || '--:--'

    const image = resolveBusImage(busType, bus.bus_name, acc[busType].length)

    acc[busType].push({
      id: bus.bus_id,
      image,
      busType,
      vendor: `${busType} Operator`,
      rating: 4.5,
      busNumber: bus.bus_name,
      from: bus.from_city,
      to: bus.to_city,
      departureTime,
      arrivalTime,
      amenities: [],
      availableSeats: bus.seat_capacity,
      seats: bus.seat_capacity,
      fare: schedule?.fare ?? bus.price,
    })

    return acc
  }, {})
}

const BusDetails = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busesByType, setBusesByType] = useState({})
  const [expandedTypes, setExpandedTypes] = useState(new Set())

  useEffect(() => {
    fetchAllBuses()
  }, [])

  const fetchAllBuses = async () => {
    setLoading(true)
    setError(null)

    try {
      const busesByTypeData = await fetchBusesByType()
      setBusesByType(busesByTypeData)
      setExpandedTypes(new Set())
    } catch (err) {
      setError(err.message || 'Failed to fetch bus details')
    } finally {
      setLoading(false)
    }
  }

  const toggleType = (busType) => {
    const next = new Set(expandedTypes)
    if (next.has(busType)) next.delete(busType)
    else next.add(busType)
    setExpandedTypes(next)
  }

  const expandAll = () => setExpandedTypes(new Set(Object.keys(busesByType)))
  const collapseAll = () => setExpandedTypes(new Set())

  if (loading) {
    return <div className="page search container"><div className="loading-container"><div className="spinner" /><p>Loading bus details...</p></div></div>
  }

  if (error) {
    return (
      <div className="page search container">
        <div className="error-container">
          <h3>Error Loading Buses</h3>
          <p>{error}</p>
          <button onClick={fetchAllBuses} className="btn-retry">Try Again</button>
        </div>
      </div>
    )
  }

  const busTypes = Object.keys(busesByType).sort(compareLabels)
  const totalBuses = Object.values(busesByType).reduce((sum, buses) => sum + buses.length, 0)

  return (
    <div className="page search container">
      <div className="search-container">
        <div className="bus-details-header">
          <h1 className="search-page-title">All Bus Details</h1>
          <p className="subtitle">{busTypes.length} bus types and {totalBuses} total buses</p>
        </div>

        <div className="type-controls">
          <button type="button" onClick={expandAll} className="btn-secondary">Expand All</button>
          <button type="button" onClick={collapseAll} className="btn-secondary">Collapse All</button>
        </div>

        {busTypes.length === 0 ? (
          <div className="no-results"><h3>No buses found</h3><p>No buses available in the system</p></div>
        ) : (
          <div className="bus-types-sections">
            {busTypes.map((busType) => {
              const buses = busesByType[busType]
              const isExpanded = expandedTypes.has(busType)

              return (
                <div key={busType} className="bus-type-section">
                  <button
                    type="button"
                    className="type-header"
                    onClick={() => toggleType(busType)}
                    aria-expanded={isExpanded}
                  >
                    <div className="type-info">
                      <h2 className="type-name">{busType}</h2>
                      <span className="type-count">{buses.length} buses</span>
                    </div>
                    <span className="toggle-btn">{isExpanded ? 'Hide' : 'Show'}</span>
                  </button>

                  {isExpanded && (
                    <div className="bus-details-list">
                      {buses.map((bus) => (
                        <div key={`${bus.id}-${bus.departureTime}`} className="bus-detail-card">
                          <div className="bus-card-image">
                            <img
                              src={bus.image}
                              alt={`${bus.busType} bus`}
                              onError={(e) => {
                                e.currentTarget.src = standardImage
                                e.currentTarget.onerror = null
                              }}
                            />
                            <div className="bus-type-overlay">{bus.busType}</div>
                          </div>

                          <div className="bus-card-content">
                            <div className="bus-vendor-info">
                              <h3 className="vendor-name">{bus.vendor}</h3>
                              <div className="bus-rating"><span className="rating-value">{bus.rating}</span></div>
                            </div>

                            <div className="bus-number">{bus.busNumber}</div>
                            <div className="bus-route-time">
                              <div className="route-info">
                                <span className="city">{bus.from}</span>
                                <span className="arrow" aria-hidden="true">&#8594;</span>
                                <span className="city">{bus.to}</span>
                              </div>
                              <div className="time-info">
                                <span className="time">{bus.departureTime}</span>
                                <span className="separator">-</span>
                                <span className="time">{bus.arrivalTime}</span>
                              </div>
                            </div>

                            <div className="bus-amenities">
                              {bus.amenities.map((amenity) => <span key={amenity} className="amenity-badge">{amenity}</span>)}
                            </div>

                            <div className="bus-bottom-info">
                              <div className="seats-info"><span className="seats-label">Available:</span><span className="seats-count">{bus.availableSeats}/{bus.seats} seats</span></div>
                              <div className="price-info"><span className="price">Rs. {bus.fare}</span><span className="price-label">per seat</span></div>
                            </div>

                            <Link to="/search" className="btn-book">Book Now</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default BusDetails
