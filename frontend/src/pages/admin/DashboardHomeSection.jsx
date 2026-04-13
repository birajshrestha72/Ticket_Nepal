import { useMemo } from 'react'
import PropTypes from 'prop-types'

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value) => {
  return `Rs. ${toNumber(value).toLocaleString('en-US')}`
}

const titleCase = (value) => {
  const words = String(value || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .trim()
    .split(/\s+/)

  return words
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const DashboardHomeSection = ({
  analytics,
  bookings,
  buses,
  routes,
  schedules,
  reviews,
  onQuickNavigate,
}) => {
  const statusStats = useMemo(() => {
    const counts = bookings.reduce((acc, booking) => {
      const key = String(booking.status || 'unknown').toLowerCase()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((left, right) => right.count - left.count)
  }, [bookings])

  const topRoutes = useMemo(() => {
    return [...routes]
      .sort((left, right) => {
        const leftActive = left.is_active ? 1 : 0
        const rightActive = right.is_active ? 1 : 0
        if (leftActive !== rightActive) {
          return rightActive - leftActive
        }
        return toNumber(right.distance_km) - toNumber(left.distance_km)
      })
      .slice(0, 5)
  }, [routes])

  const latestBookings = useMemo(() => {
    return [...bookings]
      .sort((left, right) => toNumber(right.booking_id) - toNumber(left.booking_id))
      .slice(0, 5)
  }, [bookings])

  const recentReviews = useMemo(() => {
    return [...reviews].slice(0, 4)
  }, [reviews])

  const reviewSummary = useMemo(() => {
    if (reviews.length === 0) {
      return { average: 0, total: 0 }
    }

    const total = reviews.reduce((sum, review) => sum + toNumber(review.rating), 0)
    const average = total / reviews.length
    return {
      average,
      total: reviews.length,
    }
  }, [reviews])

  const kpis = [
    {
      label: 'Total Bookings',
      value: toNumber(analytics?.total_bookings ?? bookings.length).toLocaleString('en-US'),
      hint: `${bookings.length} loaded records`,
    },
    {
      label: 'Revenue',
      value: formatCurrency(analytics?.total_revenue),
      hint: 'From completed/confirmed activity',
    },
    {
      label: 'Occupancy',
      value: `${toNumber(analytics?.occupancy_rate ?? 0).toFixed(1)}%`,
      hint: `${toNumber(analytics?.booked_seats)} seats booked`,
    },
    {
      label: 'Active Fleet',
      value: `${toNumber(analytics?.active_buses ?? buses.filter((item) => item.is_active).length)} / ${toNumber(analytics?.total_buses ?? buses.length)}`,
      hint: 'Buses currently active',
    },
    {
      label: 'Active Routes',
      value: `${toNumber(analytics?.active_routes ?? routes.filter((item) => item.is_active).length)} / ${toNumber(analytics?.total_routes ?? routes.length)}`,
      hint: 'Published route network',
    },
    {
      label: 'Schedules Running',
      value: `${toNumber(analytics?.active_schedules ?? schedules.filter((item) => item.is_active).length)} / ${toNumber(analytics?.total_schedules ?? schedules.length)}`,
      hint: 'Operational schedules',
    },
  ]

  return (
    <div className="admin-section dashboard-home-section">
      <div className="dashboard-home-top">
        <h2>Dashboard Home</h2>
        <p>Live operational snapshot and insights across bookings, routes, schedules, and customer feedback.</p>
      </div>

      <div className="dashboard-kpi-grid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="dashboard-kpi-card">
            <p className="kpi-label">{kpi.label}</p>
            <p className="kpi-value">{kpi.value}</p>
            <p className="kpi-hint">{kpi.hint}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-insight-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Booking Status Mix</h3>
            <button type="button" className="admin-mini-btn" onClick={() => onQuickNavigate('bookings')}>
              Open Bookings
            </button>
          </div>
          {statusStats.length === 0 ? (
            <p className="admin-info">No bookings available yet.</p>
          ) : (
            <ul className="dashboard-stat-list">
              {statusStats.map((item) => (
                <li key={item.status}>
                  <span>{titleCase(item.status)}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Top Routes</h3>
            <button type="button" className="admin-mini-btn" onClick={() => onQuickNavigate('routes')}>
              Open Routes
            </button>
          </div>
          {topRoutes.length === 0 ? (
            <p className="admin-info">No routes available yet.</p>
          ) : (
            <ul className="dashboard-route-list">
              {topRoutes.map((route) => (
                <li key={route.route_id}>
                  <div>
                    <p>{route.from_city} → {route.to_city}</p>
                    <small>{toNumber(route.distance_km)} km</small>
                  </div>
                  <span className={`route-state ${route.is_active ? 'active' : 'inactive'}`}>
                    {route.is_active ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="dashboard-insight-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Latest Bookings</h3>
            <button type="button" className="admin-mini-btn" onClick={() => onQuickNavigate('bookings')}>
              Review
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bus</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {latestBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No booking activity yet.</td>
                  </tr>
                ) : (
                  latestBookings.map((booking) => (
                    <tr key={booking.booking_id}>
                      <td>{booking.booking_id}</td>
                      <td>{booking.bus_name || 'N/A'}</td>
                      <td>{booking.journey_date || '-'}</td>
                      <td>{titleCase(booking.status)}</td>
                      <td>{formatCurrency(booking.total_amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h3>Review Health</h3>
            <button type="button" className="admin-mini-btn" onClick={() => onQuickNavigate('reviews')}>
              Open Reviews
            </button>
          </div>
          <div className="review-health-metric">
            <p className="kpi-value">{reviewSummary.average.toFixed(1)} / 5</p>
            <p className="kpi-hint">Average rating from {reviewSummary.total} review(s)</p>
          </div>
          <ul className="dashboard-review-list">
            {recentReviews.length === 0 ? (
              <li>No reviews yet.</li>
            ) : (
              recentReviews.map((review) => (
                <li key={review.review_id}>
                  <span>{review.ride?.route || 'Unknown route'}</span>
                  <strong>{toNumber(review.rating).toFixed(1)}</strong>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>

      <div className="dashboard-quick-actions">
        <button type="button" className="admin-tab" onClick={() => onQuickNavigate('buses')}>Manage Buses</button>
        <button type="button" className="admin-tab" onClick={() => onQuickNavigate('schedules')}>Manage Schedules</button>
        <button type="button" className="admin-tab" onClick={() => onQuickNavigate('seats')}>Seat Management</button>
        <button type="button" className="admin-tab" onClick={() => onQuickNavigate('analytics')}>Open Analytics</button>
      </div>
    </div>
  )
}

export default DashboardHomeSection

const bookingShape = PropTypes.shape({
  booking_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  bus_name: PropTypes.string,
  journey_date: PropTypes.string,
  total_amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  status: PropTypes.string,
})

const analyticsShape = PropTypes.shape({
  total_bookings: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  booked_seats: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  active_buses: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  active_routes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  active_schedules: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  total_revenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  occupancy_rate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  total_buses: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  total_routes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  total_schedules: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
})

const routeShape = PropTypes.shape({
  route_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  from_city: PropTypes.string,
  to_city: PropTypes.string,
  distance_km: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  is_active: PropTypes.bool,
})

const scheduleShape = PropTypes.shape({
  schedule_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  is_active: PropTypes.bool,
})

const reviewShape = PropTypes.shape({
  review_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ride: PropTypes.shape({
    route: PropTypes.string,
  }),
})

const busShape = PropTypes.shape({
  bus_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  is_active: PropTypes.bool,
})

DashboardHomeSection.propTypes = {
  analytics: analyticsShape,
  bookings: PropTypes.arrayOf(bookingShape).isRequired,
  buses: PropTypes.arrayOf(busShape).isRequired,
  routes: PropTypes.arrayOf(routeShape).isRequired,
  schedules: PropTypes.arrayOf(scheduleShape).isRequired,
  reviews: PropTypes.arrayOf(reviewShape).isRequired,
  onQuickNavigate: PropTypes.func,
}

DashboardHomeSection.defaultProps = {
  analytics: null,
  onQuickNavigate: () => {},
}
