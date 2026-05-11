import { useEffect, useRef, useState } from "react";
import "../styles/GallerySection.css";

import { Helmet } from "react-helmet-async";




const images = [
  "/SP.jpg",
  "/bcsm.jpeg",
  "/Deity.jpeg",
   "/SP.jpg",
  "/bcsm.jpeg",
  "/Deity.jpeg",
];

export default function GallerySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const trackRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Create extended array for infinite loop effect
  const extendedImages = [...images, ...images, ...images];
  const startIndex = images.length; // Start at middle set

  const scrollToIndex = (index, smooth = true) => {
    const container = trackRef.current;
    if (!container) return;

    const item = container.children[index];
    if (!item) return;

    const containerCenter = container.offsetWidth / 2;
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;

    container.scrollTo({
      left: itemCenter - containerCenter,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // Initialize to center position on mount
  useEffect(() => {
    scrollToIndex(startIndex + activeIndex, false);
  }, []);

  // Scroll when active index changes
  useEffect(() => {
    if (!isTransitioning) {
      scrollToIndex(startIndex + activeIndex, true);
    }
  }, [activeIndex, isTransitioning]);

  // Handle infinite loop reset
  useEffect(() => {
    if (isTransitioning) return;

    const timer = setTimeout(() => {
      // Reset to middle set when reaching ends
      if (activeIndex >= images.length) {
        setIsTransitioning(true);
        setTimeout(() => {
          scrollToIndex(startIndex, false);
          setActiveIndex(0);
          setIsTransitioning(false);
        }, 500);
      } else if (activeIndex < 0) {
        setIsTransitioning(true);
        setTimeout(() => {
          scrollToIndex(startIndex + images.length - 1, false);
          setActiveIndex(images.length - 1);
          setIsTransitioning(false);
        }, 500);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [activeIndex, isTransitioning]);

  const next = () => {
    if (isTransitioning) return;
    setActiveIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (isTransitioning) return;
    setActiveIndex((prev) => prev - 1);
  };

  const goToSlide = (index) => {
    if (isTransitioning) return;
    setActiveIndex(index);
  };

  // Touch/Swipe handlers for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      next(); // Swipe left
    } else if (distance < -minSwipeDistance) {
      prev(); // Swipe right
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Auto-play (optional)
  useEffect(() => {
    const autoplay = setInterval(() => {
      next();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(autoplay);
  }, [activeIndex, isTransitioning]);

  // Get visible index (normalized to 0-2 range)
  const getVisibleIndex = () => {
    return ((activeIndex % images.length) + images.length) % images.length;
  };

  return (
    <section className="gallery-section">

<Helmet>
  <title>Divine Sky - ISKCON Ujjain Altars</title>
  <meta
    name="description"
    content="Handcrafted wooden altars, deities, Tulsi tables and temple furniture from ISKCON Ujjain."
  />
</Helmet>


      <div className="gallery-header">
        <span className="gallery-subtitle">A quiet glimpse</span>
        <h2 className="gallery-title">Crafted with Devotion</h2>
      </div>

      <div className="gallery-carousel">
        <button 
          className="gallery-arrow left" 
          onClick={prev}
          aria-label="Previous image"
        >
          ‹
        </button>

        <div 
          className="gallery-track" 
          ref={trackRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {extendedImages.map((src, index) => {
            const actualIndex = index - startIndex;
            const isActive = actualIndex === activeIndex;
            
            return (
              <div
                key={`${src}-${index}`}
                className={`gallery-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  const clickedIndex = index - startIndex;
                  goToSlide(clickedIndex);
                }}
              >
                <img 
                  src={src} 
                  alt={`Sacred creation ${(index % images.length) + 1}`}
                  loading="lazy"
                />
                <div className="gallery-item-overlay">
                  <span className="view-text">Click to view</span>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          className="gallery-arrow right" 
          onClick={next}
          aria-label="Next image"
        >
          ›
        </button>
      </div>

      {/* Indicator Dots */}
      <div className="gallery-indicators">
        {images.map((_, index) => (
          <button
            key={index}
            className={`indicator-dot ${getVisibleIndex() === index ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="gallery-counter">
        {getVisibleIndex() + 1} / {images.length}
      </div>
    </section>
  );
}