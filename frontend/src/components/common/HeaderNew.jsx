import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/header.css';

const HeaderNew = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu toggle state

  // Mobile menu toggle handler - Hamburger icon click garda
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="site-header">
      <div className="header-container">
        {/* ===== LEFT SIDE KO LOGO ===== */}
        {/* Logo - Always visible, left aligned */}
        <Link to="/" className="header-logo">
          <img 
            src="/images/logos/logo.png" 
            alt="Ticket Nepal Logo" 
            className="logo-image"
            onError={(e) => {
              // Fallback - if image load nahuna bhane text dekhaucha
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className="logo-text">Ticket Nepal</span>
        </Link>

        {/* Mobile ma hamburger icon dekhaucha */}
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Navigation links - Desktop ma right aligned, mobile ma dropdown */}
        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/vendors" className="nav-link">Vendors</Link>
          <Link to="/bus-details" className="nav-link">Bus Details</Link>
          <Link to="/destinations" className="nav-link">Destinations</Link>

          {/* User profile section - Login status depending */}
          <div className="nav-profile">
            {user ? (
              // Logged in user - Profile dropdown
              <>
                <Link 
                  to={
                    user.role === 'customer' ? '/customer' :
                    user.role === 'vendor' ? '/vendor' :
                    user.role === 'system_admin' ? '/superadmin' :
                    '/customer'
                  } 
                  className="profile-link" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="profile-icon">👤</span>
                  <span className="profile-name">{user.name || user.role}</span>
                </Link>
                <button onClick={logout} className="logout-btn">
                  Logout
                </button>
              </>
            ) : (
              // Not logged in - Login button
              <Link to="/login" className="login-btn" onClick={() => setMobileMenuOpen(false)}>
                <span className="profile-icon">👤</span>
                <span>Login</span>
              </Link>
            )}
          </div>
    
        </nav>
      </div>
    </header>
  );
};

export default HeaderNew;
