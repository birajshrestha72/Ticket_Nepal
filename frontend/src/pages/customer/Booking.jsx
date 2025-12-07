import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SeatPicker from './SeatPicker';
import '../../css/booking.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Booking Component - Simplified to handle seat selection only
 * Receives selected bus/schedule from Search page
 * Uses SeatPicker component for interactive seat selection
 * Collects passenger details and proceeds to payment
 */
const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get selected schedule from navigation state
  const selectedSchedule = location.state?.selectedSchedule;
  const searchCriteria = location.state?.searchCriteria || {};
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [journeyDate, setJourneyDate] = useState(
    searchCriteria.date || new Date().toISOString().split('T')[0]
  );
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    pickupPoint: '',
    dropPoint: '',
    specialRequests: ''
  });

  // Redirect if no schedule selected
  useEffect(() => {
    if (!selectedSchedule) {
      navigate('/search');
    }
  }, [selectedSchedule, navigate]);

  const handleInputChange = (e) => {
    setPassengerDetails({
      ...passengerDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setJourneyDate(newDate);
    setSelectedSeats([]); // Clear selected seats when date changes
  };

  const handleSeatsChange = (seats) => {
    setSelectedSeats(seats);
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    
    if (!passengerDetails.name || !passengerDetails.phone || !passengerDetails.email) {
      alert('Please fill in all required passenger details');
      return;
    }
    
    // Prepare booking data for payment
    const bookingData = {
      schedule: selectedSchedule,
      journeyDate: journeyDate,
      selectedSeats: selectedSeats,
      numberOfSeats: selectedSeats.length,
      passengerDetails: passengerDetails,
      busDetails: {
        busNumber: selectedSchedule.bus.bus_number,
        busType: selectedSchedule.bus.bus_type,
        vendorName: selectedSchedule.vendor.name,
        vendorId: selectedSchedule.vendor.vendor_id,
        origin: selectedSchedule.route.origin,
        destination: selectedSchedule.route.destination,
        departureTime: selectedSchedule.departure_time,
        arrivalTime: selectedSchedule.arrival_time
      },
      pricing: {
        farePerSeat: selectedSchedule.price,
        numberOfSeats: selectedSeats.length,
        subtotal: selectedSchedule.price * selectedSeats.length,
        serviceFee: (selectedSchedule.price * selectedSeats.length * 0.02).toFixed(2), // 2% service fee
        totalAmount: (selectedSchedule.price * selectedSeats.length * 1.02).toFixed(2)
      }
    };
    
    // Navigate to payment page
    navigate('/payment', { state: bookingData });
  };

  if (!selectedSchedule) {
    return null; // Will redirect to search
  }

  const totalAmount = selectedSeats.length * selectedSchedule.price;

  return (
    <div className="booking-page">
      <div className="booking-container">
        <h1 className="booking-title">Complete Your Booking</h1>
        
        {/* Bus Information Card */}
        <div className="bus-info-card">
          <div className="bus-info-header">
            <div className="bus-main-details">
              <h2 className="bus-reg">{selectedSchedule.bus.bus_number}</h2>
              <span className="bus-type-tag">{selectedSchedule.bus.bus_type}</span>
            </div>
            <div className="vendor-details">
              <span className="vendor-name">{selectedSchedule.vendor.name}</span>
              <span className="vendor-rating">★ {selectedSchedule.vendor.rating.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="bus-info-body">
            <div className="route-info">
              <div className="route-point">
                <span className="route-label">From</span>
                <span className="route-value">{selectedSchedule.route.origin}</span>
                <span className="route-time">{selectedSchedule.departure_time}</span>
              </div>
              <div className="route-arrow">→</div>
              <div className="route-point">
                <span className="route-label">To</span>
                <span className="route-value">{selectedSchedule.route.destination}</span>
                <span className="route-time">{selectedSchedule.arrival_time}</span>
              </div>
            </div>
            
            <div className="fare-info">
              <span className="fare-label">Fare per seat:</span>
              <span className="fare-value">Rs. {selectedSchedule.price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleProceedToPayment} className="booking-form">
          <div className="booking-layout">
            {/* Left: Seat Selection */}
            <div className="seat-selection-section">
              <div className="journey-date-selector">
                <label htmlFor="journeyDate">Journey Date *</label>
                <input
                  type="date"
                  id="journeyDate"
                  value={journeyDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="date-input"
                />
              </div>

              <SeatPicker
                scheduleId={selectedSchedule.schedule_id}
                totalSeats={selectedSchedule.bus.total_seats}
                journeyDate={journeyDate}
                onSeatsChange={handleSeatsChange}
                selectedSeats={selectedSeats}
                busType={selectedSchedule.bus.bus_type}
              />
            </div>

            {/* Right: Passenger Details & Summary */}
            <div className="passenger-section">
              <div className="passenger-form-card">
                <h3 className="section-title">Passenger Details</h3>
                
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={passengerDetails.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={passengerDetails.phone}
                    onChange={handleInputChange}
                    placeholder="9851234567"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={passengerDetails.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pickupPoint">Pickup Point</label>
                  <input
                    type="text"
                    id="pickupPoint"
                    name="pickupPoint"
                    value={passengerDetails.pickupPoint}
                    onChange={handleInputChange}
                    placeholder="E.g., Kalanki Bus Stop"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dropPoint">Drop Point</label>
                  <input
                    type="text"
                    id="dropPoint"
                    name="dropPoint"
                    value={passengerDetails.dropPoint}
                    onChange={handleInputChange}
                    placeholder="E.g., Lakeside Pokhara"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="specialRequests">Special Requests</label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={passengerDetails.specialRequests}
                    onChange={handleInputChange}
                    placeholder="Any special requirements..."
                    rows="3"
                  />
                </div>
              </div>

              {/* Booking Summary */}
              <div className="booking-summary-card">
                <h3 className="section-title">Booking Summary</h3>
                
                <div className="summary-row">
                  <span>Selected Seats:</span>
                  <strong>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</strong>
                </div>
                
                <div className="summary-row">
                  <span>Number of Seats:</span>
                  <strong>{selectedSeats.length}</strong>
                </div>
                
                <div className="summary-row">
                  <span>Fare per Seat:</span>
                  <strong>Rs. {selectedSchedule.price.toLocaleString()}</strong>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <strong>Rs. {totalAmount.toLocaleString()}</strong>
                </div>
                
                <button 
                  type="submit" 
                  className="btn-proceed"
                  disabled={selectedSeats.length === 0}
                >
                  Proceed to Payment →
                </button>

                <button 
                  type="button" 
                  className="btn-back"
                  onClick={() => navigate('/search')}
                >
                  ← Back to Search
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Booking;
