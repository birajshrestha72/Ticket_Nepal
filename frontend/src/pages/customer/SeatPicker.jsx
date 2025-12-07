import React, { useState, useEffect } from 'react';
import '../../css/seatPicker.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * SeatPicker Component
 * Interactive bus seat selection UI with realistic bus layout
 * Features:
 * - Driver seat indicator
 * - Left and right seat positioning (2-2 layout)
 * - Central aisle
 * - Real-time seat availability
 * - Visual seat status (Available, Selected, Booked)
 */
const SeatPicker = ({ 
  scheduleId, 
  totalSeats, 
  journeyDate,
  onSeatsChange,
  selectedSeats = [],
  busType = 'Seater'
}) => {
  const [bookedSeats, setBookedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate session ID on mount
  useEffect(() => {
    const existingSession = sessionStorage.getItem('seatLockSession');
    if (existingSession) {
      setSessionId(existingSession);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('seatLockSession', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    if (scheduleId && journeyDate) {
      fetchSeatAvailability();
    }
  }, [scheduleId, journeyDate]);

  const fetchSeatAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/schedules/${scheduleId}/seats?journey_date=${journeyDate}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch seat availability');
      
      const data = await response.json();
      if (data.status === 'success') {
        setBookedSeats(data.data.seatAvailability.bookedSeats || []);
        setLockedSeats(data.data.seatAvailability.lockedSeats || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching seat availability:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const lockSeats = async (seats) => {
    if (!sessionId || seats.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/seat-locks/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduleId: scheduleId,
          journeyDate: journeyDate,
          seatNumbers: seats,
          sessionId: sessionId
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        await fetchSeatAvailability();
      }
    } catch (err) {
      console.error('Error locking seats:', err);
    }
  };

  const unlockSeats = async (seats) => {
    if (!sessionId || seats.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/seat-locks/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduleId: scheduleId,
          journeyDate: journeyDate,
          seatNumbers: seats,
          sessionId: sessionId
        })
      });
    } catch (err) {
      console.error('Error unlocking seats:', err);
    }
  };

  const handleSeatClick = async (seatNumber) => {
    // Can't select already booked seats
    if (bookedSeats.includes(seatNumber)) return;
    
    // Can't select seats locked by others
    if (lockedSeats.includes(seatNumber) && !selectedSeats.includes(seatNumber)) {
      alert('This seat is temporarily locked by another user. Please select a different seat.');
      return;
    }
    
    let newSelectedSeats;
    if (selectedSeats.includes(seatNumber)) {
      // Deselect seat - unlock it
      newSelectedSeats = selectedSeats.filter(s => s !== seatNumber);
      await unlockSeats([seatNumber]);
    } else {
      // Select seat - lock it
      newSelectedSeats = [...selectedSeats, seatNumber];
      await lockSeats([seatNumber]);
    }
    
    onSeatsChange(newSelectedSeats);
  };

  const getSeatStatus = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return 'booked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    if (lockedSeats.includes(seatNumber)) return 'locked';
    return 'available';
  };

  // Generate realistic bus seat layout
  // Standard bus: 2-2 seating (Left 2 seats - Aisle - Right 2 seats)
  // Rows: A-J (10 rows = 40 seats for standard bus)
  const generateBusSeats = () => {
    const seatsPerRow = 4; // 2 left + 2 right
    const totalRows = Math.ceil((totalSeats || 40) / seatsPerRow);
    const rows = [];

    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const rowLabel = String.fromCharCode(65 + rowIndex); // A, B, C, ...
      const rowSeats = [];

      // Left side seats (2 seats)
      for (let leftSeat = 1; leftSeat <= 2; leftSeat++) {
        const seatNumber = `${rowLabel}${leftSeat}`;
        const seatIndex = rowIndex * seatsPerRow + leftSeat;
        
        if (seatIndex <= totalSeats) {
          rowSeats.push({
            number: seatNumber,
            position: 'left',
            status: getSeatStatus(seatNumber)
          });
        }
      }

      // Aisle
      rowSeats.push({ position: 'aisle' });

      // Right side seats (2 seats)
      for (let rightSeat = 3; rightSeat <= 4; rightSeat++) {
        const seatNumber = `${rowLabel}${rightSeat}`;
        const seatIndex = rowIndex * seatsPerRow + rightSeat;
        
        if (seatIndex <= totalSeats) {
          rowSeats.push({
            number: seatNumber,
            position: 'right',
            status: getSeatStatus(seatNumber)
          });
        }
      }

      rows.push({ label: rowLabel, seats: rowSeats });
    }

    return rows;
  };

  if (loading) {
    return (
      <div className="seat-picker-loading">
        <div className="spinner"></div>
        <p>Loading seat availability...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seat-picker-error">
        <p>Error loading seats: {error}</p>
        <button onClick={fetchSeatAvailability} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  const seatLayout = generateBusSeats();

  return (
    <div className="seat-picker">
      <div className="seat-picker-header">
        <h3>Select Your Seats</h3>
        <p className="seat-picker-subtitle">
          Choose from {totalSeats - bookedSeats.length} available seats
        </p>
      </div>

      {/* Seat Legend */}
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
          <div className="seat-sample locked"></div>
          <span>Locked</span>
        </div>
        <div className="legend-item">
          <div className="seat-sample booked"></div>
          <span>Booked</span>
        </div>
      </div>

      {/* Bus Layout Container */}
      <div className="bus-container">
        {/* Driver Section */}
        <div className="driver-section">
          <div className="driver-seat">
            <span className="driver-icon">🚗</span>
            <span className="driver-label">Driver</span>
          </div>
          <div className="windshield"></div>
        </div>

        {/* Passenger Seats */}
        <div className="seats-area">
          {seatLayout.map((row, rowIndex) => (
            <div key={row.label} className="seat-row">
              <span className="row-label">{row.label}</span>
              
              <div className="row-seats">
                {row.seats.map((seat, seatIndex) => {
                  if (seat.position === 'aisle') {
                    return <div key={`aisle-${rowIndex}`} className="aisle"></div>;
                  }

                  return (
                    <button
                      key={seat.number}
                      type="button"
                      className={`seat-btn ${seat.status} ${seat.position}`}
                      onClick={() => handleSeatClick(seat.number)}
                      disabled={seat.status === 'booked'}
                      title={`Seat ${seat.number} - ${seat.status}`}
                    >
                      <span className="seat-number">{seat.number}</span>
                      {seat.status === 'booked' && <span className="seat-lock">🔒</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bus Exit Door Indicator */}
        <div className="bus-exit">
          <span>🚪 Exit</span>
        </div>
      </div>

      {/* Selected Seats Summary */}
      <div className="selected-seats-summary">
        <div className="summary-header">
          <strong>Selected Seats ({selectedSeats.length}):</strong>
        </div>
        <div className="seats-list">
          {selectedSeats.length > 0 ? (
            selectedSeats.sort().map((seat, index) => (
              <span key={seat} className="seat-tag">
                {seat}
                <button
                  type="button"
                  className="seat-remove"
                  onClick={() => handleSeatClick(seat)}
                  title="Remove seat"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="no-seats-selected">No seats selected</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatPicker;
