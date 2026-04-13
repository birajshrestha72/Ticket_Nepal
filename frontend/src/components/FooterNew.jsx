import { Link } from 'react-router-dom'
import logoImage from '../assets/logo.png'
import '../css/footer.css'

const FooterNew = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section footer-brand">
          <Link to="/" className="footer-logo">
            <img
              src={logoImage}
              alt="Ticket Nepal Logo"
              className="footer-logo-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <span className="footer-logo-text">Ticket Nepal</span>
          </Link>
          <p className="footer-description">
            Easy online bus ticket booking platform for Nepal. Safe, fast, and reliable service.
          </p>
          <p className="footer-tagline">Your trusted travel partner across Nepal</p>
        </div>

        <div className="footer-section footer-sitemap">
          <h3 className="footer-title">Sitemap</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/search">Search Buses</Link></li>
            <li><Link to="/vendors">Bus Operators</Link></li>
            <li><Link to="/destinations">Destinations</Link></li>
            <li><Link to="/bookings">My Bookings</Link></li>
            <li><Link to="/profile">My Profile</Link></li>
          </ul>
        </div>

        <div className="footer-section footer-details">
          <h3 className="footer-title">Website Details</h3>
          <ul className="footer-links">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/terms">Terms and Conditions</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/refund-policy">Refund Policy</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>

        <div className="footer-section footer-social">
          <h3 className="footer-title">Social Media</h3>
          <p className="social-subtitle">Connect with us:</p>
          <div className="social-links">
            <a
              href="https://facebook.com/ticketnepal"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link facebook"
              aria-label="Facebook"
            >
              <span className="social-text">Facebook</span>
            </a>
            <a
              href="https://instagram.com/ticketnepal"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link instagram"
              aria-label="Instagram"
            >
              <span className="social-text">Instagram</span>
            </a>
          </div>
          <div className="payment-methods">
            <h4 className="payment-title">Payment Partners</h4>
            <div className="payment-icons">
              <span className="payment-badge">eSewa</span>
              <span className="payment-badge">Khalti</span>
            </div>
          </div>
        </div>

        <div className="footer-section footer-contact">
          <h3 className="footer-title">Contact Us</h3>
          <ul className="contact-list">
            <li className="contact-item">
              <div className="contact-info">
                <strong>Phone:</strong>
                <a href="tel:+9779801234567">+977 980-1234567</a>
                <a href="tel:+97714567890">+977 1-4567890</a>
              </div>
            </li>
            <li className="contact-item">
              <div className="contact-info">
                <strong>Email:</strong>
                <a href="mailto:info@ticketnepal.com">info@ticketnepal.com</a>
                <a href="mailto:support@ticketnepal.com">support@ticketnepal.com</a>
              </div>
            </li>
            <li className="contact-item">
              <div className="contact-info">
                <strong>Address:</strong>
                <span>Kathmandu, Nepal</span>
                <span>New Road, Ward 32</span>
              </div>
            </li>
            <li className="contact-item">
              <div className="contact-info">
                <strong>Support Hours:</strong>
                <span>24/7 Customer Service</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="copyright">{`Copyright ${currentYear} Ticket Nepal. All rights reserved.`}</p>
          <div className="footer-bottom-links">
            <Link to="/terms">Terms</Link>
            <span className="separator">|</span>
            <Link to="/privacy">Privacy</Link>
            <span className="separator">|</span>
            <Link to="/cookies">Cookies</Link>
            <span className="separator">|</span>
            <Link to="/sitemap">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterNew
