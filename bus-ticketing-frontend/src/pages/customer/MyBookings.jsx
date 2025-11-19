import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../css/customerDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const MyBookings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const data = await response.json();
      if (data.status === 'success') {
        setBookings(data.data.bookings || []);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(b => 
          b.bookingStatus === 'confirmed' && 
          new Date(b.journeyDate) >= today
        );
      case 'completed':
        return bookings.filter(b => b.bookingStatus === 'completed');
      case 'cancelled':
        return bookings.filter(b => b.bookingStatus === 'cancelled');
      default:
        return bookings;
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="page my-bookings">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page my-bookings">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Bookings</h1>
          <Link to="/search" className="btn-primary">
            Book New Ticket
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({bookings.length})
          </button>
          <button 
            className={`tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>

        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchBookings} className="btn-retry">
              Try Again
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <h3>No bookings found</h3>
            <p>You don't have any {filter !== 'all' ? filter : ''} bookings yet</p>
            <Link to="/search" className="btn-primary">
              Search Buses
            </Link>
          </div>
        ) : (
          <div className="bookings-grid">
            {filteredBookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <span className="booking-ref">{booking.bookingReference}</span>
                  <span className={`status-badge ${getStatusClass(booking.bookingStatus)}`}>
                    {booking.bookingStatus}
                  </span>
                </div>
                
                <div className="booking-route">
                  <div className="route-point">
                    <span className="point-label">From</span>
                    <strong>{booking.pickupPoint}</strong>
                  </div>
                  <div className="route-arrow">→</div>
                  <div className="route-point">
                    <span className="point-label">To</span>
                    <strong>{booking.dropPoint}</strong>
                  </div>
                </div>
                
                <div className="booking-details">
                  <div className="detail-row">
                    <span className="detail-label">📅 Journey Date:</span>
                    <span>{formatDate(booking.journeyDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">💺 Seats:</span>
                    <span>{booking.seatNumbers?.join(', ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">💰 Amount:</span>
                    <strong>Rs. {booking.totalAmount}</strong>
                  </div>
                </div>
                
                <div className="booking-actions">
                  <button className="btn-secondary btn-sm">
                    View Details
                  </button>
                  {booking.bookingStatus === 'confirmed' && (
                    <button className="btn-primary btn-sm">
                      Download Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
