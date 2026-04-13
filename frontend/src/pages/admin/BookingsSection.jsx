import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const PAGE_SIZE = 10

const compareValues = (left, right, dir = 'asc') => {
  const order = dir === 'asc' ? 1 : -1
  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * order
  }
  return String(left || '').localeCompare(String(right || ''), 'en', { sensitivity: 'base' }) * order
}

const BookingsSection = ({ bookings }) => {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const statuses = useMemo(() => {
    return [...new Set(bookings.map((item) => String(item.status || '')).filter(Boolean))]
      .sort((left, right) => String(left).localeCompare(String(right), 'en', { sensitivity: 'base' }))
  }, [bookings])

  const visibleBookings = useMemo(() => {
    const q = query.trim().toLowerCase()

    const filtered = bookings.filter((item) => {
      const statusPass = statusFilter === 'all' || String(item.status || '').toLowerCase() === statusFilter
      if (!statusPass) return false
      if (!q) return true

      const text = [
        item.booking_reference,
        item.user_name,
        item.bus_name,
        item.journey_date,
        item.status,
      ].join(' ').toLowerCase()
      return text.includes(q)
    })

    return [...filtered].sort((left, right) => {
      if (sortBy === 'id') return compareValues(Number(left.booking_id || 0), Number(right.booking_id || 0), sortDir)
      if (sortBy === 'amount') return compareValues(Number(left.total_amount || 0), Number(right.total_amount || 0), sortDir)
      if (sortBy === 'status') return compareValues(left.status, right.status, sortDir)
      return compareValues(left.journey_date, right.journey_date, sortDir)
    })
  }, [bookings, query, statusFilter, sortBy, sortDir])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, statusFilter, sortBy, sortDir, bookings.length])

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage)
    }
  }, [currentPage, safePage])

  const paginatedBookings = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return visibleBookings.slice(start, start + PAGE_SIZE)
  }, [safePage, visibleBookings])

  return (
    <div className="admin-section">
      <h2>Bookings</h2>
      <div className="table-filter-row">
        <input
          type="text"
          placeholder="Search booking/user/bus"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={String(status).toLowerCase()}>{status}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">Sort by date</option>
          <option value="id">Sort by booking id</option>
          <option value="amount">Sort by amount</option>
          <option value="status">Sort by status</option>
        </select>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Bus</th>
              <th>Date</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBookings.map((booking) => (
              <tr key={booking.booking_id}>
                <td>{booking.booking_id}</td>
                <td>{booking.user_name || booking.user_id || 'N/A'}</td>
                <td>{booking.bus_name}</td>
                <td>{booking.journey_date}</td>
                <td>{booking.seats || booking.number_of_seats || 0}</td>
                <td>Rs. {booking.total_amount || 0}</td>
                <td>{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <span className="table-pagination-meta">
          Showing {paginatedBookings.length} of {visibleBookings.length} booking(s)
        </span>
        <div className="table-pagination-controls">
          <button
            type="button"
            className="table-page-btn"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
          >
            Previous
          </button>
          <span className="table-page-indicator">Page {safePage} of {totalPages}</span>
          <button
            type="button"
            className="table-page-btn"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingsSection

const bookingShape = PropTypes.shape({
  booking_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  booking_reference: PropTypes.string,
  user_name: PropTypes.string,
  user_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  bus_name: PropTypes.string,
  journey_date: PropTypes.string,
  seats: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  number_of_seats: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  total_amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  status: PropTypes.string,
})

BookingsSection.propTypes = {
  bookings: PropTypes.arrayOf(bookingShape).isRequired,
}
