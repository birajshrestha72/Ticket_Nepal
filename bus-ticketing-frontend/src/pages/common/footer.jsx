import '../../css/footer.css'
import logo from '../../assets/logo.png'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-section company">
          <img src={logo} alt="Logo" className="footer-logo" />
          <p>&copy; 2025 Bus Ticket</p>
            <p>All rights reserved.</p>
        </div>

        {/* Column 2: Contact */}
        <div className="footer-section contact">
          <h4>Contact Us</h4>
          <p>📞 +977-981234567</p>
          <p>📧 busticket@mail.com</p>
          <p>🏠 Pokhara, Nepal</p>
        </div>

        {/* Column 3: Sitemap */}
        <div className="footer-section sitemap">
          <h4>Sitemap</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="#">🔝 Back to Top</a></li>
          </ul>
        </div>

        {/* Column 4: Legal & Social */}
        <div className="footer-section legal">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <div>
                <i className="fab fa-facebook fa-2x"></i>
                <i className="fab fa-instagram fa-2x"></i>
                <i className="fab fa-tiktok fa-2x"></i>
            </div>

          </ul>
          <div className="social-icons">
            <a href="https://www.facebook.com/DisneylandPokhara">Facebook</a>
            <a href="https://www.tiktok.com/@pokharadisneyland7">TikTok</a>
            <a href="https://www.instagram.com/pokharadisneypark/">Instagram</a>
          </div>
        </div>
        
      </div>
    </footer>
  )
}

export default Footer