// HeroSection.jsx
import "../styles/HeroSection.css";

const HeroSection = ({ onExploreClick }) => {
  return (
    <section className="landing-page">
      <div className="shape-1"></div>
      <div className="shape-2"></div>
      <div className="shape-3"></div>

      <div className="landing-content">
        <div className="content-left">
          <div className="hero-badge">
            <span>✨</span>
            ISKCON UJJAIN ALTARS
          </div>

          <h1>
            DIVINE <span className="highlight">SKY</span>
          </h1>

          <p>
            Divine Sky crafts premium altars, Prabhupada statues, and sacred
            paraphernalia, serving temples and devotees worldwide with
            authenticity, devotion, and excellence.
          </p>

          <button className="cta-btn" onClick={onExploreClick}>
            Explore Catalog
          </button>

         
        </div>

        <div className="content-right">
          <div className="image-container">
            <img src="../../HeroSection.jpeg" alt="Divine Sky - Sacred Altar" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;