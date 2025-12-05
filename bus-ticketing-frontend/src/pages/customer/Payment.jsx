import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../css/payment.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Payment Component with Pay Now/Later Options
 * Features:
 * - Pay Now: Khalti or eSewa wallet integration
 * - Pay Later: Reserve seats, pay at counter
 * - Complete booking summary with all details
 * - Secure payment flow
 */
const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;
  
  const [paymentOption, setPaymentOption] = useState('now'); // 'now' or 'later'
  const [selectedWallet, setSelectedWallet] = useState(''); // 'khalti' or 'esewa'
  const [processing, setProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showWalletLogin, setShowWalletLogin] = useState(false);

  // Wallet login credentials (simulation)
  const [walletCredentials, setWalletCredentials] = useState({
    mobile: '',
    pin: ''
  });

  // Redirect if no booking data
  if (!bookingData) {
    navigate('/search');
    return null;
  }

  const handlePayNowClick = (wallet) => {
    setSelectedWallet(wallet);
    setShowWalletLogin(true);
  };

  const handleWalletLogin = async (e) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      alert('Please agree to terms and conditions');
      return;
    }
    
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Simulate wallet login and payment verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production: Integrate with Khalti/eSewa APIs
      // const walletResponse = await fetch(walletApiUrl, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     mobile: walletCredentials.mobile,
      //     pin: walletCredentials.pin,
      //     amount: bookingData.pricing.totalAmount
      //   })
      // });
      
      // Step 2: Create booking with paid status
      const bookingPayload = {
        scheduleId: bookingData.schedule.schedule_id,
        journeyDate: bookingData.journeyDate,
        numberOfSeats: bookingData.numberOfSeats,
        seatNumbers: bookingData.selectedSeats,
        passengerName: bookingData.passengerDetails.name,
        passengerPhone: bookingData.passengerDetails.phone,
        passengerEmail: bookingData.passengerDetails.email,
        pickupPoint: bookingData.passengerDetails.pickupPoint || bookingData.busDetails.origin,
        dropPoint: bookingData.passengerDetails.dropPoint || bookingData.busDetails.destination,
        specialRequests: bookingData.passengerDetails.specialRequests || '',
        totalAmount: parseFloat(bookingData.pricing.totalAmount),
        paymentMethod: selectedWallet,
        paymentStatus: 'success'
      };
      
      const response = await fetch(`${API_URL}/bookings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        navigate('/booking-success', { 
          state: {
            bookingId: data.data.booking.booking_id,
            bookingReference: data.data.booking.booking_reference,
            ...bookingData,
            paymentMethod: selectedWallet,
            paymentStatus: 'Paid'
          }
        });
      } else {
        throw new Error(data.message || 'Booking creation failed');
      }
    } catch (err) {
      alert('Payment failed: ' + err.message);
      setProcessing(false);
    }
  };

  const handlePayLater = async () => {
    if (!agreedToTerms) {
      alert('Please agree to terms and conditions');
      return;
    }
    
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Create booking with pending payment status
      const bookingPayload = {
        scheduleId: bookingData.schedule.schedule_id,
        journeyDate: bookingData.journeyDate,
        numberOfSeats: bookingData.numberOfSeats,
        seatNumbers: bookingData.selectedSeats,
        passengerName: bookingData.passengerDetails.name,
        passengerPhone: bookingData.passengerDetails.phone,
        passengerEmail: bookingData.passengerDetails.email,
        pickupPoint: bookingData.passengerDetails.pickupPoint || bookingData.busDetails.origin,
        dropPoint: bookingData.passengerDetails.dropPoint || bookingData.busDetails.destination,
        specialRequests: bookingData.passengerDetails.specialRequests || '',
        totalAmount: parseFloat(bookingData.pricing.totalAmount),
        paymentMethod: 'cash',
        paymentStatus: 'pending'
      };
      
      const response = await fetch(`${API_URL}/bookings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        navigate('/booking-success', { 
          state: {
            bookingId: data.data.booking.booking_id,
            bookingReference: data.data.booking.booking_reference,
            ...bookingData,
            paymentMethod: 'cash',
            paymentStatus: 'Pending - Pay at Counter'
          }
        });
      } else {
        throw new Error(data.message || 'Booking creation failed');
      }
    } catch (err) {
      alert('Booking failed: ' + err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1 className="payment-title">Payment Options</h1>
        
        <div className="payment-layout">
          {/* Left: Payment Options */}
          <div className="payment-options-section">
            {/* Pay Now Section */}
            <div className="payment-option-card">
              <div className="option-header">
                <h3>💳 Pay Now</h3>
                <span className="badge instant">Instant Confirmation</span>
              </div>
              
              <p className="option-description">
                Complete payment now using Khalti or eSewa and get instant booking confirmation.
              </p>

              {!showWalletLogin ? (
                <div className="wallet-options">
                  <button 
                    className="wallet-btn esewa"
                    onClick={() => handlePayNowClick('esewa')}
                    disabled={processing}
                  >
                    <div className="wallet-logo">
                      <span className="wallet-icon">💰</span>
                      <span className="wallet-name">eSewa</span>
                    </div>
                    <span className="wallet-arrow">→</span>
                  </button>

                  <button 
                    className="wallet-btn khalti"
                    onClick={() => handlePayNowClick('khalti')}
                    disabled={processing}
                  >
                    <div className="wallet-logo">
                      <span className="wallet-icon">📱</span>
                      <span className="wallet-name">Khalti</span>
                    </div>
                    <span className="wallet-arrow">→</span>
                  </button>
                </div>
              ) : (
                <div className="wallet-login-form">
                  <div className="wallet-header">
                    <h4>Login to {selectedWallet === 'khalti' ? 'Khalti' : 'eSewa'}</h4>
                    <button 
                      className="btn-close"
                      onClick={() => {
                        setShowWalletLogin(false);
                        setSelectedWallet('');
                        setWalletCredentials({ mobile: '', pin: '' });
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleWalletLogin}>
                    <div className="form-group">
                      <label htmlFor="mobile">Mobile Number</label>
                      <input
                        type="tel"
                        id="mobile"
                        placeholder="98XXXXXXXX"
                        value={walletCredentials.mobile}
                        onChange={(e) => setWalletCredentials({
                          ...walletCredentials,
                          mobile: e.target.value
                        })}
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pin">
                        {selectedWallet === 'khalti' ? 'MPIN' : 'Password'}
                      </label>
                      <input
                        type="password"
                        id="pin"
                        placeholder={selectedWallet === 'khalti' ? 'Enter 4-digit MPIN' : 'Enter password'}
                        value={walletCredentials.pin}
                        onChange={(e) => setWalletCredentials({
                          ...walletCredentials,
                          pin: e.target.value
                        })}
                        required
                      />
                    </div>

                    <div className="terms-checkbox">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                      />
                      <label htmlFor="terms">
                        I agree to <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      className="btn-wallet-pay"
                      disabled={processing || !agreedToTerms}
                    >
                      {processing ? (
                        <>
                          <span className="spinner-small"></span>
                          {' '}Processing...
                        </>
                      ) : (
                        <>Pay Rs. {parseFloat(bookingData.pricing.totalAmount).toLocaleString()}</>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Pay Later Section */}
            <div className="payment-option-card">
              <div className="option-header">
                <h3>🏢 Pay Later</h3>
                <span className="badge pending">Reservation</span>
              </div>
              
              <p className="option-description">
                Reserve your seats now and pay at the bus counter before departure.
                Seats will be held for 2 hours.
              </p>

              <div className="pay-later-details">
                <div className="detail-item">
                  <span className="icon">⏰</span>
                  <span>Pay within 2 hours of booking</span>
                </div>
                <div className="detail-item">
                  <span className="icon">🎫</span>
                  <span>Collect ticket at counter</span>
                </div>
                <div className="detail-item">
                  <span className="icon">💵</span>
                  <span>Cash or card accepted</span>
                </div>
              </div>

              {!showWalletLogin && (
                <>
                  <div className="terms-checkbox">
                    <input
                      type="checkbox"
                      id="terms-later"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    <label htmlFor="terms-later">
                      I agree to <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
                    </label>
                  </div>

                  <button 
                    className="btn-pay-later"
                    onClick={handlePayLater}
                    disabled={processing || !agreedToTerms}
                  >
                    {processing ? (
                      <>
                        <span className="spinner-small"></span>
                        {' '}Processing...
                      </>
                    ) : (
                      'Reserve Seats - Pay Later'
                    )}
                  </button>
                </>
              )}
            </div>

            <div className="secure-badge">
              <span className="badge-icon">🔒</span>
              <span>Secure Payment • SSL Encrypted</span>
            </div>
          </div>

          {/* Right: Booking Summary */}
          <div className="booking-summary-section">
            <div className="summary-card">
              <h3 className="section-title">Booking Summary</h3>
              
              <div className="summary-header-info">
                <div className="bus-info">
                  <h4>{bookingData.busDetails.busNumber}</h4>
                  <span className="bus-type">{bookingData.busDetails.busType}</span>
                </div>
                <div className="vendor-info">
                  <span>{bookingData.busDetails.vendorName}</span>
                </div>
              </div>

              <div className="summary-details">
                <div className="detail-row">
                  <span className="label">🗓️ Journey Date:</span>
                  <span className="value">{new Date(bookingData.journeyDate).toLocaleDateString('en-GB')}</span>
                </div>
                
                <div className="detail-row">
                  <span className="label">📍 Route:</span>
                  <span className="value">
                    {bookingData.busDetails.origin} → {bookingData.busDetails.destination}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="label">⏰ Departure:</span>
                  <span className="value">{bookingData.busDetails.departureTime}</span>
                </div>
                
                <div className="detail-row">
                  <span className="label">👤 Passenger:</span>
                  <span className="value">{bookingData.passengerDetails.name}</span>
                </div>
                
                <div className="detail-row">
                  <span className="label">💺 Seats:</span>
                  <span className="value seats">{bookingData.selectedSeats.join(', ')}</span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="detail-row">
                  <span className="label">Fare ({bookingData.numberOfSeats} seats):</span>
                  <span className="value">Rs. {bookingData.pricing.subtotal.toLocaleString()}</span>
                </div>
                
                <div className="detail-row">
                  <span className="label">Service Fee (2%):</span>
                  <span className="value">Rs. {parseFloat(bookingData.pricing.serviceFee).toLocaleString()}</span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="detail-row total">
                  <span className="label">Total Amount:</span>
                  <strong className="value">Rs. {parseFloat(bookingData.pricing.totalAmount).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <button 
              className="btn-back"
              onClick={() => navigate(-1)}
              disabled={processing}
            >
              ← Back to Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
