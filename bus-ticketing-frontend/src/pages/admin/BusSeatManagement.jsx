import React, { useState } from 'react';
import '../../css/busSeatManagement.css';

const TOTAL_SEATS = 40;

const BusSeatManagement = () => {
  const [seats, setSeats] = useState(Array.from({ length: TOTAL_SEATS }, (_, i) => ({
    number: i + 1,
    status: 'available' // 'available' | 'booked'
  })));

  const toggleSeat = (num) => {
    setSeats(seats.map(s => s.number === num ? { ...s, status: s.status === 'available' ? 'booked' : 'available' } : s));
  };

  const addSeat = () => {
    const next = seats.length + 1;
    setSeats([...seats, { number: next, status: 'available' }]);
  };

  const removeSeat = () => {
    setSeats(seats.slice(0, -1));
  };

  return (
    <div className="bus-seat-management">
      <h2>Bus & Seat Management</h2>
      <div className="seat-controls">
        <button onClick={addSeat}>Add Seat</button>
        <button onClick={removeSeat} disabled={seats.length === 0}>Remove Last Seat</button>
      </div>
      <div className="seats-grid">
        {seats.map(s => (
          <button key={s.number} className={`seat ${s.status}`} onClick={() => toggleSeat(s.number)}>
            {s.number}
          </button>
        ))}
      </div>
      <div className="legend"><span className="seat available">Available</span> <span className="seat booked">Booked</span></div>
    </div>
  );
};

export default BusSeatManagement;
