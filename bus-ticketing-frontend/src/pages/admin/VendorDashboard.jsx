import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/vendorDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Vendor analytics state
  const [analytics, setAnalytics] = useState({
    totalBuses: 0,
    activeBuses: 0,
    totalBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    pendingBookings: 0,
    completedTrips: 0,
    occupancyRate: 0
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchVendorAnalytics();
  }, []);

  const fetchVendorAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch vendor-specific data
      const busResponse = await fetch(`${API_URL}/buses/vendor`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => ({ ok: false }));

      if (busResponse.ok) {
        const busData = await busResponse.json();
        const buses = busData.data?.buses || [];
        setAnalytics(prev => ({
          ...prev,
          totalBuses: buses.length,
          activeBuses: buses.filter(b => b.is_active).length
        }));
      }

      // Simulated analytics for now (replace with real API calls)
      setAnalytics(prev => ({
        ...prev,
        totalBookings: 342,
        totalRevenue: 856400,
        todayBookings: 12,
        pendingBookings: 5,
        completedTrips: 89,
        occupancyRate: 78.5
      }));

    } catch (error) {
      console.error('Error fetching vendor analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="vendor-dashboard">
        <div className="error-container">
          <p>Please log in to access vendor dashboard</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div>
              <h1 className="dashboard-title">Vendor Dashboard</h1>
              <p className="dashboard-subtitle">Welcome back, {user.name || 'Vendor'}! 👋</p>
            </div>
            <div className="header-actions">
              <Link to="/" className="btn-secondary">
                <span>🏠</span> Home
              </Link>
              <button 
                className="btn-logout"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  navigate('/login');
                }}
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <p className="stat-label">Total Revenue</p>
                <h3 className="stat-value">Rs. {analytics.totalRevenue.toLocaleString()}</h3>
                <span className="stat-change positive">+15.3% this month</span>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <p className="stat-label">Total Bookings</p>
                <h3 className="stat-value">{analytics.totalBookings}</h3>
                <span className="stat-change positive">+{analytics.todayBookings} today</span>
              </div>
            </div>

            <div className="stat-card info">
              <div className="stat-icon">🚌</div>
              <div className="stat-info">
                <p className="stat-label">Total Buses</p>
                <h3 className="stat-value">{analytics.totalBuses}</h3>
                <span className="stat-change neutral">{analytics.activeBuses} active</span>
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
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <p className="stat-label">Completed Trips</p>
                <h3 className="stat-value">{analytics.completedTrips}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <p className="stat-label">Occupancy Rate</p>
                <h3 className="stat-value">{analytics.occupancyRate}%</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2 className="section-title">⚡ Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/vendor/buses" className="action-card">
              <span className="action-icon">🚌</span>
              <h3>Manage Buses</h3>
              <p>Add, edit, or remove buses</p>
            </Link>

            <Link to="/vendor/seat-management" className="action-card">
              <span className="action-icon">💺</span>
              <h3>Seat Management</h3>
              <p>Manage seat allocations</p>
            </Link>

            <Link to="/vendor/billing" className="action-card">
              <span className="action-icon">💰</span>
              <h3>Billing</h3>
              <p>View transactions & invoices</p>
            </Link>

            <Link to="/vendor/ratings" className="action-card">
              <span className="action-icon">⭐</span>
              <h3>Ratings & Reviews</h3>
              <p>View customer feedback</p>
            </Link>
          </div>
        </section>

        {/* Recent Bookings */}
        <section className="recent-bookings-section">
          <div className="section-header">
            <h2 className="section-title">📋 Recent Bookings</h2>
            <Link to="/vendor/bookings" className="btn-view-all">View All</Link>
          </div>
          
          <div className="bookings-table-container">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Passenger</th>
                  <th>Bus</th>
                  <th>Route</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#TN001</td>
                  <td>John Doe</td>
                  <td>BA 2 KHA 1234</td>
                  <td>Kathmandu → Pokhara</td>
                  <td>2025-11-22</td>
                  <td>Rs. 1,200</td>
                  <td><span className="status-badge confirmed">Confirmed</span></td>
                </tr>
                <tr>
                  <td>#TN002</td>
                  <td>Jane Smith</td>
                  <td>BA 2 KHA 5678</td>
                  <td>Pokhara → Chitwan</td>
                  <td>2025-11-22</td>
                  <td>Rs. 800</td>
                  <td><span className="status-badge pending">Pending</span></td>
                </tr>
                <tr>
                  <td>#TN003</td>
                  <td>Ram Sharma</td>
                  <td>BA 2 KHA 1234</td>
                  <td>Kathmandu → Butwal</td>
                  <td>2025-11-23</td>
                  <td>Rs. 1,500</td>
                  <td><span className="status-badge confirmed">Confirmed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Performance Overview */}
        <section className="performance-section">
          <h2 className="section-title">📈 Performance Overview</h2>
          <div className="performance-grid">
            <div className="performance-card">
              <h4>This Week</h4>
              <div className="performance-stats">
                <div className="perf-item">
                  <span className="perf-label">Bookings</span>
                  <span className="perf-value">67</span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Revenue</span>
                  <span className="perf-value">Rs. 84,200</span>
                </div>
              </div>
            </div>

            <div className="performance-card">
              <h4>This Month</h4>
              <div className="performance-stats">
                <div className="perf-item">
                  <span className="perf-label">Bookings</span>
                  <span className="perf-value">342</span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Revenue</span>
                  <span className="perf-value">Rs. 856,400</span>
                </div>
              </div>
            </div>

            <div className="performance-card">
              <h4>Average Rating</h4>
              <div className="rating-display">
                <span className="rating-stars">⭐⭐⭐⭐⭐</span>
                <span className="rating-number">4.8/5.0</span>
                <span className="rating-count">(234 reviews)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VendorDashboard;
