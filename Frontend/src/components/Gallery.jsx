import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config/api";
import "../styles/Gallery.css";

export default function Gallery() {
  // Static fallback data - shows immediately
  const staticGalleryData = {
    hero: { url: "/workshop-hero.jpg", caption: "Our Sacred Workspace" },
    guests: [
      { id: "1", url: "/guest1.jpg", caption: "HG Gauranga Prabhu Visit", featured: true },
      { id: "2", url: "/guest2.jpg", caption: "Temple President Meeting" },
      { id: "3", url: "/guest3.jpg", caption: "Blessing Ceremony" },
      { id: "4", url: "/guest4.jpg", caption: "GBC Members Visit" },
    ],
    workshop: [
      { id: "5", url: "/workshop1.jpg", caption: "Carving Process" },
      { id: "6", url: "/workshop2.jpg", caption: "Gold Leaf Application" },
      { id: "7", url: "/workshop3.jpg", caption: "Quality Inspection" },
      { id: "8", url: "/workshop4.jpg", caption: "Polishing Work" },
      { id: "9", url: "/workshop5.jpg", caption: "Assembly Area" },
      { id: "10", url: "/workshop6.jpg", caption: "Packaging Station" },
    ],
    team: [
      { id: "11", url: "/team1.jpg", caption: "Master Craftsmen" },
      { id: "12", url: "/team2.jpg", caption: "Design Team" },
      { id: "13", url: "/team3.jpg", caption: "Quality Control" },
    ],
  };

  const [galleryData, setGalleryData] = useState(staticGalleryData);
  const [lightbox, setLightbox] = useState({ open: false, image: null, caption: "" });

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.gallery.getAll(), {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      const data = await response.json();

      if (data.success && (data.hero || data.guests?.length > 0 || data.workshop?.length > 0 || data.team?.length > 0)) {
        // Only update if we actually got data from API
        setGalleryData({
          hero: data.hero || staticGalleryData.hero,
          guests: data.guests?.length > 0 ? data.guests : staticGalleryData.guests,
          workshop: data.workshop?.length > 0 ? data.workshop : staticGalleryData.workshop,
          team: data.team?.length > 0 ? data.team : staticGalleryData.team,
        });
        console.log("✅ Gallery loaded from API");
      }
    } catch (err) {
      console.log("📸 Using static gallery (API unavailable)");
      // Keep static data - no need to do anything
    }
  };

  const openLightbox = (image, caption) => {
    setLightbox({ open: true, image, caption });
  };

  const closeLightbox = () => {
    setLightbox({ open: false, image: null, caption: "" });
  };

  return (
    <div className="gallery-page">
      {/* Hero Section */}
      {galleryData.hero && (
        <section className="gallery-hero">
          <div className="hero-image-container">
            <img 
              src={galleryData.hero.url} 
              alt={galleryData.hero.caption}
              className="hero-image"
            />
            <div className="hero-overlay">
              <h1 className="hero-title">Crafting Sacred Spaces</h1>
              <p className="hero-subtitle">
                A glimpse into our workshop where devotion meets craftsmanship
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="gallery-container">
        {/* Distinguished Guests Section */}
        {galleryData.guests.length > 0 && (
          <section className="gallery-section">
            <div className="section-header">
              <h2 className="section-title">Distinguished Guests</h2>
              <p className="section-subtitle">
                Honored by visits from senior Vaishnavas and devotees
              </p>
            </div>

            <div className="guests-grid">
              {galleryData.guests.map((guest, index) => (
                <div
                  key={index}
                  className={`guest-photo ${index === 0 ? "featured" : ""}`}
                  onClick={() => openLightbox(guest.url, guest.caption)}
                >
                  <img src={guest.url} alt={guest.caption} />
                  <div className="photo-overlay">
                    <p className="photo-caption">{guest.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Workshop Section */}
        {galleryData.workshop.length > 0 && (
          <section className="gallery-section">
            <div className="section-header">
              <h2 className="section-title">Our Workshop</h2>
              <p className="section-subtitle">
                Where traditional craftsmanship meets modern precision
              </p>
            </div>

            <div className="workshop-grid">
              {galleryData.workshop.map((photo, index) => (
                <div
                  key={index}
                  className="workshop-photo"
                  onClick={() => openLightbox(photo.url, photo.caption)}
                >
                  <img src={photo.url} alt={photo.caption} />
                  <div className="photo-overlay">
                    <p className="photo-caption">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team Section */}
        {galleryData.team.length > 0 && (
          <section className="gallery-section">
            <div className="section-header">
              <h2 className="section-title">The Team Behind the Magic</h2>
              <p className="section-subtitle">
                Dedicated artisans preserving ancient craftsmanship
              </p>
            </div>

            <div className="team-grid">
              {galleryData.team.map((photo, index) => (
                <div
                  key={index}
                  className="team-photo"
                  onClick={() => openLightbox(photo.url, photo.caption)}
                >
                  <img src={photo.url} alt={photo.caption} />
                  <div className="photo-overlay">
                    <p className="photo-caption">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightbox.open && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            ✕
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.caption} />
            {lightbox.caption && (
              <p className="lightbox-caption">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}