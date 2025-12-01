import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/adminDashboard.css';

// Import all admin components
import AdminBuses from './AdminBuses.jsx';
import AdminRoutes from './AdminRoutes.jsx';
import AdminSchedules from './AdminSchedules.jsx';
import VendorBookings from './VendorBookings.jsx';
import Billing from './Billing.jsx';
import BusSeatManagement from './BusSeatManagement.jsx';
import RatingsReviews from './RatingsReviews.jsx';
import VendorManagement from './VendorManagement.jsx';
import VendorProfile from './VendorProfile.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState(null);
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalBuses: 0,
    totalRoutes: 0,
    totalBookings: 0,
    totalRevenue: 0,
    seatsSold: 0,
    seatsAvailable: 0,
    activeVendors: 0,
    pendingBookings: 0
  });

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchAnalytics();
  }, [dateFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch various analytics endpoints
      const responses = await Promise.all([
        fetch(`${API_URL}/buses/all-types`, { headers: { 'Authorization': `Bearer ${token}` }}).catch(() => ({ ok: false })),
        fetch(`${API_URL}/routes/all`, { headers: { 'Authorization': `Bearer ${token}` }}).catch(() => ({ ok: false }))
      ]);

      // Process responses
      if (responses[0].ok) {
        const busData = await responses[0].json();
        // Count unique buses from all-types response
        const uniqueBuses = new Set();
        const busesByType = busData.data?.busesByType || {};
        Object.values(busesByType).forEach(buses => {
          buses.forEach(bus => uniqueBuses.add(bus.id));
        });
        
        setAnalytics(prev => ({
          ...prev,
          totalBuses: uniqueBuses.size || 0
        }));
      }

      if (responses[1].ok) {
        const routeData = await responses[1].json();
        setAnalytics(prev => ({
          ...prev,
          totalRoutes: routeData.data?.routes?.length || 0
        }));
      }

      // Simulated analytics for now (replace with real API when available)
      setAnalytics(prev => ({
        ...prev,
        totalBookings: 1247,
        totalRevenue: 2847500,
        seatsSold: 3892,
        seatsAvailable: 856,
        activeVendors: 12,
        pendingBookings: 23
      }));

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (field, value) => {
    setDateFilter(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <p>Please log in to access admin dashboard</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="admin-avatar">
            {user.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <h3 className="admin-name">{user.name || 'Admin'}</h3>
          <p className="admin-role">{user.role === 'system_admin' ? 'System Admin' : 'Admin'}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'buses' ? 'active' : ''}`}
            onClick={() => setActiveSection('buses')}
          >
            <span className="nav-icon">🚌</span>
            <span className="nav-text">Manage Buses</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveSection('routes')}
          >
            <span className="nav-icon">🗺️</span>
            <span className="nav-text">Manage Routes</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'schedules' ? 'active' : ''}`}
            onClick={() => setActiveSection('schedules')}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-text">Schedules</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveSection('bookings')}
          >
            <span className="nav-icon">🎫</span>
            <span className="nav-text">Bookings</span>
          </button>

          {user?.role === 'vendor' && (
            <button
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">My Profile</span>
            </button>
          )}

          {user?.role === 'system_admin' && (
            <button
              className={`nav-item ${activeSection === 'vendors' ? 'active' : ''}`}
              onClick={() => setActiveSection('vendors')}
            >
              <span className="nav-icon">🏢</span>
              <span className="nav-text">Vendors</span>
            </button>
          )}

          <button
            className={`nav-item ${activeSection === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveSection('billing')}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-text">Billing</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'seat-management' ? 'active' : ''}`}
            onClick={() => setActiveSection('seat-management')}
          >
            <span className="nav-icon">💺</span>
            <span className="nav-text">Seat Management</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'ratings' ? 'active' : ''}`}
            onClick={() => setActiveSection('ratings')}
          >
            <span className="nav-icon">⭐</span>
            <span className="nav-text">Ratings & Reviews</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics</span>
          </button>

          <Link to="/" className="nav-item">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="btn-logout"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
          >
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Dashboard Overview Section */}
          {activeSection === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="welcome-section">
                <h1 className="dashboard-title">
                  Welcome back, {user.name?.split(' ')[0] || 'Admin'}!
                </h1>
                <p className="dashboard-subtitle">
                  Here's what's happening with your bus ticketing system
                </p>
              </div>

              {/* Date Filter */}
              <div className="date-filter-section card">
                <h3>📅 Date Range Filter</h3>
                <div className="date-filter-inputs">
                  <div className="filter-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <div className="filter-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <button onClick={fetchAnalytics} className="btn-apply-filter">
                    Apply Filter
                  </button>
                </div>
              </div>

              {/* Analytics Cards */}
              <section className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <p className="stat-label">Total Revenue</p>
                    <h3 className="stat-value">Rs. {analytics.totalRevenue.toLocaleString()}</h3>
                    <span className="stat-change positive">+12.5% from last month</span>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-icon"></div>
                  <div className="stat-info">
                    <p className="stat-label">Total Bookings</p>
                    <h3 className="stat-value">{analytics.totalBookings}</h3>
                    <span className="stat-change positive">+8.2% from last month</span>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-icon">💺</div>
                  <div className="stat-info">
                    <p className="stat-label">Seats Sold</p>
                    <h3 className="stat-value">{analytics.seatsSold}</h3>
                    <span className="stat-change neutral">vs {analytics.seatsAvailable} available</span>
                  </div>
                </div>

                <div className="stat-card warning">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <p className="stat-label">Pending Bookings</p>
                    <h3 className="stat-value">{analytics.pendingBookings}</h3>
                    <span className="stat-change">Requires attention</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🚌</div>
                  <div className="stat-info">
                    <p className="stat-label">Total Buses</p>
                    <h3 className="stat-value">{analytics.totalBuses}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🗺️</div>
                  <div className="stat-info">
                    <p className="stat-label">Active Routes</p>
                    <h3 className="stat-value">{analytics.totalRoutes}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-info">
                    <p className="stat-label">Active Vendors</p>
                    <h3 className="stat-value">{analytics.activeVendors}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <p className="stat-label">Occupancy Rate</p>
                    <h3 className="stat-value">
                      {((analytics.seatsSold / (analytics.seatsSold + analytics.seatsAvailable)) * 100).toFixed(1)}%
                    </h3>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section className="quick-actions-section card">
                <h3 className="section-title">⚡ Quick Actions</h3>
                <div className="quick-actions-grid">
                  <button className="action-btn" onClick={() => setActiveSection('buses')}>
                    <span className="action-icon">➕</span>
                    <span>Add New Bus</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveSection('routes')}>
                    <span className="action-icon">🗺️</span>
                    <span>Create Route</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveSection('bookings')}>
                    <span className="action-icon">📋</span>
                    <span>View Bookings</span>
                  </button>
                </div>
              </section>

              {/* Recent Activity */}
              <section className="recent-activity-section card">
                <h3 className="section-title">📋 Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">🎫</span>
                    <div className="activity-details">
                      <p className="activity-text">New booking #TN20251121001</p>
                      <span className="activity-time">2 minutes ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">🚌</span>
                    <div className="activity-details">
                      <p className="activity-text">Bus BA 2 KHA 1234 added</p>
                      <span className="activity-time">1 hour ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">✅</span>
                    <div className="activity-details">
                      <p className="activity-text">Vendor "ABC Travels" verified</p>
                      <span className="activity-time">3 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">💰</span>
                    <div className="activity-details">
                      <p className="activity-text">Payment received Rs. 2,400</p>
                      <span className="activity-time">5 hours ago</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Buses Section */}
          {activeSection === 'buses' && (
            <AdminBuses />
          )}

          {/* Routes Section */}
          {activeSection === 'routes' && (
            <AdminRoutes />
          )}

          {/* Schedules Section */}
          {activeSection === 'schedules' && (
            <AdminSchedules />
          )}

          {/* Bookings Section */}
          {activeSection === 'bookings' && (
            <VendorBookings />
          )}

          {/* Vendor Profile Section */}
          {activeSection === 'profile' && (
            <VendorProfile />
          )}

          {/* Vendors Section */}
          {activeSection === 'vendors' && (
            <VendorManagement />
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <Billing />
          )}

          {/* Seat Management Section */}
          {activeSection === 'seat-management' && (
            <BusSeatManagement />
          )}

          {/* Ratings & Reviews Section */}
          {activeSection === 'ratings' && (
            <RatingsReviews />
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="analytics-section">
              <div className="section-header">
                <h2 className="section-heading">📈 Advanced Analytics</h2>
                <p className="section-subtitle">Detailed performance metrics and insights</p>
              </div>

              {/* Enhanced Analytics Cards */}
              <div className="analytics-grid">
                {/* Revenue Analytics */}
                <div className="analytics-card large">
                  <h3>💰 Revenue Overview</h3>
                  <div className="analytics-stats">
                    <div className="stat-item">
                      <span className="stat-label">Today's Revenue</span>
                      <span className="stat-value">Rs. {(analytics.totalRevenue * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">This Month</span>
                      <span className="stat-value">Rs. {(analytics.totalRevenue * 0.4).toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Revenue</span>
                      <span className="stat-value highlight">Rs. {analytics.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg. Per Booking</span>
                      <span className="stat-value">Rs. {Math.round(analytics.totalRevenue / analytics.totalBookings).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Seat Analytics */}
                <div className="analytics-card large">
                  <h3>💺 Seat Analytics</h3>
                  <div className="analytics-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Seats Sold</span>
                      <span className="stat-value success">{analytics.seatsSold}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Available Seats</span>
                      <span className="stat-value">{analytics.seatsAvailable}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Occupancy Rate</span>
                      <span className="stat-value highlight">
                        {((analytics.seatsSold / (analytics.seatsSold + analytics.seatsAvailable)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Unsold Seats</span>
                      <span className="stat-value warning">{analytics.seatsAvailable}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${(analytics.seatsSold / (analytics.seatsSold + analytics.seatsAvailable)) * 100}%`}}
                    />
                  </div>
                  <p className="progress-label">
                    {analytics.seatsSold} sold out of {analytics.seatsSold + analytics.seatsAvailable} total seats
                  </p>
                </div>

                {/* Booking Analytics */}
                <div className="analytics-card">
                  <h3>🎫 Booking Statistics</h3>
                  <div className="analytics-stats vertical">
                    <div className="stat-item">
                      <span className="stat-label">Total Bookings</span>
                      <span className="stat-value">{analytics.totalBookings}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Confirmed</span>
                      <span className="stat-value success">{Math.round(analytics.totalBookings * 0.85)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Pending</span>
                      <span className="stat-value warning">{analytics.pendingBookings}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Cancelled</span>
                      <span className="stat-value error">{Math.round(analytics.totalBookings * 0.05)}</span>
                    </div>
                  </div>
                </div>

                {/* Fleet Analytics */}
                <div className="analytics-card">
                  <h3>🚌 Fleet Performance</h3>
                  <div className="analytics-stats vertical">
                    <div className="stat-item">
                      <span className="stat-label">Total Buses</span>
                      <span className="stat-value">{analytics.totalBuses}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Active Routes</span>
                      <span className="stat-value">{analytics.totalRoutes}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Active Vendors</span>
                      <span className="stat-value">{analytics.activeVendors}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg. Capacity Utilization</span>
                      <span className="stat-value highlight">78.5%</span>
                    </div>
                  </div>
                </div>

                {/* Revenue per Route */}
                <div className="analytics-card wide">
                  <h3>📍 Top Performing Routes</h3>
                  <div className="route-performance">
                    <div className="route-item">
                      <span className="route-name">Kathmandu → Pokhara</span>
                      <div className="route-stats">
                        <span className="route-bookings">485 bookings</span>
                        <span className="route-revenue">Rs. 679,000</span>
                      </div>
                    </div>
                    <div className="route-item">
                      <span className="route-name">Kathmandu → Chitwan</span>
                      <div className="route-stats">
                        <span className="route-bookings">312 bookings</span>
                        <span className="route-revenue">Rs. 405,600</span>
                      </div>
                    </div>
                    <div className="route-item">
                      <span className="route-name">Pokhara → Lumbini</span>
                      <div className="route-stats">
                        <span className="route-bookings">198 bookings</span>
                        <span className="route-revenue">Rs. 267,300</span>
                      </div>
                    </div>
                    <div className="route-item">
                      <span className="route-name">Kathmandu → Bhairahawa</span>
                      <div className="route-stats">
                        <span className="route-bookings">156 bookings</span>
                        <span className="route-revenue">Rs. 218,400</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Insights */}
                <div className="analytics-card wide">
                  <h3>👥 Customer Insights</h3>
                  <div className="customer-insights">
                    <div className="insight-item">
                      <span className="insight-icon">🔄</span>
                      <div>
                        <span className="insight-label">Repeat Customers</span>
                        <span className="insight-value">42%</span>
                      </div>
                    </div>
                    <div className="insight-item">
                      <span className="insight-icon">⭐</span>
                      <div>
                        <span className="insight-label">Avg. Rating</span>
                        <span className="insight-value">4.6/5</span>
                      </div>
                    </div>
                    <div className="insight-item">
                      <span className="insight-icon">⏱️</span>
                      <div>
                        <span className="insight-label">Avg. Booking Time</span>
                        <span className="insight-value">3.2 mins</span>
                      </div>
                    </div>
                    <div className="insight-item">
                      <span className="insight-icon">💳</span>
                      <div>
                        <span className="insight-label">Online Payment</span>
                        <span className="insight-value">68%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
