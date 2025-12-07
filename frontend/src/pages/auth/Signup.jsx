import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/signup.css';

const API_URL = 'http://localhost:8000/api/v1';

/**
 * Customer Signup Page Component
 * Handles customer registration with email/password and Google OAuth
 */
const Signup = () => {
  const navigate = useNavigate();
  const { signup: signupUser, loginWithGoogleProvider } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
   * Validate form data
   */
  const validateForm = () => {
    if (!formData.name || formData.name.length < 3) {
      setError('Name must be at least 3 characters');
      return false;
    }
    
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    
    if (formData.phone && !/^9\d{9}$/.test(formData.phone)) {
      setError('Invalid Nepal phone number (Must start with 9 and be 10 digits)');
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
   * Handle customer registration
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Backend API call
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
          role: 'customer'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Registration failed');
      }

      // Success - use AuthContext signup which handles everything
      const result = await signupUser(formData.email, formData.password, formData.name, 'customer');
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }
      
      // Redirect to customer dashboard
      navigate('/customer');

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Handle Google Sign-Up - uses AuthContext
   */
  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      // Use AuthContext's Google login (which also handles signup)
      await loginWithGoogleProvider();
      // Redirect is handled by AuthContext after successful auth
    } catch (err) {
      console.error('Google signup error:', err);
      setError(err.message || 'Google signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page signup-page">
      <div className="auth-container">
        {/* Signup Card */}
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
  
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join Ticket Nepal for seamless bus booking</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form className="auth-form" onSubmit={handleRegister}>
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
                placeholder="Ram Bahadur Thapa"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                autoComplete="name"
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
                autoComplete="email"
                required
              />
            </div>

            {/* Phone Field */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number (Optional)
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
                autoComplete="tel"
                maxLength="10"
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
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

            {/* Sign Up Button */}
            <button 
              type="submit" 
              className="btn btn-primary btn-auth"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Google Sign-Up Button */}
          <button 
            type="button"
            className="btn btn-google"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google"
              className="google-icon"
            />
            <span>Sign up with Google</span>
          </button>

          {/* Vendor Signup Link */}
          <div className="vendor-signup-notice">
            <p>
              Want to register as a bus vendor?
              <Link to="/vendor-signup" className="vendor-link">
                {' '}Register as Vendor
              </Link>
            </p>
          </div>

          {/* Login Link */}
          <div className="auth-switch">
            <p>
              Already have an account?
              <Link to="/login" className="switch-link">
                {' '}Login
              </Link>
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="auth-info">
          <h3>🚌 Why Choose Ticket Nepal?</h3>
          <ul>
            <li>✅ Easy & quick booking</li>
            <li>✅ Wide range of bus operators</li>
            <li>✅ Secure online payments</li>
            <li>✅ Instant confirmation</li>
            <li>✅ 24/7 customer support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Signup;
