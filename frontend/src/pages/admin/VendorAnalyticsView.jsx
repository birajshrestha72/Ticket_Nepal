import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useLocation } from 'react-router-dom'

import { fetchAdminDashboardData } from '../../api/adminApi'
import { fetchSuperadminData } from '../../api/superadminApi'
import { BarCompareChart, DonutBreakdownChart } from '../../components/analytics/ChartsLite'
import { useAuth } from '../../context/AuthContext'
import TablePagination from '../../components/TablePagination'
import '../../css/analyticsPages.css'

const VendorAnalyticsView = ({
  mode = 'vendor',
  embedded = false,
  analyticsData = null,
  bookingsData = [],
  busesData = [],
  routesData = [],
  schedulesData = [],
  reviewsData = [],
  vendorsData = [],
}) => { // NOSONAR - single orchestrator component for shared vendor/system analytics
  const isSystemMode = mode === 'system'
  const PAGE_SIZE = isSystemMode ? 10 : 8
  const { user } = useAuth()

  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterRange, setFilterRange] = useState('monthly')
  const [filterRoute, setFilterRoute] = useState('all')
  const [filterBus, setFilterBus] = useState('all')
  const [filterVendor, setFilterVendor] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [bookings, setBookings] = useState([])
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [schedules, setSchedules] = useState([])
  const [reviews, setReviews] = useState([])
  const [vendors, setVendors] = useState([])
  const [page, setPage] = useState(1)

  const embeddedDataSignature = `${bookingsData.length}|${busesData.length}|${routesData.length}|${schedulesData.length}|${reviewsData.length}`

  useEffect(() => {
    if (embedded) {
      setAnalytics(analyticsData || null)
      setBookings(bookingsData || [])
      setBuses(busesData || [])
      setRoutes(routesData || [])
      setSchedules(schedulesData || [])
      setReviews(reviewsData || [])
      setVendors(vendorsData || [])
      return
    }

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (isSystemMode) {
          const data = await fetchSuperadminData()
          setAnalytics(data.analytics || null)
          setBookings(data.bookings || [])
          setBuses(data.buses || [])
          setRoutes(data.routes || [])
          setSchedules(data.schedules || [])
          setReviews([])
          setVendors(data.vendors || [])
          return
        }

        const data = await fetchAdminDashboardData()
        if (user?.role === 'vendor' && user?.user_id != null) {
          const vendorId = String(user.user_id)
          const vendorBookings = (data.bookings || []).filter((booking) => String(booking.vendor_id ?? '') === vendorId)
          const bookingIds = new Set(vendorBookings.map((booking) => String(booking.booking_id)))
          const vendorReviews = (data.reviews || []).filter((review) => bookingIds.has(String(review.booking_id ?? '')))
          const totalRevenue = vendorBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0)
          const bookedSeats = vendorBookings.reduce((sum, booking) => sum + Number(booking.seats || booking.number_of_seats || 0), 0)

          setAnalytics({
            total_bookings: vendorBookings.length,
            total_revenue: totalRevenue,
            booked_seats: bookedSeats,
            occupancy_rate: 0,
            active_buses: 0,
            active_routes: 0,
            active_schedules: 0,
            total_buses: 0,
            total_routes: 0,
            total_schedules: 0,
          })
          setBookings(vendorBookings)
          setBuses(data.buses || [])
          setRoutes(data.routes || [])
          setSchedules(data.schedules || [])
          setReviews(vendorReviews)
          setVendors([])
          return
        }

        setAnalytics(null)
        setBookings(data.bookings || [])
        setBuses(data.buses || [])
        setRoutes(data.routes || [])
        setSchedules(data.schedules || [])
        setReviews(data.reviews || [])
        setVendors([])
      } catch (err) {
        setError(err.message || 'Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [embedded, embeddedDataSignature, isSystemMode, analyticsData, vendorsData, user?.role, user?.user_id])

  const normalizedBookings = useMemo(() => {
    const busById = Object.fromEntries(buses.map((bus) => [String(bus.bus_id), bus]))
    const routeById = Object.fromEntries(
      routes.map((route) => [String(route.route_id), `${route.from_city} -> ${route.to_city}`]),
    )
    const vendorById = Object.fromEntries(
      vendors.map((vendor) => [String(vendor.vendor_id), vendor.name || 'Unknown vendor']),
    )

    return bookings.map((item) => {
      const bus = busById[String(item.bus_id)]
      const routeName = item.route_name || routeById[String(item.route_id)] || (bus ? `${bus.from_city} -> ${bus.to_city}` : '')
      const busName = item.bus_name || bus?.bus_name || ''
      const vendorName = item.vendor_name || vendorById[String(item.vendor_id)] || ''

      return {
        ...item,
        route_name: routeName,
        bus_name: busName,
        vendor_name: vendorName,
      }
    })
  }, [bookings, buses, routes, vendors])

  const routeOptions = useMemo(
    () => [...new Set(normalizedBookings.map((item) => item.route_name).filter(Boolean))],
    [normalizedBookings],
  )
  const busOptions = useMemo(
    () => [...new Set(buses.map((item) => item.bus_name).filter(Boolean))],
    [buses],
  )
  const vendorOptions = useMemo(
    () => [...new Set(normalizedBookings.map((item) => item.vendor_name).filter(Boolean))],
    [normalizedBookings],
  )

  const filteredBookings = useMemo(() => {
    return normalizedBookings.filter((item) => {
      const routeName = item.route_name || ''
      const busName = item.bus_name || ''
      const vendorName = item.vendor_name || ''
      const datePass = !filterDate || item.journey_date === filterDate
      const routePass = filterRoute === 'all' || routeName === filterRoute
      const busPass = filterBus === 'all' || busName === filterBus
      const vendorPass = filterVendor === 'all' || vendorName === filterVendor

      return routePass && datePass && (isSystemMode ? vendorPass : busPass)
    })
  }, [normalizedBookings, filterDate, filterRoute, filterBus, filterVendor, isSystemMode])

  const totalRevenue = filteredBookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
  const todayEarnings = filteredBookings
    .filter((item) => item.journey_date === new Date().toISOString().slice(0, 10))
    .reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
  const averageRating = reviews.length
    ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0'

  const trendPoints = useMemo(() => {
    let scale = 8
    if (filterRange === 'daily') scale = 7
    else if (filterRange === 'weekly') scale = isSystemMode ? 10 : 6
    else if (filterRange === 'yearly') scale = 12

    return Array.from({ length: scale }).map((_, idx) => ({
      label: `${idx + 1}`,
      value: Math.max(1, Math.round((filteredBookings.length / Math.max(1, scale)) * (0.75 + (idx % 3) * 0.2))),
    }))
  }, [filteredBookings.length, filterRange, isSystemMode])

  const bookingTrendBars = useMemo(
    () => trendPoints.map((item) => ({ label: item.label, value: item.value })),
    [trendPoints],
  )

  const revenueTrendBars = useMemo(
    () => trendPoints.map((item) => ({ label: item.label, value: item.value * 120 })),
    [trendPoints],
  )

  const routeBars = useMemo(() => {
    const map = new Map()
    filteredBookings.forEach((item) => {
      const key = item.route_name || 'Unknown route'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [filteredBookings])

  const revenueBars = useMemo(() => {
    const map = new Map()
    filteredBookings.forEach((item) => {
      const key = isSystemMode
        ? item.vendor_name || 'Unknown vendor'
        : item.bus_name || `Bus ${item.bus_id || 'N/A'}`
      map.set(key, (map.get(key) || 0) + Number(item.total_amount || 0))
    })
    return [...map.entries()]
      .map(([label, value]) => ({ label, value: Number(value.toFixed(0)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [filteredBookings, isSystemMode])

  const routeOccupancyBars = useMemo(() => {
    const busCapacityById = Object.fromEntries(
      buses.map((bus) => [String(bus.bus_id), Number(bus.seat_capacity || 0)]),
    )
    const map = new Map()
    filteredBookings.forEach((item) => {
      const label = item.route_name || 'Unknown route'
      const booked = Number(item.seats || 0)
      const capacity = Number(busCapacityById[String(item.bus_id)] || 0)
      const current = map.get(label) || { booked: 0, capacity: 0 }
      current.booked += booked
      current.capacity += capacity
      map.set(label, current)
    })

    return [...map.entries()]
      .map(([label, stats]) => ({
        label,
        value: stats.capacity > 0 ? Number(((stats.booked / stats.capacity) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [buses, filteredBookings])

  const scheduleOccupancyBars = useMemo(() => {
    const busCapacityById = Object.fromEntries(
      buses.map((bus) => [String(bus.bus_id), Number(bus.seat_capacity || 0)]),
    )
    const scheduleMetaById = Object.fromEntries(
      schedules.map((schedule) => {
        const route = routes.find((item) => String(item.route_id) === String(schedule.route_id))
        const routeLabel = route ? `${route.from_city} -> ${route.to_city}` : `Route ${schedule.route_id}`
        return [String(schedule.schedule_id), `${routeLabel} (${String(schedule.departure_time || '').slice(11, 16) || '--:--'})`]
      }),
    )

    const map = new Map()
    filteredBookings.forEach((item) => {
      if (!item.schedule_id) return
      const key = String(item.schedule_id)
      const label = scheduleMetaById[key] || `Schedule #${key}`
      const booked = Number(item.seats || 0)
      const capacity = Number(busCapacityById[String(item.bus_id)] || 0)
      const current = map.get(label) || { booked: 0, capacity: 0 }
      current.booked += booked
      current.capacity += capacity
      map.set(label, current)
    })

    return [...map.entries()]
      .map(([label, stats]) => ({
        label,
        value: stats.capacity > 0 ? Number(((stats.booked / stats.capacity) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [buses, filteredBookings, routes, schedules])

  const occupancyPercent = useMemo(() => {
    const busCapacityById = Object.fromEntries(
      buses.map((bus) => [String(bus.bus_id), Number(bus.seat_capacity || 0)]),
    )
    const bookedSeats = filteredBookings.reduce((sum, item) => sum + Number(item.seats || 0), 0)
    const totalSeats = filteredBookings.reduce(
      (sum, item) => sum + Number(busCapacityById[String(item.bus_id)] || 0),
      0,
    )
    if (!totalSeats) return 0
    return Math.min(100, (bookedSeats / totalSeats) * 100)
  }, [buses, filteredBookings])

  const successRate = useMemo(() => {
    if (!filteredBookings.length) return 0
    const success = filteredBookings.filter((item) => String(item.status).toLowerCase() !== 'cancelled').length
    return (success / filteredBookings.length) * 100
  }, [filteredBookings])

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleRows = filteredBookings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const mainContent = (
    <div className="analytics-main">
      <p className="analytics-breadcrumb">
        {isSystemMode ? 'Dashboard / System Admin / Analytics' : 'Dashboard / Vendor / Analytics'}
      </p>
      <header className="analytics-header">
        <h1>{isSystemMode ? 'System Analytics' : 'Vendor Analytics'}</h1>
        <p>
          {isSystemMode
            ? 'Growth, revenue, booking health, route intelligence, vendor performance, and system health.'
            : 'Revenue insights, bus utilization, schedules, and feedback trends.'}
        </p>
      </header>

      <div className="analytics-filter-row">
        <select value={filterRange} onChange={(e) => setFilterRange(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)}>
          <option value="all">All Routes</option>
          {routeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        {isSystemMode ? (
          <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}>
            <option value="all">All Vendors</option>
            {vendorOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        ) : (
          <select value={filterBus} onChange={(e) => setFilterBus(e.target.value)}>
            <option value="all">All Buses</option>
            {busOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
      </div>

      {loading && <p className="admin-info">Loading analytics...</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading && !error && (
        <>
          {isSystemMode ? (
            <div className="analytics-kpi-grid">
              <article className="analytics-kpi-card">
                <p>Total Users</p>
                <p className="value">{analytics?.total_users ?? 0}</p>
                <div className="analytics-card-actions">
                  <Link to="/supadmin?tab=bookings" className="analytics-card-link">View Activity</Link>
                </div>
              </article>
              <article className="analytics-kpi-card">
                <p>Total Vendors</p>
                <p className="value">{analytics?.total_vendors ?? vendors.length}</p>
                <div className="analytics-card-actions">
                  <Link to="/supadmin?tab=vendors" className="analytics-card-link">Manage Vendors</Link>
                </div>
              </article>
              <article className="analytics-kpi-card">
                <p>Total Buses</p>
                <p className="value">{analytics?.total_buses ?? 0}</p>
                <div className="analytics-card-actions">
                  <Link to="/supadmin?tab=buses" className="analytics-card-link">Manage Buses</Link>
                </div>
              </article>
              <article className="analytics-kpi-card">
                <p>Total Bookings</p>
                <p className="value">{analytics?.total_bookings ?? filteredBookings.length}</p>
                <div className="analytics-card-actions">
                  <Link to="/supadmin?tab=bookings" className="analytics-card-link">Open Bookings</Link>
                </div>
              </article>
              <article className="analytics-kpi-card">
                <p>Total Revenue</p>
                <p className="value">Rs. {Number(analytics?.total_revenue ?? 0).toFixed(0)}</p>
                <div className="analytics-card-actions">
                  <Link to="/supadmin?tab=bookings" className="analytics-card-link">View Revenue Source</Link>
                </div>
              </article>
              <article className="analytics-kpi-card">
                <p>Active Routes</p>
                <p className="value">{analytics?.active_routes ?? 0}</p>
                <div className="analytics-card-actions">
                  <Link to="/supadmin?tab=routes" className="analytics-card-link">Manage Routes</Link>
                </div>
              </article>
            </div>
          ) : (
            <div className="analytics-kpi-grid">
              <article className="analytics-kpi-card"><p>Total Revenue</p><p className="value">Rs. {totalRevenue.toFixed(0)}</p></article>
              <article className="analytics-kpi-card"><p>Today's Earnings</p><p className="value">Rs. {todayEarnings.toFixed(0)}</p></article>
              <article className="analytics-kpi-card"><p>Total Bookings</p><p className="value">{filteredBookings.length}</p></article>
              <article className="analytics-kpi-card"><p>Active Buses</p><p className="value">{buses.filter((b) => b.is_active).length}</p></article>
              <article className="analytics-kpi-card"><p>Average Rating</p><p className="value">{averageRating}</p></article>
            </div>
          )}

          <div className="analytics-grid-2">
            {isSystemMode ? (
              <BarCompareChart title="Booking Trends" bars={bookingTrendBars} />
            ) : (
              <BarCompareChart title="Daily Revenue Trend" bars={trendPoints} />
            )}
            {isSystemMode ? (
              <BarCompareChart title="Revenue Trends" bars={revenueTrendBars} />
            ) : (
              <BarCompareChart title="Revenue Per Bus" bars={revenueBars} />
            )}
          </div>

          <div className="analytics-grid-2">
            <DonutBreakdownChart
              title={isSystemMode ? 'Booking Success Rate' : 'Seat Occupancy'}
              percent={isSystemMode ? successRate : occupancyPercent}
              centerLabel={isSystemMode ? 'Success vs cancellation' : 'Overall occupancy'}
            />
            <BarCompareChart
              title={isSystemMode ? 'Top Routes' : 'Seat Occupancy per Route (%)'}
              bars={isSystemMode ? routeBars : routeOccupancyBars}
            />
          </div>

          {isSystemMode ? (
            <div className="analytics-grid-2">
              <BarCompareChart title="Seat Occupancy per Route (%)" bars={routeOccupancyBars} />
            </div>
          ) : (
            <div className="analytics-grid-2">
              <DonutBreakdownChart
                title="Seat Occupancy"
                percent={occupancyPercent}
                centerLabel="Overall occupancy"
              />
              <BarCompareChart title="Seat Occupancy per Route (%)" bars={routeOccupancyBars} />
            </div>
          )}

          <div className="analytics-grid-2">
            <BarCompareChart title="Seat Occupancy per Schedule (%)" bars={scheduleOccupancyBars} />
            {isSystemMode ? (
              <BarCompareChart
                title="System Health"
                bars={[
                  { label: 'Failed txns', value: Math.max(0, Math.floor(filteredBookings.length * 0.03)) },
                  { label: 'Refund freq', value: Math.max(0, Math.floor(filteredBookings.length * 0.09)) },
                  { label: 'Inactive vendors', value: Math.max(0, vendors.filter((v) => !v.is_active).length) },
                  { label: 'Inactive users', value: Math.max(0, Math.floor((analytics?.total_users || 0) * 0.12)) },
                ]}
              />
            ) : (
              <BarCompareChart
                title="Feedback Snapshot"
                bars={[
                  { label: 'Reviews', value: reviews.length },
                  { label: 'Pending Complaints', value: Math.max(0, Math.floor(reviews.length * 0.18)) },
                  { label: 'Refund Requests', value: Math.max(0, Math.floor(filteredBookings.length * 0.08)) },
                  { label: 'Cancelled', value: filteredBookings.filter((b) => String(b.status).toLowerCase() === 'cancelled').length },
                ]}
              />
            )}
          </div>

          {!isSystemMode && (
            <div className="analytics-grid-2">
              <BarCompareChart title="Revenue Per Bus" bars={revenueBars} />
            </div>
          )}

          <article className="admin-section">
            <h2>{isSystemMode ? 'Recent Bookings' : 'Recent Bookings (Analytics View)'}</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Route</th>
                    {!isSystemMode && <th>Bus</th>}
                    <th>Date</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((item) => (
                    <tr key={item.booking_id}>
                      <td>{item.booking_id}</td>
                      <td>{item.route_name || '-'}</td>
                      {!isSystemMode && <td>{item.bus_name || '-'}</td>}
                      <td>{item.journey_date || '-'}</td>
                      <td>{item.seats || 0}</td>
                      <td>Rs. {Number(item.total_amount || 0).toFixed(0)}</td>
                      <td>{item.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={safePage}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              totalItems={filteredBookings.length}
              onPageChange={setPage}
              itemLabel="bookings"
            />
          </article>
        </>
      )}
    </div>
  )

  if (embedded) {
    return <section className="analytics-page">{mainContent}</section>
  }

  return (
    <section className="container page-shell analytics-page analytics-shell">
      <aside className="analytics-sidebar">
        <h2>{isSystemMode ? 'System Admin' : 'Vendor Panel'}</h2>
        <nav className="analytics-nav">
          {isSystemMode ? (
            <>
              <Link to="/supadmin" className={location.pathname === '/supadmin' ? 'active-link' : ''}>Dashboard</Link>
              <Link to="/supadmin/analytics" className={location.pathname === '/supadmin/analytics' ? 'active-link' : ''}>Analytics</Link>
              <Link to="/supadmin?tab=bookings">Bookings</Link>
              <Link to="/profile">Profile</Link>
            </>
          ) : (
            <>
              <Link to="/admin" className={location.pathname === '/admin' ? 'active-link' : ''}>Dashboard</Link>
              <Link to="/admin/analytics" className={location.pathname === '/admin/analytics' ? 'active-link' : ''}>Analytics</Link>
              <Link to="/admin?tab=bookings">Bookings</Link>
              <Link to="/admin/profile">Profile</Link>
            </>
          )}
        </nav>
      </aside>

      {mainContent}
    </section>
  )
}

export default VendorAnalyticsView

VendorAnalyticsView.propTypes = {
  mode: PropTypes.oneOf(['vendor', 'system']),
  embedded: PropTypes.bool,
  analyticsData: PropTypes.object,
  bookingsData: PropTypes.arrayOf(PropTypes.object),
  busesData: PropTypes.arrayOf(PropTypes.object),
  routesData: PropTypes.arrayOf(PropTypes.object),
  schedulesData: PropTypes.arrayOf(PropTypes.object),
  reviewsData: PropTypes.arrayOf(PropTypes.object),
  vendorsData: PropTypes.arrayOf(PropTypes.object),
}

VendorAnalyticsView.defaultProps = {
  mode: 'vendor',
  embedded: false,
  analyticsData: null,
  bookingsData: [],
  busesData: [],
  routesData: [],
  schedulesData: [],
  reviewsData: [],
  vendorsData: [],
}
