import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/vendorManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const VendorManagement = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    pan_number: '',
    commission_rate: 10,
    is_verified: false,
    is_active: true
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/vendors/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data = await response.json();
      setVendors(data.data?.vendors || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setEditingVendor(null);
    setFormData({
      company_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      pan_number: '',
      commission_rate: 10,
      is_verified: false,
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      company_name: vendor.company_name,
      contact_name: vendor.contact_name,
      contact_email: vendor.contact_email,
      contact_phone: vendor.contact_phone,
      address: vendor.address || '',
      pan_number: vendor.pan_number || '',
      commission_rate: vendor.commission_rate || 10,
      is_verified: vendor.is_verified,
      is_active: vendor.is_active
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVendor(null);
  };

  const validateForm = () => {
    if (!formData.company_name?.trim()) {
      alert('Please enter company name');
      return false;
    }
    if (!formData.contact_name?.trim()) {
      alert('Please enter contact name');
      return false;
    }
    if (!formData.contact_email?.trim()) {
      alert('Please enter contact email');
      return false;
    }
    if (!formData.contact_phone?.trim()) {
      alert('Please enter contact phone');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      const url = editingVendor
        ? `${API_URL}/vendors/${editingVendor.vendor_id}`
        : `${API_URL}/vendors/create`;
      
      const method = editingVendor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save vendor');
      }

      setSuccessMessage(editingVendor ? 'Vendor updated successfully!' : 'Vendor created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      closeModal();
      fetchVendors();
    } catch (err) {
      console.error('Error saving vendor:', err);
      alert(err.message);
    }
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete vendor');
      }

      setSuccessMessage('Vendor deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchVendors();
    } catch (err) {
      console.error('Error deleting vendor:', err);
      alert(err.message);
    }
  };

  const toggleStatus = async (vendor) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vendors/${vendor.vendor_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...vendor,
          is_active: !vendor.is_active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setSuccessMessage(`Vendor ${!vendor.is_active ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchVendors();
    } catch (err) {
      console.error('Error toggling status:', err);
      alert(err.message);
    }
  };

  const toggleVerification = async (vendor) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vendors/${vendor.vendor_id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_verified: !vendor.is_verified
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update verification');
      }

      setSuccessMessage(`Vendor ${!vendor.is_verified ? 'verified' : 'unverified'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchVendors();
    } catch (err) {
      console.error('Error toggling verification:', err);
      alert(err.message);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && vendor.is_active) ||
                         (filterStatus === 'inactive' && !vendor.is_active) ||
                         (filterStatus === 'verified' && vendor.is_verified) ||
                         (filterStatus === 'unverified' && !vendor.is_verified);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page vendorManagement">
      <div className="container">
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">🏢 Vendor Management</h1>
            <p className="page-subtitle">Manage vendor accounts and verification</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={openAddModal}>
              <span>➕</span> Add New Vendor
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="success-banner">
            <span className="success-icon">✓</span>
            <span>{successMessage}</span>
            <button className="close-btn" onClick={() => setSuccessMessage('')}>✕</button>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="close-btn" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="filters-section">
          <div className="filter-group search-group">
            <label>🔍 Search</label>
            <input
              type="text"
              placeholder="Search by company, contact name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Vendors</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>

          <button 
            className="btn-reset-filters"
            onClick={() => {
              setFilterStatus('all');
              setSearchTerm('');
            }}
          >
            🔄 Reset
          </button>
        </div>

        <div className="vendors-container">
          {loading && vendors.length === 0 ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading vendors...</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No vendors found</h3>
              <p>
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first vendor'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button className="btn-primary" onClick={openAddModal}>
                  ➕ Add First Vendor
                </button>
              )}
            </div>
          ) : (
            <div className="vendors-table-wrapper">
              <table className="vendors-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Company</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Commission</th>
                    <th>Verification</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map(vendor => (
                    <tr key={vendor.vendor_id} className={!vendor.is_active ? 'inactive-row' : ''}>
                      <td>#{vendor.vendor_id}</td>
                      <td>
                        <div className="vendor-company">
                          <strong>{vendor.company_name}</strong>
                          {vendor.pan_number && (
                            <small>PAN: {vendor.pan_number}</small>
                          )}
                        </div>
                      </td>
                      <td>{vendor.contact_name}</td>
                      <td>{vendor.contact_email}</td>
                      <td>{vendor.contact_phone}</td>
                      <td className="commission-cell">{vendor.commission_rate || 10}%</td>
                      <td>
                        {vendor.is_verified ? (
                          <span className="status-badge verified">✓ Verified</span>
                        ) : (
                          <span className="status-badge unverified">○ Unverified</span>
                        )}
                      </td>
                      <td>
                        {vendor.is_active ? (
                          <span className="status-badge active">● Active</span>
                        ) : (
                          <span className="status-badge inactive">● Inactive</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => openEditModal(vendor)}
                          title="Edit vendor"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-verify"
                          onClick={() => toggleVerification(vendor)}
                          title={vendor.is_verified ? 'Unverify' : 'Verify'}
                        >
                          {vendor.is_verified ? '✓' : '○'}
                        </button>
                        <button
                          className="btn-icon btn-toggle"
                          onClick={() => toggleStatus(vendor)}
                          title={vendor.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {vendor.is_active ? '🔴' : '🟢'}
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(vendor.vendor_id)}
                          title="Delete vendor"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {vendors.length > 0 && (
          <div className="summary-footer">
            <p>
              Showing <strong>{filteredVendors.length}</strong> of <strong>{vendors.length}</strong> vendor{vendors.length !== 1 ? 's' : ''}
              {' | '}
              Active: <strong>{vendors.filter(v => v.is_active).length}</strong>
              {' | '}
              Verified: <strong>{vendors.filter(v => v.is_verified).length}</strong>
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVendor ? '✏️ Edit Vendor' : '➕ Add New Vendor'}</h2>
              <button className="close-modal" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="vendor-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="e.g., ABC Travels"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    placeholder="e.g., contact@abctravels.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone *</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    placeholder="e.g., 9801234567"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Company address"
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>PAN Number</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456789"
                  />
                </div>

                <div className="form-group">
                  <label>Commission Rate (%)</label>
                  <input
                    type="number"
                    name="commission_rate"
                    value={formData.commission_rate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_verified"
                    checked={formData.is_verified}
                    onChange={handleInputChange}
                  />
                  <span>Verified Vendor</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Active Account</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
