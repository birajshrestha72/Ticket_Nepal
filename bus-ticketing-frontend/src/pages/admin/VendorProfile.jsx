import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/vendorProfile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const VendorProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [vendorProfile, setVendorProfile] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    pan_number: '',
    address: '',
    city: '',
    province: '',
    contact_person: '',
    contact_phone: '',
    contact_email: ''
  });

  const provinces = [
    'Koshi Pradesh',
    'Madhesh Pradesh',
    'Bagmati Pradesh',
    'Gandaki Pradesh',
    'Lumbini Pradesh',
    'Karnali Pradesh',
    'Sudurpashchim Pradesh'
  ];

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/vendors/me`, {
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
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch vendor profile');
      }

      const data = await response.json();
      const vendor = data.data?.vendor;
      
      if (vendor) {
        setVendorProfile(vendor);
        setFormData({
          company_name: vendor.company_name || '',
          registration_number: vendor.registration_number || '',
          pan_number: vendor.pan_number || '',
          address: vendor.address || '',
          city: vendor.city || '',
          province: vendor.province || '',
          contact_person: vendor.contact_person || '',
          contact_phone: vendor.contact_phone || '',
          contact_email: vendor.contact_email || ''
        });
      }
    } catch (err) {
      console.error('Error fetching vendor profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.company_name?.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.contact_person?.trim()) {
      setError('Contact person is required');
      return false;
    }
    if (!formData.contact_phone?.trim()) {
      setError('Contact phone is required');
      return false;
    }
    if (!formData.contact_email?.trim()) {
      setError('Contact email is required');
      return false;
    }
    if (!formData.city?.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.province?.trim()) {
      setError('Province is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/vendors/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const data = await response.json();
      setVendorProfile(data.data?.vendor);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (vendorProfile) {
      setFormData({
        company_name: vendorProfile.company_name || '',
        registration_number: vendorProfile.registration_number || '',
        pan_number: vendorProfile.pan_number || '',
        address: vendorProfile.address || '',
        city: vendorProfile.city || '',
        province: vendorProfile.province || '',
        contact_person: vendorProfile.contact_person || '',
        contact_phone: vendorProfile.contact_phone || '',
        contact_email: vendorProfile.contact_email || ''
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="vendor-profile">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (!vendorProfile && !loading) {
    return (
      <div className="vendor-profile">
        <div className="no-profile-container">
          <div className="no-profile-icon">🏢</div>
          <h2>No Vendor Profile Found</h2>
          <p>Please complete your vendor registration to access this page.</p>
          <button className="btn-primary" onClick={() => navigate('/vendor/register')}>
            Complete Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-profile">
      {/* Header Section */}
      <div className="profile-header">
        <div className="header-left">
          <h1 className="page-title">🏢 Vendor Profile</h1>
          <p className="page-subtitle">Manage your company information and contact details</p>
        </div>
        <div className="header-actions">
          {!isEditing && (
            <button 
              className="btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <span>✏️</span> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Status Banners */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Verification Status Card */}
      <div className={`verification-card ${vendorProfile?.is_verified ? 'verified' : 'pending'}`}>
        <div className="verification-icon">
          {vendorProfile?.is_verified ? '✅' : '⏳'}
        </div>
        <div className="verification-info">
          <h3>{vendorProfile?.is_verified ? 'Verified Vendor' : 'Verification Pending'}</h3>
          <p>
            {vendorProfile?.is_verified 
              ? `Verified on ${new Date(vendorProfile.verification_date).toLocaleDateString()}`
              : 'Your vendor profile is currently under review by our admin team.'
            }
          </p>
        </div>
        {vendorProfile?.is_verified && (
          <div className="rating-badge">
            <span className="star">⭐</span>
            <span className="rating-value">{parseFloat(vendorProfile.average_rating || 0).toFixed(1)}</span>
            <span className="rating-count">({vendorProfile.total_reviews || 0} reviews)</span>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="profile-content">
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Company Information Section */}
          <div className="form-section">
            <h2 className="section-title">Company Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="company_name">
                  Company Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="e.g., ABC Travels Pvt. Ltd."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="registration_number">
                  Registration Number
                </label>
                <input
                  type="text"
                  id="registration_number"
                  name="registration_number"
                  value={formData.registration_number}
                  disabled={true}
                  placeholder="REG-ABC-2023-001"
                  className="read-only"
                  title="Registration number cannot be changed"
                />
                <small className="helper-text">Registration number cannot be changed</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pan_number">PAN Number</label>
                <input
                  type="text"
                  id="pan_number"
                  name="pan_number"
                  value={formData.pan_number}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="123456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="e.g., Kathmandu"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="province">
                  Province <span className="required">*</span>
                </label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="e.g., Kalanki, Ring Road"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="form-section">
            <h2 className="section-title">Contact Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact_person">
                  Contact Person <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="e.g., Ram Bahadur Thapa"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact_phone">
                  Contact Phone <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="9801234567"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="contact_email">
                  Contact Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="contact@company.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {isEditing && (
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* Additional Info Sidebar */}
        <div className="profile-sidebar">
          <div className="info-card">
            <h3>📊 Statistics</h3>
            <div className="stat-item">
              <span className="stat-label">Total Buses</span>
              <span className="stat-value">{vendorProfile?.total_buses || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Routes</span>
              <span className="stat-value">{vendorProfile?.active_routes || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Bookings</span>
              <span className="stat-value">{vendorProfile?.total_bookings || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Member Since</span>
              <span className="stat-value">
                {vendorProfile?.created_at 
                  ? new Date(vendorProfile.created_at).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          <div className="info-card">
            <h3>💡 Tips</h3>
            <ul className="tips-list">
              <li>Keep your contact information up to date</li>
              <li>Respond to customer inquiries promptly</li>
              <li>Maintain accurate bus schedules</li>
              <li>Provide quality service to improve ratings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
