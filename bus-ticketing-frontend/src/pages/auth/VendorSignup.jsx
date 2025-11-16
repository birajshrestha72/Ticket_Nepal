import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/signup.css';

const API_URL = 'http://localhost:8000/api/v1';

/**
 * Vendor Registration Page Component
 * Handles vendor/bus operator registration with company details
 */
const VendorSignup = () => {
  const navigate = useNavigate();
  const { loginAs } = useAuth();
  
  // Form state - Step 1: User Account
  const [formData, setFormData] = useState({
    // User account details
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Vendor/Company details
    companyName: '',
    registrationNumber: '',
    panNumber: '',
    address: '',
    city: '',
    province: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  });
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Multi-step form

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  /**
   * Validate Step 1 (User Account)
   */
  const validateStep1 = () => {
    if (!formData.name || formData.name.length < 3) {
      setError('Name must be at least 3 characters');
      return false;
    }
    
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.phone || !/^9\d{9}$/.test(formData.phone)) {
      setError('Valid Nepal phone number is required (10 digits, starts with 9)');
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  /**
   * Validate Step 2 (Company Details)
   */
  const validateStep2 = () => {
    if (!formData.companyName || formData.companyName.length < 3) {
      setError('Company name is required (minimum 3 characters)');
      return false;
    }
    
    if (!formData.registrationNumber) {
      setError('Company registration number is required');
      return false;
    }
    
    if (!formData.address) {
      setError('Company address is required');
      return false;
    }
    
    if (!formData.city) {
      setError('City is required');
      return false;
    }
    
    if (!formData.province) {
      setError('Province is required');
      return false;
    }
    
    if (!formData.contactPerson) {
      setError('Contact person name is required');
      return false;
    }
    
    if (!formData.contactPhone || !/^9\d{9}$/.test(formData.contactPhone)) {
      setError('Valid contact phone number is required');
      return false;
    }
    
    if (!formData.contactEmail) {
      setError('Contact email is required');
      return false;
    }
    
    return true;
  };

  /**
   * Handle Next Step
   */
  const handleNextStep = (e) => {
    e.preventDefault();
    
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setError('');
    }
  };

  /**
   * Handle Previous Step
   */
  const handlePrevStep = () => {
    setCurrentStep(1);
    setError('');
  };

  /**
   * Handle vendor registration submission
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Register user account with vendor role
      const userResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'vendor'
        })
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userData.detail || userData.message || 'User registration failed');
      }

      const { user, token } = userData.data;

      // Step 2: Register vendor details
      // Note: This endpoint needs to be created in backend
      const vendorResponse = await fetch(`${API_URL}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          company_name: formData.companyName,
          registration_number: formData.registrationNumber,
          pan_number: formData.panNumber || null,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          contact_person: formData.contactPerson,
          contact_phone: formData.contactPhone,
          contact_email: formData.contactEmail
        })
      });

      // If vendor endpoint doesn't exist yet, we'll still proceed with user creation
      if (!vendorResponse.ok && vendorResponse.status !== 404) {
        console.warn('Vendor details endpoint not available yet');
      }

      // Success - Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth context
      loginAs(user.role);
      
      // Redirect to vendor dashboard (role = 'vendor')
      navigate('/vendor');

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const provinces = [
    'Koshi Pradesh',
    'Madhesh Pradesh',
    'Bagmati Pradesh',
    'Gandaki Pradesh',
    'Lumbini Pradesh',
    'Karnali Pradesh',
    'Sudurpashchim Pradesh'
  ];

  return (
    <div className="auth-page vendor-signup-page">
      <div className="auth-container">
        {/* Vendor Signup Card */}
        <div className="auth-card vendor-card">
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">Vendor Registration</h1>
            <p className="auth-subtitle">Register your bus company with Ticket Nepal</p>
          </div>

          {/* Progress Steps */}
          <div className="form-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Account Details</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Company Details</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: User Account */}
          {currentStep === 1 && (
            <form className="auth-form" onSubmit={handleNextStep}>
              <h3 className="form-section-title">Personal Account Information</h3>

              {/* Name Field */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Phone Field */}
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-input"
                  placeholder="9801234567"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength="10"
                  required
                />
                <small className="form-hint">Nepal phone number (10 digits, starts with 9)</small>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <small className="form-hint">Minimum 6 characters</small>
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Next Button */}
              <button 
                type="submit" 
                className="btn btn-primary btn-auth"
                disabled={loading}
              >
                Next: Company Details →
              </button>
            </form>
          )}

          {/* Step 2: Company Details */}
          {currentStep === 2 && (
            <form className="auth-form" onSubmit={handleRegister}>
              <h3 className="form-section-title">Company Information</h3>

              {/* Company Name */}
              <div className="form-group">
                <label htmlFor="companyName" className="form-label">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  className="form-input"
                  placeholder="ABC Travels Pvt. Ltd."
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Registration Number */}
              <div className="form-group">
                <label htmlFor="registrationNumber" className="form-label">
                  Company Registration Number *
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  className="form-input"
                  placeholder="123456/078/079"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* PAN Number */}
              <div className="form-group">
                <label htmlFor="panNumber" className="form-label">
                  PAN Number (Optional)
                </label>
                <input
                  type="text"
                  id="panNumber"
                  name="panNumber"
                  className="form-input"
                  placeholder="123456789"
                  value={formData.panNumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Address */}
              <div className="form-group">
                <label htmlFor="address" className="form-label">
                  Company Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  className="form-input"
                  placeholder="Street address, building name, etc."
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
                  rows="2"
                  required
                />
              </div>

              {/* City and Province */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="form-input"
                    placeholder="Kathmandu"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="province" className="form-label">
                    Province *
                  </label>
                  <select
                    id="province"
                    name="province"
                    className="form-input"
                    value={formData.province}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  >
                    <option value="">Select Province</option>
                    {provinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
              </div>

              <h3 className="form-section-title" style={{ marginTop: '1.5rem' }}>
                Primary Contact Information
              </h3>

              {/* Contact Person */}
              <div className="form-group">
                <label htmlFor="contactPerson" className="form-label">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  className="form-input"
                  placeholder="Manager name"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Contact Phone */}
              <div className="form-group">
                <label htmlFor="contactPhone" className="form-label">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  className="form-input"
                  placeholder="9801234567"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength="10"
                  required
                />
                <small className="form-hint">Company contact number</small>
              </div>

              {/* Contact Email */}
              <div className="form-group">
                <label htmlFor="contactEmail" className="form-label">
                  Contact Email *
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  className="form-input"
                  placeholder="info@yourcompany.com"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-auth"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="auth-switch">
            <p>
              Already have an account?
              <Link to="/login" className="switch-link">
                {' '}Login
              </Link>
            </p>
            <p>
              Want to register as customer?
              <Link to="/signup" className="switch-link">
                {' '}Customer Signup
              </Link>
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="auth-info vendor-info">
          <h3>🚌 Benefits of Partnering with Us</h3>
          <ul>
            <li>✅ Reach thousands of customers</li>
            <li>✅ Easy bus & route management</li>
            <li>✅ Real-time booking updates</li>
            <li>✅ Automated billing system</li>
            <li>✅ Analytics & reporting</li>
            <li>✅ Dedicated vendor support</li>
          </ul>
          
          <div className="info-notice">
            <strong>Note:</strong> Your account will be reviewed by our team. 
            You'll receive verification confirmation within 2-3 business days.
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;