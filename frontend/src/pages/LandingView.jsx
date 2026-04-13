import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../css/landing.css'
import websiteImage from '../assets/website image.png'
import SearchQuery from '../components/SearchQuery'

// Import destination images
import pokharaImg from '../assets/pokhara.png'
import chitwanImg from '../assets/chitwan.png'
import lumbiniImg from '../assets/lumbini.png'
import muktinathImg from '../assets/muktinath.png'
import raraImg from '../assets/rara.png'
import langtangImg from '../assets/lantang.png'

// Import bus type images
import standardImg from '../assets/standard.png'
import standardImg1 from '../assets/standard1.png'
import standardImg2 from '../assets/standard2.png'
import deluxImg from '../assets/delux.png'
import deluxImg1 from '../assets/delux1.png'
import deluxImg2 from '../assets/delux2.png'
import acImg from '../assets/ac.png'
import acImg1 from '../assets/ac1.png'
import acImg2 from '../assets/ac2.png'
import sleeperImg from '../assets/sleeper.png'
import sleeperImg1 from '../assets/sleeper1.png'
import sleeperImg2 from '../assets/sleeper2.png'

const destinationImages = {
  Pokhara: pokharaImg,
  Chitwan: chitwanImg,
  Lumbini: lumbiniImg,
  Muktinath: muktinathImg,
  Rara: raraImg,
  Langtang: langtangImg,
}

const busTypeImages = {
  Standard: standardImg,
  Delux: deluxImg,
  AC: acImg,
}

const routeBusImageGroups = {
  ac: [acImg, acImg1, acImg2],
  deluxe: [deluxImg, deluxImg1, deluxImg2],
  sleeper: [sleeperImg, sleeperImg1, sleeperImg2],
  standard: [standardImg, standardImg1, standardImg2],
}

const resolveRouteBusImage = (busType, sequence = 0) => {
  const text = String(busType || '').toLowerCase()
  if (text.includes('ac')) {
    return routeBusImageGroups.ac[sequence % routeBusImageGroups.ac.length]
  }
  if (text.includes('delux') || text.includes('deluxe')) {
    return routeBusImageGroups.deluxe[sequence % routeBusImageGroups.deluxe.length]
  }
  if (text.includes('sleeper')) {
    return routeBusImageGroups.sleeper[sequence % routeBusImageGroups.sleeper.length]
  }
  return routeBusImageGroups.standard[sequence % routeBusImageGroups.standard.length]
}

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const fetchHomeData = async () => {
  const [statsRes, routesRes, busesRes, schedulesRes] = await Promise.all([
    fetch(`${API_BASE}/api/admin/analytics`),
    fetch(`${API_BASE}/api/admin/routes`),
    fetch(`${API_BASE}/api/admin/buses`),
    fetch(`${API_BASE}/api/admin/schedules`),
  ])

  const statsData = await statsRes.json()
  const routesData = await routesRes.json()
  const busesData = await busesRes.json()
  const schedulesData = await schedulesRes.json()

  const analytics = statsData.analytics || {}
  const allRoutes = routesData.routes || []
  const allBuses = busesData.buses || []
  const allSchedules = schedulesData.schedules || []

  const popularRoutes = allRoutes.slice(0, 6).map((route, index) => {
    const routeBuses = allBuses.filter(
      (bus) => bus.from_city === route.from_city && bus.to_city === route.to_city,
    )
    const avgPrice =
      routeBuses.length > 0
        ? routeBuses.reduce((sum, bus) => sum + Number(bus.price || 0), 0) / routeBuses.length
        : 0

    const availableSchedules = allSchedules.filter((item) => item.route_id === route.route_id).length

    return {
      id: route.route_id,
      origin: route.from_city,
      destination: route.to_city,
      distanceKm: route.distance_km,
      avgPrice,
      availableSchedules,
      image: resolveRouteBusImage(routeBuses[0]?.bus_type, index),
    }
  })

  const featuredVendors = Object.values(
    allBuses.reduce((acc, bus) => {
      const key = bus.bus_type || 'Standard'
      if (!acc[key]) {
        acc[key] = {
          id: key,
          companyName: `${key} Operator`,
          verified: true,
          averageRating: 4.5,
          totalBuses: 0,
        }
      }
      acc[key].totalBuses += 1
      return acc
    }, {}),
  ).slice(0, 6)

  return {
    stats: {
      totalBuses: analytics.total_buses || 0,
      totalRoutes: analytics.total_routes || 0,
      totalBookings: analytics.total_bookings || 0,
    },
    routes: popularRoutes,
    vendors: featuredVendors,
  }
}

