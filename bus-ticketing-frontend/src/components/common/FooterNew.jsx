import React from 'react';
import { Link } from 'react-router-dom';
import '../../css/footer.css';

const FooterNew = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      {/* ===== MAIN FOOTER CONTENT ===== */}
      <div className="footer-content">
        {/* ===== SECTION 1: LOGO & ABOUT ===== */}
        {/* Company logo ra brief description */}
        <div className="footer-section footer-brand">
          <Link to="/" className="footer-logo">
            <img 
              src="/images/logos/logo.png" 
              alt="Ticket Nepal Logo" 
              className="footer-logo-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="footer-logo-text">Ticket Nepal</span>
          </Link>
          <p className="footer-description">
            Nepal ko sabai bhanda suvidhaajanak online bus ticket booking platform.
            Safe, fast, ra bharosemand sewa.
          </p>
          <p className="footer-tagline">
            Your trusted travel partner across Nepal
          </p>
        </div>

        {/* ===== SECTION 2: SITEMAP ===== */}
        {/* Quick navigation links - Site ko main pages */}
        <div className="footer-section footer-sitemap">
          <h3 className="footer-title">Sitemap (Quick Links)</h3>
          <ul className="footer-links">
            <li><Link to="/">Home (Ghar)</Link></li>
            <li><Link to="/search">Search Buses (Bus Khojnuhos)</Link></li>
            <li><Link to="/vendors">Bus Operators (Vendors)</Link></li>
            <li><Link to="/destinations">Destinations (Gatavyaharu)</Link></li>
            <li><Link to="/bookings">My Bookings (Mero Bookings)</Link></li>
            <li><Link to="/profile">My Profile (Profile)</Link></li>
          </ul>
        </div>

        {/* ===== SECTION 3: WEBSITE DETAILS ===== */}
        {/* Company information ra policies */}
        <div className="footer-section footer-details">
          <h3 className="footer-title">Website Details (Jaankari)</h3>
          <ul className="footer-links">
            <li><Link to="/about">About Us (Hamro Baare)</Link></li>
            <li><Link to="/how-it-works">How It Works (Kasto Kaam Garcha)</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/refund-policy">Refund Policy</Link></li>
            <li><Link to="/faq">FAQ (Prasnaharu)</Link></li>
          </ul>
        </div>

        {/* ===== SECTION 4: SOCIAL MEDIA ===== */}
        {/* Social media links - Facebook, Instagram, etc */}
        <div className="footer-section footer-social">
          <h3 className="footer-title">Social Media (Samajik Madhyam)</h3>
          <p className="social-subtitle">Connect with us / Hamro sanga jodinu:</p>
          <div className="social-links">
            <a 
              href="https://facebook.com/ticketnepal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link facebook"
              aria-label="Facebook"
            >
              <span className="social-icon"></span>
              <span className="social-text">Facebook</span>
            </a>
            <a 
              href="https://instagram.com/ticketnepal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link instagram"
              aria-label="Instagram"
            >
              <span className="social-icon"></span>
              <span className="social-text">Instagram</span>
            </a>
            
          </div>
          <div className="payment-methods">
            <h4 className="payment-title">Payment Partners:</h4>
            <div className="payment-icons">
              <span className="payment-badge">eSewa</span>
              <span className="payment-badge">Khalti</span>
              <span className="payment-badge">Bank Transfer</span>
            </div>
          </div>
        </div>

        {/* ===== SECTION 5: CONTACT DETAILS ===== */}
        {/* Contact information - Phone, email, address */}
        <div className="footer-section footer-contact">
          <h3 className="footer-title">Contact Us (Sampark)</h3>
          <ul className="contact-list">
            <li className="contact-item">
              <span className="contact-icon">📞</span>
              <div className="contact-info">
                <strong>Phone (Phone):</strong>
                <a href="tel:+9779801234567">+977 980-1234567</a>
                <a href="tel:+97714567890">+977 1-4567890</a>
              </div>
            </li>
            <li className="contact-item">
              <span className="contact-icon"></span>
              <div className="contact-info">
                <strong>Email:</strong>
                <a href="mailto:info@ticketnepal.com">info@ticketnepal.com</a>
                <a href="mailto:support@ticketnepal.com">support@ticketnepal.com</a>
              </div>
            </li>
            <li className="contact-item">
              <span className="contact-icon"></span>
              <div className="contact-info">
                <strong>Address (Thegana):</strong>
                <span>Kathmandu, Nepal</span>
                <span>New Road, Ward 32</span>
              </div>
            </li>
            <li className="contact-item">
              <span className="contact-icon"></span>
              <div className="contact-info">
                <strong>Support Hours:</strong>
                <span>24/7 Customer Service</span>
                <span>सधैं तपाईंको सेवामा</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* ===== FOOTER BOTTOM - COPYRIGHT ===== */}
      {/* Copyright notice ra legal links */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="copyright">
            © {currentYear} Ticket Nepal. All rights reserved. | सर्वाधिकार सुरक्षित
          </p>
          <div className="footer-bottom-links">
            <Link to="/terms">Terms</Link>
            <span className="separator">•</span>
            <Link to="/privacy">Privacy</Link>
            <span className="separator">•</span>
            <Link to="/cookies">Cookies</Link>
            <span className="separator">•</span>
            <Link to="/sitemap">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterNew;
