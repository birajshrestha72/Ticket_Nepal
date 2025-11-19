import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../css/booking.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Booking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const busId = searchParams.get('busId');
  const scheduleId = searchParams.get('scheduleId');
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busDetails, setBusDetails] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    pickupPoint: '',
    dropPoint: '',
    specialRequests: ''
  });

  useEffect(() => {
    if (busId) {
      fetchBusDetails();
    } else {
      setError('No bus selected');
      setLoading(false);
    }
  }, [busId]);

  const fetchBusDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/buses/${busId}`);
      if (!response.ok) throw new Error('Failed to fetch bus details');
      
      const data = await response.json();
      if (data.status === 'success') {
        setBusDetails(data.data.bus);
        // Mock booked seats for demo
        setBookedSeats(['A1', 'A2', 'B5', 'C3']);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSeatClick = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return;
    
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleInputChange = (e) => {
    setPassengerDetails({
      ...passengerDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    
    if (!passengerDetails.name || !passengerDetails.phone || !passengerDetails.email) {
      alert('Please fill in all required passenger details');
      return;
    }
    
    // Prepare booking data to pass to BookingBill
    const bookingData = {
      busDetails: {
        id: busId,
        busType: busDetails.busType,
        busNumber: busDetails.busNumber,
        vendor: busDetails.vendor,
        from: busDetails.from,
        to: busDetails.to,
        departureTime: busDetails.departureTime,
        fare: busDetails.fare
      },
      scheduleId: Number.parseInt(scheduleId || busDetails?.schedules?.[0]?.id || 1, 10),
      journeyDate: journeyDate,
      selectedSeats: selectedSeats,
      numberOfSeats: selectedSeats.length,
      passengerDetails: {
        name: passengerDetails.name,
        phone: passengerDetails.phone,
        email: passengerDetails.email,
        pickupPoint: passengerDetails.pickupPoint || busDetails?.from,
        dropPoint: passengerDetails.dropPoint || busDetails?.to,
        specialRequests: passengerDetails.specialRequests
      },
      farePerSeat: busDetails.fare,
      totalAmount: selectedSeats.length * busDetails.fare
    };
    
    // Navigate to BookingBill for review and breakdown
    navigate('/booking-bill', { state: bookingData });
  };

  // Generate seat layout (A-J rows, 1-4 columns)
  const generateSeatLayout = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = [1, 2, 3, 4];
    const totalSeats = busDetails?.seats || 40;
    
    return rows.slice(0, Math.ceil(totalSeats / 4)).map((row, rowIndex) => (
      <div className="seat-row" key={row}>
        <span className="row-label">{row}</span>
        {cols.map(col => {
          const seatNum = `${row}${col}`;
          const seatIndex = rowIndex * 4 + col;
          if (seatIndex > totalSeats) return null;
          
          const isBooked = bookedSeats.includes(seatNum);
          const isSelected = selectedSeats.includes(seatNum);
          
          let seatClass = 'available';
          if (isBooked) seatClass = 'booked';
          else if (isSelected) seatClass = 'selected';
          
          return (
            <button
              key={seatNum}
              type="button"
              className={`seat-btn ${seatClass}`}
              onClick={() => handleSeatClick(seatNum)}
              disabled={isBooked}
            >
              {seatNum}
            </button>
          );
        })}
        {rowIndex === 2 && <div className="aisle"></div>}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="booking-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading bus details...</p>
        </div>
      </div>
    );
  }

  if (error || !busDetails) {
    return (
      <div className="booking-page">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error || 'Bus not found'}</p>
          <button onClick={() => navigate('/search')} className="btn-primary">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = selectedSeats.length * (busDetails.fare || 0);

  return (
    <div className="booking-page">
      <div className="booking-container">
        <h1 className="booking-title">Complete Your Booking</h1>
        
        {/* Bus Info Card */}
        <div className="bus-info-card">
          <div className="bus-info-header">
            <h2>{busDetails.busType} - {busDetails.busNumber}</h2>
            <span className="vendor-name">{busDetails.vendor}</span>
          </div>
          <div className="bus-info-body">
            <div className="info-item">
              <span className="label">Route:</span>
              <span className="value">{busDetails.from} → {busDetails.to}</span>
            </div>
            <div className="info-item">
              <span className="label">Departure:</span>
              <span className="value">{busDetails.departureTime}</span>
            </div>
            <div className="info-item">
              <span className="label">Fare:</span>
              <span className="value">Rs. {busDetails.fare} per seat</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="booking-layout">
            {/* Left: Seat Selection */}
            <div className="seat-selection-section">
              <h3 className="section-title">Select Your Seats</h3>
              
              <div className="seat-legend">
                <div className="legend-item">
                  <div className="seat-sample available"></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="seat-sample selected"></div>
                  <span>Selected</span>
                </div>
                <div className="legend-item">
                  <div className="seat-sample booked"></div>
                  <span>Booked</span>
                </div>
              </div>

              <div className="bus-layout">
                <div className="driver-section">
                  <span className="driver-icon">🚗</span>
                  <span>Driver</span>
                </div>
                <div className="seats-grid">
                  {generateSeatLayout()}
                </div>
              </div>
              
              <div className="selected-seats-info">
                <strong>Selected Seats:</strong> 
                <span className="seats-list">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                </span>
              </div>
            </div>

            {/* Right: Passenger Details & Summary */}
            <div className="passenger-details-section">
              <div className="details-card">
                <h3 className="section-title">Passenger Details</h3>
                
                <div className="form-group">
                  <label htmlFor="journeyDate">Journey Date *</label>
                  <input
                    type="date"
                    id="journeyDate"
                    value={journeyDate}
                    onChange={(e) => setJourneyDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={passengerDetails.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
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
                    placeholder="E.g., Kalanki"
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
                    placeholder="E.g., Lakeside"
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
                <div className="summary-item">
                  <span>Selected Seats:</span>
                  <strong>{selectedSeats.length}</strong>
                </div>
                <div className="summary-item">
                  <span>Fare per seat:</span>
                  <strong>Rs. {busDetails.fare}</strong>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item total">
                  <span>Total Amount:</span>
                  <strong>Rs. {totalAmount}</strong>
                </div>
                
                <button 
                  type="submit" 
                  className="btn-proceed"
                  disabled={selectedSeats.length === 0}
                >
                  Review Booking →
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