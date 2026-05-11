import "../styles/Contact.css";

import { Helmet } from "react-helmet-async";



export default function Contact() {
  return (

    
    <div className="contact-page">



    // /contact page
<Helmet>
  <title>Contact Us | Divine Sky Altars</title>
  <meta name="description" content="Get in touch with Divine Sky for custom wooden altars, temple furniture, and devotional interiors. Based in Ujjain, MP." />
  <link rel="canonical" href="https://divinesky.vercel.app/contact" />
</Helmet>

      {/* Hero Section */}
      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1 className="contact-title">Contact Divine Sky</h1>
          <p className="contact-subtitle">
            Connect with us for sacred artistry and custom spiritual creations
          </p>
        </div>
      </div>

      <div className="contact-container">
        {/* Contact Info Cards */}
        <div className="contact-info-grid">
          {/* Location */}
          <div className="contact-info-card">
            <div className="info-icon">📍</div>
            <h3>Our Workshop</h3>
            <p className="info-detail">Divine Sky </p>
            <p className="info-detail">Radha Madanmohan Corp. Lt., Ujjain Altars</p>
            <p className="info-detail">Ujjain, Madhya Pradesh</p>
            <p className="info-detail">India - 281121</p>
          </div>

          {/* Email */}
          <div className="contact-info-card">
            <div className="info-icon">📧</div>
            <h3>Email Us</h3>
            <a href="mailto:info@divinesky.com" className="contact-link">
              info@divinesky.com
            </a>
            <a href="mailto:orders@divinesky.com" className="contact-link">
              orders@divinesky.com
            </a>
            <a href="mailto:support@divinesky.com" className="contact-link">
              support@divinesky.com
            </a>
          </div>

          {/* Phone */}
          <div className="contact-info-card">
            <div className="info-icon">📞</div>
            <h3>Call or WhatsApp</h3>
            <a href="tel:+919876543210" className="contact-link">
              +91 98765 43210
            </a>
            <a href="tel:+919123456780" className="contact-link">
              +91 91234 56780
            </a>
            <p className="info-timing">Mon - Sat: 9:00 AM - 6:00 PM</p>
            <p className="info-timing">Sunday: Closed</p>
          </div>

          {/* Social Media */}
          <div className="contact-info-card">
            <div className="info-icon">🌐</div>
            <h3>Follow Us</h3>
            <div className="social-links">
              <a 
                href="https://www.youtube.com/@iskconaltars2596" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                <span className="social-icon">▶️</span>
                Youtube
              </a>
              <a 
                href="https://instagram.com/divinesky" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                <span className="social-icon">📷</span>
                Instagram
              </a>
              <a 
                href="https://twitter.com/divinesky" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                <span className="social-icon">🐦</span>
                Twitter
              </a>
              
            </div>
          </div>
        </div>

        

        {/* Quick Contact Actions */}
        <div className="quick-actions">
          <h2>Get In Touch</h2>
          <div className="action-buttons">
            <a href="mailto:sales.rrmc@gmail.com" className="action-btn email-btn">
              <span className="btn-icon">📧</span>
              <span className="btn-text">
                <strong>Send Email</strong>
                <small>info@divinesky.com</small>
              </span>
            </a>

            <a href="tel:+919713600059" className="action-btn call-btn">
              <span className="btn-icon">📞</span>
              <span className="btn-text">
                <strong>Call Now</strong>
                <small>+91 97136 00059</small>
              </span>
            </a>

            <a href="https://wa.me/919713600059" target="_blank" rel="noopener noreferrer" className="action-btn whatsapp-btn">
              <span className="btn-icon">💬</span>
              <span className="btn-text">
                <strong>WhatsApp</strong>
                <small>Chat with us instantly</small>
              </span>
            </a>
          </div>
        </div>

        
      </div>
    </div>
  );
}