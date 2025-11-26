import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import '../../css/login.css';

const API_URL = 'http://localhost:8000/api/v1';

/**
 * Login Page Component
 * Handles user authentication with email/password and Google OAuth
 */
const Login = () => {
  const navigate = useNavigate();
  const { loginAs } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
   * Handle email/password login
   */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Backend API call
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Login failed');
      }

      // Success - Store token and user data
      const { user, token } = data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth context
      loginAs(user.role);
      
      // Redirect based on role from database: 'customer', 'vendor', 'system_admin'
      if (user.role === 'system_admin') {
        navigate('/superadmin');
      } else if (user.role === 'vendor') {
        navigate('/vendor');
      } else if (user.role === 'customer') {
        navigate('/customer');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Firebase Google sign in
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Send to backend
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken,
          role: 'customer'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Google login failed');
      }

      // Success
      const { user: userData, token } = data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      loginAs(userData.role);
      
      // Redirect based on role
      if (userData.role === 'system_admin') {
        navigate('/superadmin');
      } else if (userData.role === 'vendor') {
        navigate('/vendor');
      } else if (userData.role === 'customer') {
        navigate('/customer');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error('Google login error:', err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled');
      } else if (err.code === 'auth/configuration-not-found') {
        setError('Firebase not configured. Please contact admin.');
      } else {
        setError(err.message || 'Google login failed');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-container">
        {/* Login Card */}
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">Welcome to Ticket Nepal</h1>
            <p className="auth-subtitle">Login to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleEmailLogin}>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
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

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
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
                  autoComplete="current-password"
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
            </div>

            {/* Forgot Password */}
            <div className="form-footer">
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              className="btn btn-primary btn-auth"
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Google Sign-In Button */}
          <button 
            type="button"
            className="btn btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google"
              className="google-icon"
            />
            <span>Sign in with Google</span>
          </button>

          {/* Signup Link */}
          <div className="auth-switch">
            <p>
              Don't have an account?
              <Link to="/signup" className="switch-link">
                {' '}Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="auth-info">
          <h3>🚌 Welcome to Ticket Nepal</h3>
          <ul>
            <li> Instant bus booking</li>
            <li> Secure payments</li>
            <li> 24/7 customer support</li>
            <li> Best fares guaranteed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
