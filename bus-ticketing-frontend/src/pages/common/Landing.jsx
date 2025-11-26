import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../css/landing.css';
import websiteImage from '../../assets/website image.png';

/**
 * Landing Page Component - Homepage ko main component
 * Mobile-first responsive design - sabai device ma ramro dekhincha
 * Dynamic data fetching - backend API bata real-time data lincha
 */
const Landing = () => {
  const navigate = useNavigate();
  
  // State management - sabai data yaha store huncha
  const [popularRoutes, setPopularRoutes] = useState([]); // Popular routes ko list (Kathmandu-Pokhara, etc)
  const [featuredVendors, setFeaturedVendors] = useState([]); // Verified vendors ko list
  const [stats, setStats] = useState({ totalBuses: 0, totalRoutes: 0, totalBookings: 0 }); // Summary statistics
  const [loading, setLoading] = useState(true); // Loading state - data fetch huncha bela dekhaucha
  const [cities, setCities] = useState([]); // Available cities for dropdown - database bata aaucha

  // Search form ko state - user le search garna ko lagi
  const [searchForm, setSearchForm] = useState({
    origin: '',        // Kahaa bata (Origin city)
    destination: '',   // Kahaa samma (Destination city)
    date: new Date()   // Kuna din (Journey date) - DatePicker le Date object chaincha
  });

  // Component load huda initial data fetch garne - Page load hune bittikai chalcha
  useEffect(() => {
    fetchHomePageData();
  }, []);

  /**
   * Homepage ko lagi data fetch garne function
   * Backend API bata routes, vendors ra stats lincha
   * Database query: active_schedules view ra vendor_analytics view use garcha
   */
  const fetchHomePageData = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    
    try {
      setLoading(true);
      
      // Fetch all data in parallel for better performance
      const [statsRes, routesRes, vendorsRes, citiesRes] = await Promise.all([
        fetch(`${API_URL}/stats/summary`),
        fetch(`${API_URL}/stats/popular-routes?limit=6`),
        fetch(`${API_URL}/stats/featured-vendors?limit=6`),
        fetch(`${API_URL}/routes/cities`)
      ]);
      
      // Parse responses
      const statsData = await statsRes.json();
      const routesData = await routesRes.json();
      const vendorsData = await vendorsRes.json();
      const citiesData = await citiesRes.json();
      
      // Update state with real data from database
      if (statsData.status === 'success') {
        setStats({
          totalBuses: statsData.data.stats.totalBuses,
          totalRoutes: statsData.data.stats.totalRoutes,
          totalBookings: statsData.data.stats.totalBookings
        });
      }
      
      if (routesData.status === 'success') {
        setPopularRoutes(routesData.data.routes);
      }
      
      if (vendorsData.status === 'success') {
        setFeaturedVendors(vendorsData.data.vendors);
      }
      
      if (citiesData.status === 'success') {
        setCities(citiesData.data.cities);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Data fetch garda error:', error);
      // Set fallback empty data on error
      setStats({ totalBuses: 0, totalRoutes: 0, totalBookings: 0 });
      setPopularRoutes([]);
      setFeaturedVendors([]);
      setCities([]);
      setLoading(false);
    }
  };

  /**
   * Search form submit handler
   * User le search button click garesi /search page ma redirect huncha
   * Query params ma origin, destination ra date pathaunchha
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // URL query parameters build garne
    const params = new URLSearchParams();
    if (searchForm.origin) params.append('from', searchForm.origin);
    if (searchForm.destination) params.append('to', searchForm.destination);
    if (searchForm.date) params.append('date', searchForm.date);
    
    // Search page ma redirect - bus listing dekhauchha
    navigate(`/search?${params.toString()}`);
  };

  /**
   * Input field change handler
   * Jasle ni input field ma type garyo tesle yaha update garcha
   */
  const handleInputChange = (e) => {
    setSearchForm({
      ...searchForm,
      [e.target.name]: e.target.value
    });
  };

  // Loading state - Data fetch hunu agadi loading message dekhaucha
  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Kripaya prakhar garnuhos... (Please wait...)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
     

      {/* ===== HERO SECTION ===== */}
      {/* Hero section - Homepage ko main attraction with quick search */}
      <section className="hero-section">
        <div className="hero-content">
          {/* Main heading - SEO friendly title */}
          <h1 className="hero-title">Book Nepal Bus Tickets Online</h1>
          <p className="hero-subtitle">
            Search, compare, and book from {stats.totalBuses}+ buses across {stats.totalRoutes}+ routes
          </p>
          
          {/* ===== QUICK SEARCH FORM ===== */}
          {/* Turat bus search garna milcha - Direct booking workflow */}
          <form className="quick-search-form card" onSubmit={handleSearchSubmit}>
            <div className="search-fields">
              {/* Origin dropdown - Kahaa bata */}
              <div className="search-field">
                <label htmlFor="origin">Kahaa bata (From)</label>
                <select
                  id="origin"
                  name="origin"
                  value={searchForm.origin}
                  onChange={handleInputChange}
                  required
                  className="search-select"
                >
                  <option value="">Select origin city</option>
                  {cities.map((city) => (
                    <option key={`origin-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Destination dropdown - Kahaa jaane */}
              <div className="search-field">
                <label htmlFor="destination">Kahaa jaane (To)</label>
                <select
                  id="destination"
                  name="destination"
                  value={searchForm.destination}
                  onChange={handleInputChange}
                  required
                  className="search-select"
                >
                  <option value="">Select destination city</option>
                  {cities.map((city) => (
                    <option key={`dest-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date input - Kun din (Using DatePicker calendar library) */}
              <div className="search-field">
                <label htmlFor="date">Yatra Miti (Journey Date)</label>
                <DatePicker
                  selected={searchForm.date}
                  onChange={(date) => setSearchForm({ ...searchForm, date: date })}
                  minDate={new Date()} // Aaja ko din bhanda agadi select garna mildaina
                  dateFormat="yyyy-MM-dd"
                  className="date-picker-input"
                  placeholderText="Select travel date"
                  required
                />
              </div>
            </div>
            
            {/* Submit button - Search trigger */}
                  <button type="submit" className="btn btn-primary btn-search">
                    Bus Khojnuhos (Search Buses)
                  </button>
                  </form>
                </div>
      </section>


      <div className="hero-image-container"> {/* ===== WEBSITE BANNER IMAGE ===== */}
      {/* Full width banner image - 100% screen span */}
      <div className="website-banner">
        <img
          src={websiteImage}
          alt="Ticket Nepal - Nepal's Premier Bus Booking Platform"
          className="banner-image"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            console.log('Banner image not found');
          }}
        />
      </div>
      </div>


      {/* ===== FEATURES SECTION ===== */}
      {/* Kina Ticket Nepal choose garne - Key selling points */}
      <section className="features-section">
        <h2 className="section-title">Kina Ticket Nepal? (Why Choose Us?)</h2>
        <div className="features-grid">
          {/* Feature 1: Turat booking */}
          <div className="feature-card card">
            <div className="feature-icon">⚡</div>
            <h3>Turat Booking (Instant Booking)</h3>
            <p>Reserve seats in seconds with real-time availability</p>
          </div>
          {/* Feature 2: Verified operators */}
          <div className="feature-card card">
            <div className="feature-icon">🛡️</div>
            <h3>Pramanit Vendors (Verified Vendors)</h3>
            <p>All operators are verified and licensed</p>
          </div>
          {/* Feature 3: Surakshit payment */}
          <div className="feature-card card">
            <div className="feature-icon">💳</div>
            <h3>Surakshit Payment (Secure Payments)</h3>
            <p>eSewa, Khalti, and bank transfers supported</p>
          </div>
        </div>
      </section>

      {/* ===== POPULAR ROUTES SECTION ===== */}
      {/* Lokpriya routes - Most searched/booked routes */}
      <section className="routes-section">
        <div className="section-header">
          <h2 className="section-title">Lokpriya Routes (Popular Routes)</h2>
          <Link to="/search" className="view-all-link">Sabai Herne (View All) →</Link>
        </div>
        <div className="routes-grid">
          {/* Routes list - Database ko routes table bata aaucha */}
          {popularRoutes.map((route) => (
            <div key={route.id} className="route-card card">
              <div className="route-header">
                {/* Origin → Destination display */}
                <div className="route-cities">
                  <span className="city">{route.origin}</span>
                  <span className="arrow">→</span>
                  <span className="city">{route.destination}</span>
                </div>
              </div>
              <div className="route-details">
                {/* Distance in kilometers */}
                <div className="detail-item">
                  <span className="label">Duri (Distance):</span>
                  <span className="value">{route.distanceKm} km</span>
                </div>
                {/* Starting price */}
                <div className="detail-item">
                  <span className="label">Mulya (Price):</span>
                  <span className="value price">Rs. {Math.round(route.avgPrice)}</span>
                </div>
                {/* Available schedules count */}
                <div className="detail-item">
                  <span className="label">Uplabdha (Available):</span>
                  <span className="value">{route.availableSchedules} schedules</span>
                </div>
              </div>
              {/* CTA - Search page ma redirect with pre-filled params */}
              <Link 
                to={`/search?from=${route.origin}&to=${route.destination}`}
                className="btn btn-secondary btn-small"
              >
                Bus Herne (View Buses)
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Vendors Section */}
      <section className="vendors-section">
        <div className="section-header">
          <h2 className="section-title">Featured Bus Operators</h2>
        </div>
        <div className="vendors-grid">
          {featuredVendors.map((vendor) => (
            <div key={vendor.id} className="vendor-card card">
              <div className="vendor-header">
                <h3 className="vendor-name">{vendor.companyName}</h3>
                {vendor.verified && <span className="verified-badge">✓ Verified</span>}
              </div>
              <div className="vendor-stats">
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-value">{vendor.averageRating.toFixed(1)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🚌</span>
                  <span className="stat-value">{vendor.totalBuses} buses</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{stats.totalBuses}+</div>
            <div className="stat-label">Active Buses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalRoutes}+</div>
            <div className="stat-label">Routes Covered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{(stats.totalBookings / 1000).toFixed(0)}K+</div>
            <div className="stat-label">Happy Travelers</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
