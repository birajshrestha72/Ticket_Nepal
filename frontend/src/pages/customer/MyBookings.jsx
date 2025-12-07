import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/customerDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const MyBookings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelDetails, setCancelDetails] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const data = await response.json();
      if (data.status === 'success') {
        setBookings(data.data.bookings || []);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Calculate refund amount based on cancellation time
  const calculateRefund = (journeyDate, totalAmount) => {
    const journey = new Date(journeyDate);
    const now = new Date();
    const hoursUntilJourney = (journey - now) / (1000 * 60 * 60);
    
    if (hoursUntilJourney >= 48) {
      // 48 hours or more: 90% refund
      return {
        percentage: 90,
        amount: totalAmount * 0.9,
        message: '90% refund (48+ hours before journey)'
      };
    } else if (hoursUntilJourney >= 12) {
      // 12-48 hours: 25% refund
      return {
        percentage: 25,
        amount: totalAmount * 0.25,
        message: '25% refund (12-48 hours before journey)'
      };
    } else {
      // Less than 12 hours: No refund
      return {
        percentage: 0,
        amount: 0,
        message: 'No refund (less than 12 hours before journey)'
      };
    }
  };

  const handleCancelClick = (booking) => {
    const refund = calculateRefund(booking.journeyDate, parseFloat(booking.totalAmount));
    setSelectedBooking(booking);
    setCancelDetails(refund);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!selectedBooking) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/bookings/${selectedBooking.id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (data.status === 'success') {
        alert(`Booking cancelled successfully! Refund: Rs. ${cancelDetails.amount.toLocaleString()}`);
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancelDetails(null);
        fetchBookings(); // Refresh bookings list
      } else {
        alert(`Error: ${data.message || 'Failed to cancel booking'}`);
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const canCancelBooking = (booking) => {
    if (booking.bookingStatus !== 'confirmed') return false;
    
    const journey = new Date(booking.journeyDate);
    const now = new Date();
    const hoursUntilJourney = (journey - now) / (1000 * 60 * 60);
    
    return hoursUntilJourney >= 12; // Can cancel if 12+ hours before journey
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
                    <>
                      <button className="btn-primary btn-sm">
                        Download Ticket
                      </button>
                      {canCancelBooking(booking) && (
                        <button 
                          className="btn-danger btn-sm"
                          onClick={() => handleCancelClick(booking)}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancellation Modal */}
        {showCancelModal && selectedBooking && cancelDetails && (
          <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Cancel Booking</h2>
                <button className="close-modal" onClick={() => setShowCancelModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="cancel-warning">
                  <span className="warning-icon">⚠️</span>
                  <p>Are you sure you want to cancel this booking?</p>
                </div>
                
                <div className="booking-summary">
                  <h3>Booking Details</h3>
                  <div className="detail-row">
                    <span>Booking Reference:</span>
                    <strong>{selectedBooking.bookingReference}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Route:</span>
                    <strong>{selectedBooking.pickupPoint} → {selectedBooking.dropPoint}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Journey Date:</span>
                    <strong>{formatDate(selectedBooking.journeyDate)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Total Amount:</span>
                    <strong>Rs. {parseFloat(selectedBooking.totalAmount).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="refund-info">
                  <h3>Refund Information</h3>
                  <div className="refund-details">
                    <div className="refund-percentage">
                      {cancelDetails.percentage}% Refund
                    </div>
                    <div className="refund-amount">
                      Rs. {cancelDetails.amount.toLocaleString()}
                    </div>
                    <div className="refund-message">
                      {cancelDetails.message}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowCancelModal(false)}
                  >
                    Keep Booking
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={confirmCancellation}
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
