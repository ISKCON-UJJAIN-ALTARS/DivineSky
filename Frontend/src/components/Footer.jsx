import "../styles/Footer.css";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-wrapper">
        
        {/* Left Section: Quick Links */}
        <div className="footer-section footer-left">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li>
              <Link to="/ready-stock" className="footer-link">
                <span className="link-icon">🏛️</span>
                Ready Stock
              </Link>
            </li>
            <li>
              <Link to="/about" className="footer-link">
                <span className="link-icon">📖</span>
                About Us
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="footer-link">
                <span className="link-icon">🖼️</span>
                Gallery
              </Link>
            </li>
         
          </ul>
        </div>

        {/* Vertical Divider */}
        <div className="footer-divider"></div>

        {/* Center Section: Contact Info */}
        <div className="footer-section footer-center">
          <h3 className="footer-heading">Get In Touch</h3>
          <div className="contact-info">
            <a href="mailto:info@divinesky.com" className="contact-item">
              <span className="contact-icon">📧</span>
              <span>info@divinesky.com</span>
            </a>
            <a href="tel:+919876543210" className="contact-item">
              <span className="contact-icon">📱</span>
              <span>+91 98765 43210</span>
            </a>
            <a href="https://wa.me/919630300426" target="_blank" rel="noopener noreferrer" className="contact-item">
              <span className="contact-icon">💬</span>
              <span>WhatsApp Us</span>
            </a>
          </div>

        </div>
       {/* Vertical Divider */}
        <div className="footer-divider"></div>
        {/* Right Section: Inspirations */}
        <div className="footer-section footer-right">
          <h3 className="footer-heading">Our Guiding Inspirations</h3>
          <div className="inspiration-grid">
            <div className="inspiration-card">
              <div className="avatar-wrapper">
                <img 
                  src="../../SP.jpg" 
                  alt="HDG Srila Prabhupada" 
                  className="avatar-image"
                />
              </div>
              <p className="inspiration-name">HDG Srila Prabhupada</p>
            </div>

            <div className="inspiration-card">
              <div className="avatar-wrapper">
                <img 
                  src="../../bcsm.jpeg" 
                  alt="HH Bhakti Charu Swami" 
                  className="avatar-image"
                />
              </div>
              <p className="inspiration-name">HH Bhakti Charu Swami</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="copyright">
            © {currentYear} Divine Sky • Ujjain • Since 2006
          </p>
        </div>
        
        {/* Social Links */}
        <div className="social-links">
          <a href="https://www.youtube.com/@iskconaltars2596" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="YouTube">
            <span>▶️</span>
          </a>
          <a href="https://instagram.com/divinesky" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
            <span>📷</span>
          </a>
          <a href="https://twitter.com/divinesky" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
            <span>🐦</span>
          </a>
        </div>
      </div>
    </footer>
  );
}