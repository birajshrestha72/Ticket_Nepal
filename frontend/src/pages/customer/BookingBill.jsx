import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../css/bookingBill.css';

const BookingBill = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;

  // Redirect if no booking data
  if (!bookingData) {
    navigate('/search');
    return null;
  }

  const {
    busDetails,
    scheduleId,
    journeyDate,
    selectedSeats,
    numberOfSeats,
    passengerDetails,
    farePerSeat
  } = bookingData;

  // Calculate breakdown
  const subtotal = numberOfSeats * farePerSeat;
  const serviceFee = subtotal * 0.02; // 2% service fee
  const tax = subtotal * 0.05; // 5% tax
  const grandTotal = subtotal + serviceFee + tax;

  const handleProceedToPayment = () => {
    // Pass complete booking data with calculated totals to payment
    navigate('/payment', { 
      state: {
        ...bookingData,
        breakdown: {
          subtotal,
          serviceFee,
          tax,
          grandTotal
        }
      }
    });
  };

  const handleEditBooking = () => {
    // Go back to booking page with bus details
    navigate(`/booking?busId=${busDetails.id}&scheduleId=${scheduleId}`);
  };

  return (
    <div className="booking-bill-page">
      <div className="bill-container">
        <h1 className="bill-title">Review Your Booking</h1>
        <p className="bill-subtitle">Please verify all details before proceeding to payment</p>

        <div className="bill-layout">
          {/* Left Section: Booking Details */}
          <div className="bill-details-section">
            {/* Bus Information */}
            <div className="bill-card">
              <h3 className="card-title">🚌 Bus Information</h3>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="label">Bus Type:</span>
                  <strong>{busDetails.busType}</strong>
                </div>
                <div className="detail-row">
                  <span className="label">Bus Number:</span>
                  <strong>{busDetails.busNumber}</strong>
                </div>
                <div className="detail-row">
                  <span className="label">Vendor:</span>
                  <span>{busDetails.vendor}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Departure Time:</span>
                  <span>{busDetails.departureTime}</span>
                </div>
              </div>
            </div>

            {/* Journey Details */}
            <div className="bill-card">
              <h3 className="card-title">🗓️ Journey Details</h3>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="label">Journey Date:</span>
                  <strong>{new Date(journeyDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</strong>
                </div>
                <div className="detail-row">
                  <span className="label">From:</span>
                  <span>{passengerDetails.pickupPoint}</span>
                </div>
                <div className="detail-row">
                  <span className="label">To:</span>
                  <span>{passengerDetails.dropPoint}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Selected Seats:</span>
                  <strong className="seat-badges">
                    {selectedSeats.map(seat => (
                      <span key={seat} className="seat-badge">{seat}</span>
                    ))}
                  </strong>
                </div>
                <div className="detail-row">
                  <span className="label">Total Seats:</span>
                  <strong>{numberOfSeats}</strong>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="bill-card">
              <h3 className="card-title">👤 Passenger Information</h3>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <strong>{passengerDetails.name}</strong>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span>{passengerDetails.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span>{passengerDetails.email}</span>
                </div>
                {passengerDetails.specialRequests && (
                  <div className="detail-row full-width">
                    <span className="label">Special Requests:</span>
                    <span className="special-requests">{passengerDetails.specialRequests}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Price Breakdown */}
          <div className="bill-summary-section">
            <div className="summary-card">
              <h3 className="card-title">💰 Price Breakdown</h3>
              
              <div className="breakdown-list">
                <div className="breakdown-item">
                  <span className="breakdown-label">
                    Fare ({numberOfSeats} seat{numberOfSeats > 1 ? 's' : ''} × Rs. {farePerSeat})
                  </span>
                  <span className="breakdown-value">Rs. {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="breakdown-item">
                  <span className="breakdown-label">Service Fee (2%)</span>
                  <span className="breakdown-value">Rs. {serviceFee.toFixed(2)}</span>
                </div>
                
                <div className="breakdown-item">
                  <span className="breakdown-label">Tax (5%)</span>
                  <span className="breakdown-value">Rs. {tax.toFixed(2)}</span>
                </div>
                
                <div className="breakdown-divider"></div>
                
                <div className="breakdown-item total">
                  <span className="breakdown-label">Grand Total</span>
                  <strong className="breakdown-value">Rs. {grandTotal.toFixed(2)}</strong>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn-primary btn-proceed"
                  onClick={handleProceedToPayment}
                >
                  Proceed to Payment →
                </button>
                <button 
                  className="btn-secondary btn-edit"
                  onClick={handleEditBooking}
                >
                  ← Edit Booking
                </button>
              </div>
            </div>

            {/* Important Notes */}
            <div className="notes-card">
              <h4>📋 Important Notes</h4>
              <ul>
                <li>Tickets are non-refundable after payment</li>
                <li>Please arrive 15 minutes before departure</li>
                <li>Carry valid ID proof for verification</li>
                <li>Seat numbers are subject to bus availability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingBill;
