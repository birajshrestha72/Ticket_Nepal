import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import '../../css/signup.css';

/**
 * Signup Page Component - Naya user registration page
 * Email/Password signup ra Google OAuth
 * Firebase authentication use garcha
 */
const Signup = () => {
  const navigate = useNavigate();
  const { loginAs } = useAuth(); // Mock auth (backend ready bhaye pachi hataucha)
  
  // Form state - User details store garcha
  const [formData, setFormData] = useState({
    fullName: '',
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  /**
   * Input field change handler
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  /**
   * Form validation - Submit agadi check garcha
   */
  const validateForm = () => {
    // Empty fields check
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Sabai field halnuhos (Please fill all fields)');
      return false;
    }

    // Name length check
    if (formData.fullName.length < 3) {
      setError('Pura naam kam se kam 3 akshara hunu parne (Name must be at least 3 characters)');
      return false;
    }

    // Email format check (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Valid email halnuhos (Please enter a valid email)');
      return false;
    }

    // Phone validation (optional but if filled, must be valid)
    if (formData.phone && formData.phone.length < 10) {
      setError('Valid phone number halnuhos (Please enter a valid phone number)');
      return false;
    }

    // Password strength check
    if (formData.password.length < 6) {
      setError('Password kam se kam 6 character hunu parne (Password must be at least 6 characters)');
      return false;
    }

    // Password match check
    if (formData.password !== formData.confirmPassword) {
      setError('Password match bhayena (Passwords do not match)');
      return false;
    }

    // Terms acceptance check
    if (!acceptedTerms) {
      setError('Terms ra conditions swikar garnuhos (Please accept terms and conditions)');
      return false;
    }

    return true;
  };

  /**
   * Email/Password signup handler
   * Firebase ma naya user create garcha
   */
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Firebase create user with email/password
      // Backend ready bhaye pachi uncomment garnuhos:
      // const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      // const user = userCredential.user;
      
      // Backend API call - User details save garcha database ma
      // const response = await fetch('/api/users/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: formData.fullName,
      //     email: formData.email,
      //     phone: formData.phone,
      //     password: formData.password,
      //     role: 'customer'
      //   })
      // });

      // Temporary mock signup
      console.log('Signup attempt:', formData);
      
      setTimeout(() => {
        loginAs('user'); // Mock auth
        navigate('/'); // Homepage ma redirect
      }, 1000);

    } catch (err) {
      console.error('Signup error:', err);
      
      // Firebase error handling
      if (err.code === 'auth/email-already-in-use') {
        setError('Yo email pahile nai register cha (Email already registered)');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else if (err.code === 'auth/weak-password') {
        setError('Password dherai kamzor cha (Password too weak)');
      } else {
        setError('Signup garna sakenah. Pheri koshish garnuhos (Signup failed. Try again)');
      }
      setLoading(false);
    }
  };

  /**
   * Google Sign-Up handler
   * Google OAuth use garera signup garcha
   */
  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      // Firebase Google sign in
      // Backend ready bhaye pachi uncomment:
      // const result = await signInWithPopup(auth, googleProvider);
      // const user = result.user;
      
      console.log('Google signup clicked');
      alert('Google Sign-Up - Firebase configuration purai garnuhos');
      setLoading(false);

    } catch (err) {
      console.error('Google signup error:', err);
      setError('Google signup sakenah (Google signup failed)');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page signup-page">
      <div className="auth-container">
        {/* ===== SIGNUP CARD ===== */}
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">🎫</div>
            <h1 className="auth-title">Sign Up (Darta Garnuhos)</h1>
            <p className="auth-subtitle">Create your Ticket Nepal account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ===== SIGNUP FORM ===== */}
          <form className="auth-form" onSubmit={handleEmailSignup}>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Pura Naam (Full Name) *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="form-input"
                placeholder="Ram Bahadur Thapa"
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address *
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

            {/* Phone (Optional) */}
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
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password (Gupyashabad) *
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
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="form-hint">Kam se kam 6 characters (At least 6 characters)</small>
            </div>

            {/* Confirm Password */}
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
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="terms">
                I accept the{' '}
                <Link to="/terms" target="_blank">Terms & Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit button */}
            <button 
              type="submit" 
              className="btn btn-primary btn-auth"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up (Darta Garnuhos)'}
            </button>
          </form>

          {/* ===== DIVIDER ===== */}
          <div className="auth-divider">
            <span>OR (Athawa)</span>
          </div>

          {/* ===== GOOGLE SIGN-UP BUTTON ===== */}
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

          {/* ===== LOGIN LINK ===== */}
          <div className="auth-switch">
            <p>
              Pahile nai account cha? (Already have an account?)
              <Link to="/login" className="switch-link">
                {' '}Login garnuhos (Login)
              </Link>
            </p>
          </div>
        </div>

        {/* ===== INFO SECTION ===== */}
        <div className="auth-info">
          <h3>🎯 Kina Ticket Nepal?</h3>
          <ul>
            <li>✅ Free account registration</li>
            <li>✅ Booking history tracking</li>
            <li>✅ Special offers ra discounts</li>
            <li>✅ Easy cancellation process</li>
            <li>✅ Verified bus operators</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Signup;
