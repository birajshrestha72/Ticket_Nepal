import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/reviewNotification.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Star Rating Component
const StarRating = ({ value, onChange, readonly = false }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= value ? 'filled' : ''}`}
          onClick={() => !readonly && onChange(star)}
          disabled={readonly}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

/**
 * ReviewNotification Component
 * 
 * Shows eligible bookings for review after ride completion (24 hours after departure)
 * Users can rate and review their completed journeys
 */
const ReviewNotification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
    categories: {
      cleanliness: 0,
      punctuality: 0,
      driverBehavior: 0,
      comfort: 0,
      safety: 0
    }
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEligibleBookings();
  }, []);

  const fetchEligibleBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/bookings/eligible-for-review`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch eligible bookings');

      const data = await response.json();
      if (data.status === 'success') {
        // Backend already filters for completed bookings where 24+ hours have passed
        // since ride start time (journey_date + departure_time)
        const bookings = data.data.bookings || [];
        
        // Only filter out bookings that already have reviews
        const filtered = bookings.filter(booking => !booking.hasReview);
        
        setEligibleBookings(filtered);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setLoading(false);
    }
  };

  const handleRatingClick = (value) => {
    setReviewData({ ...reviewData, rating: value });
  };

  const handleCategoryRating = (category, value) => {
    setReviewData({
      ...reviewData,
      categories: {
        ...reviewData.categories,
        [category]: value
      }
    });
  };

  const handleCommentChange = (e) => {
    setReviewData({ ...reviewData, comment: e.target.value });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (reviewData.rating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reviews/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          busId: selectedBooking.busId,
          vendorId: selectedBooking.vendorId,
          overallRating: reviewData.rating,
          cleanlinessRating: reviewData.categories.cleanliness,
          punctualityRating: reviewData.categories.punctuality,
          driverBehaviorRating: reviewData.categories.driverBehavior,
          comfortRating: reviewData.categories.comfort,
          safetyRating: reviewData.categories.safety,
          comment: reviewData.comment
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Thank you for your review! Your feedback helps us improve.');
        
        // Remove reviewed booking from list
        setEligibleBookings(eligibleBookings.filter(b => b.id !== selectedBooking.id));
        
        // Reset form
        setSelectedBooking(null);
        setReviewData({
          rating: 0,
          comment: '',
          categories: {
            cleanliness: 0,
            punctuality: 0,
            driverBehavior: 0,
            comfort: 0,
            safety: 0
          }
        });
      } else {
        // Show backend error message (e.g., "Please wait X more hour(s)")
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (err) {
      alert('Failed to submit review: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    setSelectedBooking(null);
    setReviewData({
      rating: 0,
      comment: '',
      categories: {
        cleanliness: 0,
        punctuality: 0,
        driverBehavior: 0,
        comfort: 0,
        safety: 0
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getRatingText = (rating) => {
    const texts = ['Select rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return texts[rating] || 'Select rating';
  };

  if (loading) {
    return (
      <div className="review-notification-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading completed journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-notification-page">
      <div className="review-container">
        <div className="page-header">
          <h1 className="page-title">📝 Rate Your Journey</h1>
          <p className="page-subtitle">
            Share your experience to help fellow travelers and improve our service
          </p>
        </div>

        {eligibleBookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No Pending Reviews</h3>
            <p>You're all caught up! Reviews become available 24 hours after your journey.</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/customer')}
            >
              Go to Dashboard
            </button>
          </div>
        ) : selectedBooking ? (
          /* Review Form */
          <div className="review-form-container">
            <button 
              className="btn-back"
              onClick={handleSkipReview}
            >
              ← Back to List
            </button>

            <div className="booking-summary">
              <h3>Reviewing Journey</h3>
              <div className="summary-content">
                <p><strong>{selectedBooking.vendorName}</strong></p>
                <p>{selectedBooking.busType} - {selectedBooking.busNumber}</p>
                <p>{selectedBooking.pickupPoint} → {selectedBooking.dropPoint}</p>
                <p>{formatDate(selectedBooking.journeyDate)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="review-form">
              {/* Overall Rating */}
              <div className="form-section">
                <h3 className="form-section-title">Overall Rating *</h3>
                <div className="rating-container">
                  <StarRating 
                    value={reviewData.rating}
                    onChange={handleRatingClick}
                  />
                  <span className="rating-text">
                    {getRatingText(reviewData.rating)}
                  </span>
                </div>
              </div>

              {/* Category Ratings */}
              <div className="form-section">
                <h3 className="form-section-title">Rate Specific Aspects</h3>
                
                <div className="category-ratings">
                  <div className="category-item">
                    <span className="category-label">🧹 Cleanliness</span>
                    <StarRating 
                      value={reviewData.categories.cleanliness}
                      onChange={(value) => handleCategoryRating('cleanliness', value)}
                    />
                  </div>

                  <div className="category-item">
                    <span className="category-label">⏰ Punctuality</span>
                    <StarRating 
                      value={reviewData.categories.punctuality}
                      onChange={(value) => handleCategoryRating('punctuality', value)}
                    />
                  </div>

                  <div className="category-item">
                    <span className="category-label">👨‍✈️ Driver Behavior</span>
                    <StarRating 
                      value={reviewData.categories.driverBehavior}
                      onChange={(value) => handleCategoryRating('driverBehavior', value)}
                    />
                  </div>

                  <div className="category-item">
                    <span className="category-label">💺 Comfort</span>
                    <StarRating 
                      value={reviewData.categories.comfort}
                      onChange={(value) => handleCategoryRating('comfort', value)}
                    />
                  </div>

                  <div className="category-item">
                    <span className="category-label">🛡️ Safety</span>
                    <StarRating 
                      value={reviewData.categories.safety}
                      onChange={(value) => handleCategoryRating('safety', value)}
                    />
                  </div>
                </div>
              </div>

              {/* Written Review */}
              <div className="form-section">
                <h3 className="form-section-title">Share Your Experience</h3>
                <textarea
                  className="review-textarea"
                  placeholder="Tell us about your journey... What did you like? What could be improved?"
                  value={reviewData.comment}
                  onChange={handleCommentChange}
                  rows="6"
                  maxLength="1000"
                />
                <span className="char-count">
                  {reviewData.comment.length}/1000 characters
                </span>
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting || reviewData.rating === 0}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-small"></span>
                      {' '}Submitting...
                    </>
                  ) : (
                    '✅ Submit Review'
                  )}
                </button>
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={handleSkipReview}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* List of eligible bookings */
          <div className="bookings-list">
            <h2 className="section-title">Completed Journeys Ready for Review</h2>
            {eligibleBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <div className="booking-info">
                    <h3 className="booking-ref">
                      {booking.bookingReference}
                    </h3>
                    <span className="journey-date">
                      {formatDate(booking.journeyDate)}
                    </span>
                  </div>
                  <span className="status-badge status-completed">
                    Completed
                  </span>
                </div>

                <div className="booking-details">
                  <div className="detail-row">
                    <span className="label">🚌 Bus:</span>
                    <strong>{booking.busType} - {booking.busNumber}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="label">🏢 Vendor:</span>
                    <span>{booking.vendorName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📍 Route:</span>
                    <span>{booking.pickupPoint} → {booking.dropPoint}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🪑 Seats:</span>
                    <span>{booking.seatNumbers?.join(', ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🕐 Departure:</span>
                    <span>{booking.departureTime}</span>
                  </div>
                </div>

                <div className="booking-actions">
                  <button 
                    className="btn-review"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    ✍️ Write Review
                  </button>
                  <button 
                    className="btn-skip"
                    onClick={() => {
                      // Mark as skipped (optional: call API to track)
                      setEligibleBookings(eligibleBookings.filter(b => b.id !== booking.id));
                    }}
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewNotification;
