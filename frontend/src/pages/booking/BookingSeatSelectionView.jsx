import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import {
  fetchRefundEstimate,
  fetchSeatAvailability,
  fetchUserBookings,
  replaceBookingSeats,
} from '../../api/bookingApi'
import '../../css/bookingFlow.css'

const BookingSeatSelectionView = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [availability, setAvailability] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [originalSeats, setOriginalSeats] = useState([])
  const [estimate, setEstimate] = useState(null)
  const [initializedModifyState, setInitializedModifyState] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [seatFilter, setSeatFilter] = useState('all')

  const query = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return {
      busId: params.get('busId') || '',
      date: params.get('date') || new Date().toISOString().slice(0, 10),
      bookingId: params.get('bookingId') || '',
    }
  }, [location.search])

  const isModifyMode = Boolean(query.bookingId)

  const loadAvailability = useCallback(async () => {
    if (!query.busId || !query.date) {
      setError('Missing bus or journey date')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await fetchSeatAvailability(
        query.busId,
        query.date,
        query.bookingId || null,
        user?.user_id || null,
      )
      setAvailability(data)
      setLastUpdatedAt(new Date())

      if (isModifyMode && user?.user_id && !initializedModifyState) {
        const bookings = await fetchUserBookings(user.user_id)
        const current = bookings.find((item) => String(item.booking_id) === String(query.bookingId))
        if (!current) {
          throw new Error('Booking not found for modification')
        }

        const currentSeats = current.seat_labels || []
        setOriginalSeats(currentSeats)
        setSelectedSeats(currentSeats)
        setInitializedModifyState(true)
      }
    } catch (err) {
      setError(err.message || 'Failed to load seat map')
    } finally {
      setLoading(false)
    }
  }, [query.busId, query.date, query.bookingId, user?.user_id, isModifyMode, initializedModifyState])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  useEffect(() => {
    const timer = setInterval(() => {
      loadAvailability()
    }, 5000)
    return () => clearInterval(timer)
  }, [loadAvailability])

  const seatStats = useMemo(() => {
    const stats = {
      total: 0,
      available: 0,
      booked: 0,
      sold: 0,
      blocked: 0,
      mine: 0,
      disabled: 0,
    }

    if (!availability?.seats) {
      return stats
    }

    availability.seats.forEach((seat) => {
      const status = (seat.status || '').toLowerCase()
      if (!seat.is_active || status === 'disabled') {
        stats.disabled += 1
        return
      }

      stats.total += 1
      if (status === 'sold') {
        stats.sold += 1
      } else if (status === 'blocked') {
        stats.blocked += 1
      } else if (status === 'booked') {
        stats.booked += 1
      } else if (status === 'mine') {
        stats.mine += 1
      } else {
        stats.available += 1
      }
    })

    return stats
  }, [availability])

  const removedSeats = useMemo(() => {
    const selected = new Set(selectedSeats)
    return originalSeats.filter((label) => !selected.has(label))
  }, [originalSeats, selectedSeats])

  const visibleActiveSeatCount = useMemo(() => {
    if (!availability?.seats) {
      return 0
    }
    return availability.seats.filter((seat) => {
      const status = String(seat.status || '').toLowerCase()
      return seat.is_active && status !== 'blocked' && status !== 'disabled'
    }).length
  }, [availability])

  const seatCellSize = useMemo(() => {
    const rows = Number(availability?.seat_layout_rows || 0)
    if (rows >= 14 || visibleActiveSeatCount >= 44) {
      return 36
    }
    if (rows >= 10 || visibleActiveSeatCount >= 34) {
      return 40
    }
    if (rows <= 7 && visibleActiveSeatCount <= 24) {
      return 50
    }
    return 44
  }, [availability, visibleActiveSeatCount])

  const seatGridCells = useMemo(() => {
    if (!availability?.seats) {
      return []
    }

    const rows = Number(availability.seat_layout_rows || 0)
    const cols = Number(availability.seat_layout_cols || 0)
    const hasMiddleAisle = cols >= 3
    const leftBlockCount = Math.ceil(cols / 2)
    const seatMap = new Map(
      availability.seats.map((seat) => [`${seat.row_index}-${seat.col_index}`, seat]),
    )

    const cells = []
    for (let rowIndex = 1; rowIndex <= rows; rowIndex += 1) {
      let renderedInRow = 0
      for (let colIndex = cols; colIndex >= 1; colIndex -= 1) {
        const key = `${rowIndex}-${colIndex}`
        const seat = seatMap.get(key)
        cells.push({ key, seat })
        renderedInRow += 1

        if (hasMiddleAisle && renderedInRow === leftBlockCount) {
          cells.push({ key: `aisle-${rowIndex}`, seat: null, isAisle: true })
        }
      }
    }

    return cells
  }, [availability])

  useEffect(() => {
    const loadEstimate = async () => {
      if (!isModifyMode || !user?.user_id || removedSeats.length === 0) {
        setEstimate(null)
        return
      }

      try {
        const data = await fetchRefundEstimate(query.bookingId, user.user_id, removedSeats)
        setEstimate(data)
      } catch {
        setEstimate(null)
      }
    }

    loadEstimate()
  }, [isModifyMode, query.bookingId, user?.user_id, removedSeats])

  const toggleSeat = (seat) => {
    if (seat.status !== 'available' && seat.status !== 'mine') return

    setSelectedSeats((prev) => {
      if (prev.includes(seat.seat_label)) {
        return prev.filter((value) => value !== seat.seat_label)
      }

      const maxSeats = Number(availability?.max_selectable_seats || 10)
      if (prev.length >= maxSeats) {
        setError(`You can select up to ${maxSeats} seats for this bus in one transaction.`)
        return prev
      }
      setError('')
      return [...prev, seat.seat_label]
    })
  }

  const totalPrice = useMemo(() => {
    const fare = Number(availability?.schedule?.fare || 0)
    return selectedSeats.length * fare
  }, [selectedSeats, availability])

  const proceedToPayment = () => {
    if (!availability || selectedSeats.length === 0) return

    const params = new URLSearchParams()
    params.set('busId', String(availability.bus.bus_id))
    params.set('date', String(availability.journey_date))
    params.set('tripId', String(availability.schedule.schedule_id))
    params.set('seats', selectedSeats.join(','))
    params.set('total', String(totalPrice))
    navigate(`/booking/payment?${params.toString()}`)
  }

  const applyModification = async () => {
    if (!isModifyMode || !query.bookingId || !user?.user_id) return

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const data = await replaceBookingSeats(query.bookingId, {
        user_id: user.user_id,
        seat_labels: selectedSeats,
      })

      const settlement = data.settlement || {}
      const refundAmount = Number(settlement.refund?.refund_amount || 0)
      const additionalAmount = Number(settlement.additional_amount || 0)
      const netPayable = Number(settlement.net_payable || 0)

      setSuccess(
        `Booking updated. Refund: Rs. ${refundAmount.toFixed(0)}, Additional: Rs. ${additionalAmount.toFixed(0)}, Net: Rs. ${netPayable.toFixed(0)}.`,
      )
      setOriginalSeats(selectedSeats)
      await loadAvailability()
    } catch (err) {
      setError(err.message || 'Failed to update booking seats')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="container page-shell booking-flow-page">
      <div className="seat-selection-header">
        <h1>Select Your Seats</h1>
        {isModifyMode && (
          <p className="modify-mode-badge">
            You are modifying an existing booking - add or remove seats
          </p>
        )}
      </div>

      {!query.busId && (
        <p className="admin-error">
          Missing bus selection. <Link to="/search">Go back to search</Link>
        </p>
      )}

      {loading && <p className="admin-info">Loading seat map...</p>}
      {error && <p className="admin-error">{error}</p>}
      {success && <p className="admin-success">{success}</p>}

      {availability && (
          <div className="seat-selection-layout">
            {/* Bus Details Card */}
            <article className="booking-detail-card seat-detail-card">
              <div className="detail-header">
                <div className="route-info">
                  <h3>{availability.route.from_city}</h3>
                  <span className="arrow">→</span>
                  <h3>{availability.route.to_city}</h3>
                </div>
                <span className="bus-type-badge">{availability.bus.bus_type || 'Standard'}</span>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Bus:</span>
                  <span className="value">{availability.bus.bus_registration_number}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Operator:</span>
                  <span className="value">{availability.bus.vendor_name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Departure:</span>
                  <span className="value">{availability.schedule.departure_time}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Arrival:</span>
                  <span className="value">{availability.schedule.arrival_time}</span>
                </div>
                <div className="detail-item highlighted">
                  <span className="label">Price/Seat:</span>
                  <span className="value">Rs. {Number(availability.schedule.fare).toFixed(0)}</span>
                </div>
                <div className="detail-item highlighted">
                  <span className="label">Date:</span>
                  <span className="value">{availability.journey_date}</span>
                </div>
              </div>
            </article>

            {/* Seat Selection Area */}
            <div className="seat-selection-area">
              <div className="seat-map-wrap">
                <div className="seat-live-toolbar">
                  <div className="seat-status-legend">
                    <span className="pill available">
                      <span className="color-dot"></span>Available {seatStats.available}
                    </span>
                    <span className="pill booked">
                      <span className="color-dot"></span>Booked {seatStats.booked}
                    </span>
                    <span className="pill sold">
                      <span className="color-dot"></span>Sold {seatStats.sold}
                    </span>
                    {seatStats.mine > 0 && (
                      <span className="pill mine">
                        <span className="color-dot"></span>My Seats {seatStats.mine}
                      </span>
                    )}
                  </div>
                  <div className="seat-live-actions">
                    <select value={seatFilter} onChange={(e) => setSeatFilter(e.target.value)}>
                      <option value="all">Show All Visible Seats</option>
                      <option value="available">Available Only</option>
                      <option value="booked">Booked Only</option>
                      <option value="sold">Sold Only</option>
                    </select>
                    <button type="button" onClick={loadAvailability} className="refresh-btn">
                      Refresh
                    </button>
                  </div>
                </div>
                {lastUpdatedAt && (
                  <p className="seat-live-meta">
                    Live seat availability. Last updated {lastUpdatedAt.toLocaleTimeString()}
                  </p>
                )}
                <div className="customer-bus-shell">
                  <div className="customer-bus-head">
                    <span className="driver-label">Driver</span>
                    <span className="front-label">Front</span>
                  </div>
                  <div
                    className="seat-map-grid"
                    style={{
                      '--seat-cell-size': `${seatCellSize}px`,
                      gridTemplateColumns: `repeat(${Number(availability.seat_layout_cols || 1) >= 3 ? Number(availability.seat_layout_cols || 1) + 1 : Number(availability.seat_layout_cols || 1)}, minmax(${seatCellSize}px, 1fr))`,
                    }}
                  >
                    {seatGridCells.map((cell) => {
                      if (cell.isAisle) {
                        return (
                          <div
                            key={cell.key}
                            className="seat-item seat-item-aisle-marker"
                            aria-label="Aisle"
                            title="Aisle"
                          />
                        )
                      }

                      if (!cell.seat) {
                        return (
                          <div
                            key={cell.key}
                            className="seat-item seat-item-empty"
                            aria-hidden="true"
                          />
                        )
                      }

                      const seatStatus = String(cell.seat.status || '').toLowerCase()
                      if (!cell.seat.is_active || seatStatus === 'disabled' || seatStatus === 'blocked') {
                        return (
                          <div key={cell.key} className="seat-item seat-item-hidden" aria-hidden="true" />
                        )
                      }

                      const selected = selectedSeats.includes(cell.seat.seat_label)
                      const statusName = seatStatus
                      const isDimmed = seatFilter !== 'all' && statusName !== seatFilter && statusName !== 'mine'
                      return (
                        <button
                          key={cell.key}
                          type="button"
                          className={`seat-item ${cell.seat.status} ${selected ? 'selected' : ''} ${isDimmed ? 'seat-item-dimmed' : ''}`}
                          disabled={
                            cell.seat.status === 'booked'
                            || cell.seat.status === 'sold'
                            || cell.seat.status === 'blocked'
                          }
                          onClick={() => toggleSeat(cell.seat)}
                          title={
                            cell.seat.status === 'blocked' && cell.seat.block_reason
                              ? `${cell.seat.seat_label} (blocked: ${cell.seat.block_reason})`
                              : `${cell.seat.seat_label} (${cell.seat.status})`
                          }
                        >
                          {cell.seat.seat_label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="customer-bus-tail">Entry</div>
                </div>
              </div>

              {/* Seat Summary Panel */}
              <div className="seat-selection-summary">
                <div className="summary-card">
                  <h3>Your Selection</h3>
                  <div className="selection-main">
                    <div className="selected-count">
                      <span className="count-number">{selectedSeats.length}</span>
                      <span className="count-label">
                        {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
                      </span>
                    </div>
                    <div className="selected-seats-display">
                      {selectedSeats.length > 0 ? (
                        <div className="seats-list">
                          {selectedSeats.map((seat) => (
                            <span key={seat} className="seat-badge">
                              {seat}
                              <button
                                type="button"
                                className="remove-seat"
                                onClick={() => setSelectedSeats(selectedSeats.filter((s) => s !== seat))}
                                title={`Remove ${seat}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="no-selection">Click on available seats to select</p>
                      )}
                    </div>
                  </div>

                  {isModifyMode && (
                    <div className="modification-panel">
                      <h4>Modification Details</h4>
                      <div className="modification-rows">
                        <div className="mod-detail">
                          <span className="mod-label">Original:</span>
                          <span className="mod-value">{originalSeats.join(', ') || '—'}</span>
                        </div>
                        <div className="mod-detail">
                          <span className="mod-label">Current:</span>
                          <span className="mod-value">{selectedSeats.join(', ') || '—'}</span>
                        </div>
                        {removedSeats.length > 0 && (
                          <div className="mod-detail">
                            <span className="mod-label">Removing:</span>
                            <span className="mod-value removed">{removedSeats.join(', ')}</span>
                          </div>
                        )}
                        {estimate && (
                          <div className="mod-detail refund">
                            <span className="mod-label">Refund:</span>
                            <span className="mod-value">
                              Rs. {Number(estimate.refund_amount || 0).toFixed(0)}
                              <small>({estimate.refund_percent || 0}%)</small>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="price-summary">
                    <div className="price-row">
                      <span>Price per Seat:</span>
                      <strong>Rs. {Number(availability.schedule.fare).toFixed(0)}</strong>
                    </div>
                    <div className="price-row">
                      <span>Number of Seats:</span>
                      <strong>{selectedSeats.length}</strong>
                    </div>
                    <div className="price-row total">
                      <span>Total Price:</span>
                      <strong>Rs. {totalPrice.toFixed(0)}</strong>
                    </div>
                  </div>

                  <div className="action-buttons">
                    {isModifyMode ? (
                      <button
                        type="button"
                        disabled={saving || selectedSeats.length > Number(availability.max_selectable_seats || 10)}
                        onClick={applyModification}
                        className="btn btn-primary"
                      >
                        {saving ? 'Updating...' : 'Update Seats'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={selectedSeats.length === 0}
                        onClick={proceedToPayment}
                        className="btn btn-primary"
                      >
                        Proceed to Payment
                      </button>
                    )}
                    <Link to="/search" className="btn btn-secondary">
                      Back to Search
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </section>
  )
}

export default BookingSeatSelectionView
