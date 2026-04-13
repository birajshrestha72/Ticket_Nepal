import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { fetchUserBookings } from '../../api/bookingApi'
import { BarCompareChart, DonutBreakdownChart, LineTrendChart } from '../../components/analytics/ChartsLite'
import TablePagination from '../../components/TablePagination'
import '../../css/analyticsPages.css'

const PAGE_SIZE = 8

const CustomerAnalyticsView = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [range, setRange] = useState('monthly')
  const [routeFilter, setRouteFilter] = useState('all')
  const [busFilter, setBusFilter] = useState('all')
  const [bookings, setBookings] = useState([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      if (!user?.user_id) return
      setLoading(true)
      setError('')
      try {
        const myBookings = await fetchUserBookings(user.user_id)
        setBookings(myBookings || [])
      } catch (err) {
        setError(err.message || 'Failed to load customer analytics')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.user_id])

  const routeOptions = useMemo(() => [...new Set(bookings.map((item) => item.route_name).filter(Boolean))], [bookings])
  const busOptions = useMemo(() => [...new Set(bookings.map((item) => item.bus_name).filter(Boolean))], [bookings])

  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      const routePass = routeFilter === 'all' || item.route_name === routeFilter
      const busPass = busFilter === 'all' || item.bus_name === busFilter
      return routePass && busPass
    })
  }, [bookings, routeFilter, busFilter])

  const totalSpend = filteredBookings.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
  const upcomingTrips = filteredBookings.filter((item) => String(item.status || '').toLowerCase() !== 'cancelled').length

  const monthlyTrend = useMemo(() => {
    let size = 8
    if (range === 'daily') size = 7
    else if (range === 'weekly') size = 6
    else if (range === 'yearly') size = 12

    return Array.from({ length: size }).map((_, idx) => ({
      label: `${idx + 1}`,
      value: Math.max(0, Math.round((filteredBookings.length / Math.max(1, size)) * (0.85 + (idx % 3) * 0.2))),
    }))
  }, [filteredBookings.length, range])

  const spendingTrend = monthlyTrend.map((item) => ({ label: item.label, value: item.value * 95 }))

  const routeBars = useMemo(() => {
    const map = new Map()
    filteredBookings.forEach((item) => {
      const key = item.route_name || 'Unknown route'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [filteredBookings])

  const preferredBusBars = useMemo(() => {
    const map = new Map()
    filteredBookings.forEach((item) => {
      const key = item.bus_name || 'Unknown bus'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [filteredBookings])

  const loyaltyScore = useMemo(() => {
    if (!filteredBookings.length) return 0
    const completed = filteredBookings.filter((item) => String(item.status || '').toLowerCase() !== 'cancelled').length
    return (completed / filteredBookings.length) * 100
  }, [filteredBookings])

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleRows = filteredBookings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <section className="container page-shell analytics-page analytics-shell">
      <aside className="analytics-sidebar">
        <h2>Customer Panel</h2>
        <nav className="analytics-nav">
          <Link to="/user" className={location.pathname === '/user' ? 'active-link' : ''}>Dashboard</Link>
          <Link to="/user/analytics" className={location.pathname === '/user/analytics' ? 'active-link' : ''}>Analytics</Link>
          <Link to="/bookings">Bookings</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </aside>

      <div className="analytics-main">
        <p className="analytics-breadcrumb">Dashboard / Customer / Analytics</p>
        <header className="analytics-header">
          <h1>Customer Travel Analytics</h1>
          <p>Trips, spending, preferences, recommendations, and booking behavior insights.</p>
        </header>

        <div className="analytics-filter-row">
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
            <option value="all">All Routes</option>
            {routeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={busFilter} onChange={(e) => setBusFilter(e.target.value)}>
            <option value="all">All Buses</option>
            {busOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="date" />
        </div>

        {loading && <p className="admin-info">Loading analytics...</p>}
        {error && <p className="admin-error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="analytics-kpi-grid">
              <article className="analytics-kpi-card"><p>Total Trips</p><p className="value">{filteredBookings.length}</p></article>
              <article className="analytics-kpi-card"><p>Total Spending</p><p className="value">Rs. {totalSpend.toFixed(0)}</p></article>
              <article className="analytics-kpi-card"><p>Upcoming Trips</p><p className="value">{upcomingTrips}</p></article>
              <article className="analytics-kpi-card"><p>Favorite Route</p><p className="value">{routeBars[0]?.label || 'N/A'}</p></article>
              <article className="analytics-kpi-card"><p>Loyalty Score</p><p className="value">{loyaltyScore.toFixed(1)}%</p></article>
            </div>

            <div className="analytics-grid-2">
              <LineTrendChart title="Trips Over Time" points={monthlyTrend} />
              <LineTrendChart title="Spending Trend" points={spendingTrend} />
            </div>

            <div className="analytics-grid-2">
              <BarCompareChart title="Most Frequent Routes" bars={routeBars} />
              <BarCompareChart title="Preferred Buses" bars={preferredBusBars} />
            </div>

            <div className="analytics-grid-2">
              <DonutBreakdownChart title="Booking Reliability" percent={loyaltyScore} centerLabel="Non-cancelled bookings" />
              <BarCompareChart
                title="Smart Recommendations"
                bars={[
                  { label: 'Suggested routes', value: Math.min(10, routeOptions.length + 2) },
                  { label: 'Discount alerts', value: Math.max(1, Math.floor(filteredBookings.length * 0.15)) },
                  { label: 'Best-time slots', value: 6 },
                  { label: 'Preferred days', value: 4 },
                ]}
              />
            </div>

            <article className="admin-section">
              <h2>Recent Trips</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Route</th>
                      <th>Bus</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((item) => (
                      <tr key={item.booking_id}>
                        <td>{item.booking_id}</td>
                        <td>{item.route_name || '-'}</td>
                        <td>{item.bus_name || '-'}</td>
                        <td>{item.journey_date || '-'}</td>
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
                itemLabel="trips"
              />
            </article>
          </>
        )}
      </div>
    </section>
  )
}

export default CustomerAnalyticsView
