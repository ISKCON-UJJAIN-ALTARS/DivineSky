import "../styles/Footer.css";
import { Link } from "react-router-dom";

import { Helmet } from "react-helmet-async";




export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">

<Helmet>
  <title>Divine Sky - ISKCON Ujjain Altars</title>
  <meta
    name="description"
    content="Handcrafted wooden altars, deities, Tulsi tables and temple furniture from ISKCON Ujjain."
  />
</Helmet>
      
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
            <a href="mailto:sales.rmmc@gmail.com" className="contact-item">
              <span className="contact-icon">📧</span>
              <span>sales.rmmc@gmail.com</span>
            </a>
            <a href="tel:+919713600059" className="contact-item">
              <span className="contact-icon">📱</span>
              <span>+91 97136 00059</span>
            </a>
            <a href="https://wa.me/919713600059" target="_blank" rel="noopener noreferrer" className="contact-item">
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
           <img src="../../youtube.webp" alt="YouTube" className="social-icon" />
          </a>
          <a href="https://www.instagram.com/iskcon_ujjain_altars/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
           <img src="../../instagram.webp" alt="Instagram" className="social-icon" />
          </a>
          <a href="https://twitter.com/divinesky" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
           <img src="../../twitter.png" alt="Twitter" className="social-icon" />
          </a>
        </div>
      </div>
    </footer>
  );
}