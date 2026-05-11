import React from 'react';
import '../styles/About.css';


import { Helmet } from "react-helmet-async";



const About = () => {
  return (
    <div className="about-container">

    
<Helmet>
  <title>About Divine Sky | ISKCON Ujjain Altar Makers</title>
  <meta name="description" content="Learn about Divine Sky — craftsmen of handcrafted wooden altars and devotional furniture for ISKCON temples and homes worldwide." />
  <link rel="canonical" href="https://divinesky.vercel.app/about" />
</Helmet>


      
      <div className="hero-section">
        <h1 className="greeting">Hare Krishna!</h1>
        <h2 className="company-name">Divine Sky</h2>
        <p className="tagline">Transforming Vision into Divine Reality</p>
      </div>

      <div className="content-wrapper">
        <section className="intro-section">
          <p className="intro-text">
            At <strong>Divine Sky</strong>, we are passionate about transforming your vision into reality by providing top-notch supplies to meet all your creative needs. Whether you're on a tight budget or seeking the finest materials in the industry, we've got you covered.
          </p>
          <p className="mission-text">
            Our humble endeavor is dedicated to supporting <strong>Srila Prabhupada</strong> and his followers in spreading <strong>Krishna consciousness</strong> worldwide. We offer the necessary paraphernalia for serving the Supreme Lord, catering to your needs for an exquisite Altar, Srila Prabhupada Deities, and other fine items to worship Hari, Guru, and Vaishnavas.
          </p>
        </section>

        <section className="craftsmanship-section">
          <h3>Handcrafted with Devotion</h3>
          <p>
            Our devoted team of artisans from the <strong>Ujjain temple</strong> skillfully handcrafts Altars, simhasanas, vyasasanas, donation boxes, tulasi arti tables, and much more. Since 2006, the meticulously crafted Altars by ISKCON Ujjain have touched the hearts of devotees worldwide.
          </p>
          <p>
            Infusing something unique into each altar created in Ujjain for their Lordships <strong>Shree Shree RadhaMadanmohan</strong>, we've gained immense popularity through the mercy of Sri Sri Radha Madanmohan, Sri Sri Krishna Balaram, Sri Sri Gaura Nitai, and Srila Prabhupada.
          </p>
        </section>

        <section className="journey-section">
          <h3>Our Journey</h3>
          <p>
            Encouraged by the positive response and appreciation, we established a dedicated department in Ujjain for altar production. In a remarkably short span, we've successfully delivered altars and Srila Prabhupada statues to ISKCON communities worldwide.
          </p>
        </section>

        <section className="reach-section">
          <h3>Global Presence</h3>
          <div className="locations-grid">
            <div className="location-group">
              <h4>International</h4>
              <ul>
                <li>United States (California, El Dorado Hills)</li>
                <li>Canada</li>
                <li>Australia</li>
                <li>London</li>
                <li>European countries</li>
                <li>Russia</li>
                <li>South Africa (Durban, Pietermaritzburg)</li>
                <li>Germany</li>
                <li>Switzerland</li>
                <li>Dubai</li>
                <li>Singapore</li>
                <li>Malaysia</li>
                <li>Many More</li>
              </ul>
            </div>
            <div className="location-group">
              <h4>India</h4>
              <ul>
                <li>Ekachakra</li>
                <li>Durgapur</li>
                <li>Pandharpur</li>
                <li>Panihati</li>
                <li>Madurai</li>
                <li>Kolkata</li>
                <li>Bengaluru</li>
                <li>Mumbai</li>
                <li>Delhi</li>
                <li>Many More</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="commitment-section">
          <h3>Our Commitment</h3>
          <p>
            With our commitment to <strong>quality craftsmanship</strong> and the blessings of the divine, we continue our humble service to provide high-quality altars, Srila Prabhupada statues, and paraphernalia to devotees worldwide, supporting the spread of Krishna consciousness and devotion to Lord Krishna (Hari).
          </p>
        </section>

        <section className="cta-section">
          <div className="cta-box">
            <h3>Can't Find What You're Looking For?</h3>
            <p>No worries! Reach out to us, and we'll gladly fulfill custom orders for our esteemed clients.</p>
            <p className="cta-tagline">Let <strong>Divine Sky</strong> be your trusted source for all your worship and spiritual needs.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;