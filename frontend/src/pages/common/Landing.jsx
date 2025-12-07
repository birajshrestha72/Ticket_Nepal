import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../css/landing.css';
import websiteImage from '../../assets/website image.png';
import SearchQuery from '../../components/SearchQuery';

/**
 * Landing Page Component - Homepage ko main component
 * Mobile-first responsive design - sabai device ma ramro dekhincha
 * Dynamic data fetching - backend API bata real-time data lincha
 */
const Landing = () => {
  // State management - sabai data yaha store huncha
  const [popularRoutes, setPopularRoutes] = useState([]); // Popular routes ko list (Kathmandu-Pokhara, etc)
  const [featuredVendors, setFeaturedVendors] = useState([]); // Verified vendors ko list
  const [stats, setStats] = useState({ totalBuses: 0, totalRoutes: 0, totalBookings: 0 }); // Summary statistics
  const [loading, setLoading] = useState(true); // Loading state - data fetch huncha bela dekhaucha

  // Search form state removed - now handled by SearchQuery component

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
      const [statsRes, routesRes, vendorsRes] = await Promise.all([
        fetch(`${API_URL}/stats/summary`),
        fetch(`${API_URL}/stats/popular-routes?limit=6`),
        fetch(`${API_URL}/stats/featured-vendors?limit=6`)
      ]);
      
      // Parse responses
      const statsData = await statsRes.json();
      const routesData = await routesRes.json();
      const vendorsData = await vendorsRes.json();
      
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
      
      setLoading(false);
    } catch (error) {
      console.error('Data fetch garda error:', error);
      // Set fallback empty data on error
      setStats({ totalBuses: 0, totalRoutes: 0, totalBookings: 0 });
      setPopularRoutes([]);
      setFeaturedVendors([]);
      setLoading(false);
    }
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
          
          {/* ===== QUICK SEARCH FORM (Now using reusable component) ===== */}
          <SearchQuery variant="default" />
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
