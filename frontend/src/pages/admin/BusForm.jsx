import React, { useState, useEffect } from 'react';
import '../../css/busManagement.css';

const BusForm = ({ onSave, initial = null }) => {
  const [bus, setBus] = useState({ busNo: '', vendor: '', type: '', seats: 40 });

  useEffect(() => {
    if (initial) setBus(initial);
  }, [initial]);

  const handleChange = (e) => setBus({ ...bus, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave(bus);
  };

  return (
    <form onSubmit={submit} className="admin-form">
      <label>Bus No:<br />
        <input name="busNo" value={bus.busNo} onChange={handleChange} required />
      </label>
      <label>Vendor:<br />
        <input name="vendor" value={bus.vendor} onChange={handleChange} required />
      </label>
      <label>Type:<br />
        <input name="type" value={bus.type} onChange={handleChange} />
      </label>
      <label>Seats:<br />
        <input name="seats" type="number" value={bus.seats} onChange={handleChange} min={1} />
      </label>
      <button type="submit">Save Bus</button>
    </form>
  );
};

export default BusForm;
