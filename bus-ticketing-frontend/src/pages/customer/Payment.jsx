import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../css/payment.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;
  
  const [error] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  const [processing, setProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Redirect if no booking data
  if (!bookingData) {
    navigate('/search');
    return null;
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      alert('Please agree to terms and conditions');
      return;
    }
    
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Initiate payment with selected gateway
      // In production, integrate with eSewa/Khalti/etc APIs
      // Example: const response = await paymentGateway.initiate({
      //   amount: bookingData.breakdown.grandTotal,
      //   paymentMethod: paymentMethod,
      //   returnUrl: `${globalThis.location.origin}/payment-verify`
      // });
      
      // Simulate payment gateway verification (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: After payment verification, create the booking
      const bookingPayload = {
        scheduleId: bookingData.scheduleId,
        journeyDate: bookingData.journeyDate,
        numberOfSeats: bookingData.numberOfSeats,
        seatNumbers: bookingData.selectedSeats,
        passengerName: bookingData.passengerDetails.name,
        passengerPhone: bookingData.passengerDetails.phone,
        passengerEmail: bookingData.passengerDetails.email,
        pickupPoint: bookingData.passengerDetails.pickupPoint,
        dropPoint: bookingData.passengerDetails.dropPoint,
        specialRequests: bookingData.passengerDetails.specialRequests,
        totalAmount: bookingData.breakdown.grandTotal,
        paymentMethod: paymentMethod,
        paymentStatus: 'paid'
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
        // Navigate to success page with booking ID and full data
        navigate('/booking-success', { 
          state: {
            bookingId: data.data.booking.id,
            bookingReference: data.data.booking.booking_reference,
            ...bookingData
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

  if (error) {
    return (
      <div className="payment-page">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/search')} className="btn-primary">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1 className="payment-title">Complete Payment</h1>
        
        <div className="payment-layout">
          {/* Left: Payment Methods */}
          <div className="payment-methods-section">
            <div className="card">
              <h3 className="section-title">Select Payment Method</h3>
              
              <form onSubmit={handlePayment}>
                <div className="payment-options">
                  <label className="payment-option" aria-label="Pay with eSewa">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="esewa"
                      checked={paymentMethod === 'esewa'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="option-content">
                      <img src="/images/payment/esewa.png" alt="eSewa" className="payment-logo" onError={(e) => e.target.style.display = 'none'} />
                      <span className="option-name">eSewa</span>
                    </div>
                  </label>

                  <label className="payment-option" aria-label="Pay with Khalti">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="khalti"
                      checked={paymentMethod === 'khalti'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="option-content">
                      <img src="/images/payment/khalti.png" alt="Khalti" className="payment-logo" onError={(e) => e.target.style.display = 'none'} />
                      <span className="option-name">Khalti</span>
                    </div>
                  </label>

                  <label className="payment-option" aria-label="Pay with Bank Transfer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="option-content">
                      <span className="payment-icon">🏦</span>
                      <span className="option-name">Bank Transfer</span>
                    </div>
                  </label>

                  <label className="payment-option" aria-label="Pay with Cash">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="option-content">
                      <span className="payment-icon">💵</span>
                      <span className="option-name">Cash Payment</span>
                    </div>
                  </label>
                </div>

                <div className="terms-checkbox">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <label htmlFor="terms">
                    I agree to the <a href="/terms">Terms and Conditions</a> and <a href="/privacy">Privacy Policy</a>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="btn-pay"
                  disabled={processing || !agreedToTerms}
                >
                  {processing ? (
                    <>
                      <span className="spinner-small"></span>
                      {' '}Verifying Payment...
                    </>
                  ) : (
                    <>
                      Pay Rs. {bookingData.breakdown.grandTotal.toFixed(2)}
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="secure-payment-badge">
              <span className="badge-icon">🔒</span>
              <div className="badge-text">
                <strong>Secure Payment</strong>
                <p>Your payment information is encrypted and secure</p>
              </div>
            </div>
          </div>

          {/* Right: Booking Summary */}
          <div className="booking-summary-section">
            <div className="card">
              <h3 className="section-title">Booking Summary</h3>
              
              <div className="summary-details">
                <div className="detail-item">
                  <span className="label">Bus:</span>
                  <strong>{bookingData.busDetails.busType} - {bookingData.busDetails.busNumber}</strong>
                </div>
                
                <div className="detail-item">
                  <span className="label">Passenger Name:</span>
                  <span>{bookingData.passengerDetails.name}</span>
                </div>
                
                <div className="detail-item">
                  <span className="label">Journey Date:</span>
                  <span>{new Date(bookingData.journeyDate).toLocaleDateString()}</span>
                </div>
                
                <div className="detail-item">
                  <span className="label">Route:</span>
                  <span>{bookingData.passengerDetails.pickupPoint} → {bookingData.passengerDetails.dropPoint}</span>
                </div>
                
                <div className="detail-item">
                  <span className="label">Seats:</span>
                  <span>{bookingData.selectedSeats.join(', ')}</span>
                </div>
                
                <div className="detail-item">
                  <span className="label">Number of Seats:</span>
                  <span>{bookingData.numberOfSeats}</span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="detail-item">
                  <span className="label">Subtotal:</span>
                  <span>Rs. {bookingData.breakdown.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="label">Service Fee:</span>
                  <span>Rs. {bookingData.breakdown.serviceFee.toFixed(2)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="label">Tax:</span>
                  <span>Rs. {bookingData.breakdown.tax.toFixed(2)}</span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="detail-item total">
                  <span className="label">Total Amount:</span>
                  <strong>Rs. {bookingData.breakdown.grandTotal.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="help-card">
              <h4>📞 Need Help?</h4>
              <p>Contact our support team</p>
              <p><strong>Phone:</strong> +977 01-5970000</p>
              <p><strong>Email:</strong> support@ticketnepal.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