const Landing = () => {
  const [popularRoutes, setPopularRoutes] = useState([])
  const [featuredVendors, setFeaturedVendors] = useState([])
  const [stats, setStats] = useState({ totalBuses: 0, totalRoutes: 0, totalBookings: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHomePageData()
  }, [])

  const fetchHomePageData = async () => {
    try {
      setLoading(true)
      const data = await fetchHomeData()
      setStats(data.stats)
      setPopularRoutes(data.routes)
      setFeaturedVendors(data.vendors)
    } catch {
      setStats({ totalBuses: 0, totalRoutes: 0, totalBookings: 0 })
      setPopularRoutes([])
      setFeaturedVendors([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content container">
          <h1 className="hero-title">Book Nepal Bus Tickets Online</h1>
          <p className="hero-subtitle">
            Search, compare, and book from {stats.totalBuses}+ buses across {stats.totalRoutes}+ routes
          </p>
          <SearchQuery variant="default" />
        </div>
      </section>

      <div className="hero-image-container">
        <div className="website-banner">
          <img src={websiteImage} alt="Ticket Nepal bus booking" className="banner-image" />
        </div>
      </div>

      <section className="features-section container">
        <h2 className="section-title">Why Choose Ticket Nepal?</h2>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon">Fast</div>
            <h3>Instant Booking</h3>
            <p>Reserve seats in seconds with real-time availability</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">Safe</div>
            <h3>Verified Vendors</h3>
            <p>All operators are verified and licensed</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">Pay</div>
            <h3>Secure Payments</h3>
            <p>eSewa, Khalti, and bank transfer options</p>
          </div>
        </div>
      </section>

      <section className="routes-section container">
        <div className="section-header">
          <h2 className="section-title">Popular Routes</h2>
          <Link to="/search" className="view-all-link">View All Routes</Link>
        </div>
        <div className="routes-grid">
          {popularRoutes.map((route) => (
            <Link
              key={route.id}
              to={`/search?from=${route.origin}&to=${route.destination}`}
              className="route-card card route-card-enhanced"
            >
              <div className="route-image-wrap">
                <img src={route.image} alt={`${route.origin} to ${route.destination} bus`} className="route-image" />
              </div>
              <div className="route-content">
                <div className="route-cities">
                  <span className="city">{route.origin}</span>
                  <span className="arrow">to</span>
                  <span className="city">{route.destination}</span>
                </div>
                <div className="route-details">
                  <div className="detail-item"><span>Distance</span><strong>{route.distanceKm} km</strong></div>
                  <div className="detail-item"><span>Avg fare</span><strong>Rs. {Math.round(route.avgPrice)}</strong></div>
                  <div className="detail-item"><span>Schedules</span><strong>{route.availableSchedules}</strong></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="destinations-section container">
        <div className="section-header">
          <h2 className="section-title">Featured Destinations</h2>
          <Link to="/destinations" className="view-all-link">Explore All</Link>
        </div>
        <div className="destinations-grid">
          {Object.entries(destinationImages).slice(0, 3).map(([name, image]) => (
            <Link 
              key={name} 
              to={`/search?to=${name}`}
              className="destination-card"
            >
              <div className="destination-image">
                <img src={image} alt={name} />
                <div className="destination-overlay"></div>
              </div>
              <div className="destination-info">
                <h3>{name}</h3>
                <p>Explore scenic beauty</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="vendors-section container">
        <div className="section-header">
          <h2 className="section-title">Featured Bus Operators</h2>
          <Link to="/vendors" className="view-all-link">View All Operators</Link>
        </div>
        <div className="vendors-grid">
          {featuredVendors.map((vendor) => (
            <div key={vendor.id} className="vendor-card card vendor-card-enhanced">
              <div className="vendor-image-placeholder">
                <img 
                  src={busTypeImages[vendor.id] || standardImg} 
                  alt={vendor.companyName}
                  className="vendor-image"
                />
              </div>
              <div className="vendor-content">
                <div className="vendor-header">
                  <h3 className="vendor-name">{vendor.companyName}</h3>
                  {vendor.verified && <span className="verified-badge">Verified</span>}
                </div>
                <div className="vendor-stats">
                  <span className="rating">Rating {vendor.averageRating.toFixed(1)}</span>
                  <span className="buses">{vendor.totalBuses} buses</span>
                </div>
                <Link
                  to={`/vendors?type=${vendor.id}`}
                  className="vendor-link"
                >
                  View Buses
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-container container">
          <div className="stat-card"><div className="stat-number">{stats.totalBuses}+</div><div className="stat-label">Active Buses</div></div>
          <div className="stat-card"><div className="stat-number">{stats.totalRoutes}+</div><div className="stat-label">Routes Covered</div></div>
          <div className="stat-card"><div className="stat-number">{Number(stats.totalBookings || 0).toLocaleString('en-US')}</div><div className="stat-label">Total Bookings</div></div>
        </div>
      </section>
    </div>
  )
}

export default Landing
