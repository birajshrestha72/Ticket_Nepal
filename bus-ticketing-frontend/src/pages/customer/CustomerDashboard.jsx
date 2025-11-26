import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/customerDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * CustomerDashboard Component
 * Features:
 * - Sidebar with navigation links
 * - Profile section with view/edit mode
 * - Booking history table with status and actions
 */
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // User profile state
  const [user, setUser] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setProfileData({
        full_name: parsedUser.full_name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        address: parsedUser.address || ''
      });
    }
    setLoading(false);
  }, []);

  // Fetch bookings when component mounts
  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setBookings(data.data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Update localStorage
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    // Reset to original user data
    setProfileData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setIsEditingProfile(false);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <div className="customer-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="customer-dashboard">
        <div className="error-container">
          <p>Please log in to access your dashboard</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="user-avatar">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h3 className="user-name">{user.full_name || 'User'}</h3>
          <p className="user-email">{user.email}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </button>
          
          <Link to="/search" className="nav-item">
            <span className="nav-icon">🔍</span>
            <span className="nav-text">Search Buses</span>
          </Link>
          
          <Link to="/bookings" className="nav-item">
            <span className="nav-icon">🎫</span>
            <span className="nav-text">My Bookings</span>
          </Link>
          
          <Link to="/profile" className="nav-item">
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile Settings</span>
          </Link>
          
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
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1 className="dashboard-title">
              Welcome back, {user.full_name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="dashboard-subtitle">
              Manage your bookings and profile from your dashboard
            </p>
          </div>

          {/* Profile Information Section */}
          <section className="profile-section card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="title-icon">👤</span>
                Profile Information
              </h2>
              {!isEditingProfile ? (
                <button 
                  className="btn-edit"
                  onClick={() => setIsEditingProfile(true)}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="btn-save" onClick={handleProfileSave}>
                    ✅ Save
                  </button>
                  <button className="btn-cancel" onClick={handleCancelEdit}>
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="profile-content">
              {!isEditingProfile ? (
                <div className="profile-view">
                  <div className="profile-field">
                    <label className="field-label">Full Name</label>
                    <p className="field-value">{user.full_name || 'Not provided'}</p>
                  </div>
                  <div className="profile-field">
                    <label className="field-label">Email</label>
                    <p className="field-value">{user.email}</p>
                  </div>
                  <div className="profile-field">
                    <label className="field-label">Phone</label>
                    <p className="field-value">{user.phone || 'Not provided'}</p>
                  </div>
                  <div className="profile-field">
                    <label className="field-label">Address</label>
                    <p className="field-value">{user.address || 'Not provided'}</p>
                  </div>
                  <div className="profile-field">
                    <label className="field-label">Account Type</label>
                    <p className="field-value">
                      <span className="role-badge">{user.role}</span>
                    </p>
                  </div>
                  <div className="profile-field">
                    <label className="field-label">Member Since</label>
                    <p className="field-value">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              ) : (
                <div className="profile-edit">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      className="form-input"
                      value={profileData.full_name}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="9851234567"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea
                      name="address"
                      className="form-input"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      rows="3"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Booking History Section */}
          <section className="bookings-section card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="title-icon">🎫</span>
                Booking History
              </h2>
              <button className="btn-refresh" onClick={fetchBookings}>
                🔄 Refresh
              </button>
            </div>

            {bookingsLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>No bookings yet</h3>
                <p>Start your journey by booking a bus ticket</p>
                <Link to="/search" className="btn-primary">
                  Search Buses
                </Link>
              </div>
            ) : (
              <div className="table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Journey Date</th>
                      <th>Route</th>
                      <th>Seats</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <span className="booking-ref">
                            {booking.bookingReference}
                          </span>
                        </td>
                        <td>{formatDate(booking.journeyDate)}</td>
                        <td>
                          <div className="route-info">
                            <span>{booking.pickupPoint}</span>
                            <span className="route-arrow">→</span>
                            <span>{booking.dropPoint}</span>
                          </div>
                        </td>
                        <td>
                          <span className="seat-count">
                            {booking.numberOfSeats} seat{booking.numberOfSeats > 1 ? 's' : ''}
                          </span>
                          <div className="seat-numbers">
                            {booking.seatNumbers?.join(', ')}
                          </div>
                        </td>
                        <td className="amount">{formatCurrency(booking.totalAmount)}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(booking.bookingStatus)}`}>
                            {booking.bookingStatus}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-view" title="View Details">
                              👁️
                            </button>
                            {booking.bookingStatus === 'confirmed' && (
                              <button className="btn-download" title="Download Ticket">
                                📥
                              </button>
                            )}
                            {(booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed') && (
                              <button className="btn-cancel" title="Cancel Booking">
                                ❌
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Quick Stats */}
          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <p className="stat-label">Total Bookings</p>
                <h3 className="stat-value">{bookings.length}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <p className="stat-label">Confirmed</p>
                <h3 className="stat-value">
                  {bookings.filter(b => b.bookingStatus === 'confirmed').length}
                </h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <p className="stat-label">Pending</p>
                <h3 className="stat-value">
                  {bookings.filter(b => b.bookingStatus === 'pending').length}
                </h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <p className="stat-label">Total Spent</p>
                <h3 className="stat-value">
                  {formatCurrency(bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0))}
                </h3>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
