import React, { useState, useEffect } from 'react';
import '../../css/vendorManagement.css';

const VendorForm = ({ onSave, initial = null }) => {
  const [vendor, setVendor] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    if (initial) setVendor(initial);
  }, [initial]);

  const handleChange = (e) => setVendor({ ...vendor, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave(vendor);
  };

  return (
    <form onSubmit={submit} className="admin-form">
      <label>Name:<br />
        <input name="name" value={vendor.name} onChange={handleChange} required />
      </label>
      <label>Phone:<br />
        <input name="phone" value={vendor.phone} onChange={handleChange} />
      </label>
      <label>Email:<br />
        <input name="email" value={vendor.email} onChange={handleChange} />
      </label>
      <button type="submit">Save Vendor</button>
    </form>
  );
};

export default VendorForm;
