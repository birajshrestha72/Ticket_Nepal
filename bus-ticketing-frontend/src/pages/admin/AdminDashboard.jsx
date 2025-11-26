import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/adminDashboard.css';

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
      // In production, create dedicated analytics endpoints
      const responses = await Promise.all([
        fetch(`${API_URL}/buses/all`, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(`${API_URL}/routes`, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(`${API_URL}/bookings/analytics?start=${dateFilter.startDate}&end=${dateFilter.endDate}`, { 
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false }))
      ]);

      // Process responses
      if (responses[0].ok) {
        const busData = await responses[0].json();
        setAnalytics(prev => ({
          ...prev,
          totalBuses: busData.data?.buses?.length || 0,
          seatsAvailable: busData.data?.buses?.reduce((sum, bus) => sum + (bus.available_seats || 0), 0) || 0
        }));
      }

      if (responses[1].ok) {
        const routeData = await responses[1].json();
        setAnalytics(prev => ({
          ...prev,
          totalRoutes: routeData.data?.routes?.length || 0
        }));
      }

      // Simulated analytics for now
      setAnalytics(prev => ({
        ...prev,
        totalBookings: 1247,
        totalRevenue: 2847500,
        seatsSold: 3892,
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
            className={`nav-item ${activeSection === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveSection('bookings')}
          >
            <span className="nav-icon">🎫</span>
            <span className="nav-text">Bookings</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveSection('vendors')}
          >
            <span className="nav-icon">🏢</span>
            <span className="nav-text">Vendors</span>
          </button>

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
                  Welcome back, {user.name?.split(' ')[0] || 'Admin'}! 👋
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
                  <div className="stat-icon">🎫</div>
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
                  <button className="action-btn" onClick={() => setActiveSection('vendors')}>
                    <span className="action-icon">🏢</span>
                    <span>Add Vendor</span>
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
            <div className="section-content">
              <h2 className="section-heading">🚌 Manage Buses</h2>
              <p>View, add, edit, and delete buses in the system</p>
              <Link to="/admin/buses" className="btn-primary">Go to Bus Management</Link>
            </div>
          )}

          {/* Routes Section */}
          {activeSection === 'routes' && (
            <div className="section-content">
              <h2 className="section-heading">🗺️ Manage Routes</h2>
              <p>Create and manage bus routes between cities</p>
              <div className="coming-soon">Coming soon...</div>
            </div>
          )}

          {/* Bookings Section */}
          {activeSection === 'bookings' && (
            <div className="section-content">
              <h2 className="section-heading">🎫 Bookings Management</h2>
              <p>View and manage all customer bookings</p>
              <div className="coming-soon">Coming soon...</div>
            </div>
          )}

          {/* Vendors Section */}
          {activeSection === 'vendors' && (
            <div className="section-content">
              <h2 className="section-heading">🏢 Vendor Management</h2>
              <p>Manage vendor accounts, verification, and commission</p>
              <div className="coming-soon">Coming soon...</div>
            </div>
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <div className="section-content">
              <h2 className="section-heading">💰 Billing & Payments</h2>
              <p>View transactions, refunds, and financial reports</p>
              <div className="coming-soon">Coming soon...</div>
            </div>
          )}

          {/* Seat Management Section */}
          {activeSection === 'seat-management' && (
            <div className="section-content">
              <h2 className="section-heading">💺 Seat Management</h2>
              <p>Manage seat allocations and vendor-side bookings</p>
              <div className="coming-soon">Coming soon...</div>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="section-content">
              <h2 className="section-heading">📈 Advanced Analytics</h2>
              <p>Detailed reports on revenue, bookings, and performance</p>
              <div className="coming-soon">Coming soon...</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
