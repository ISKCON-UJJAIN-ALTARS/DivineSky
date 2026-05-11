import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from "../config/api";
import "../styles/Testimonials.css";

import { Helmet } from "react-helmet-async";




export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const gridRef = useRef(null);

  // Fetch testimonials from API
  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.testimonials.getAll());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Testimonials API response:", data);
      
      if (data.success && data.testimonials && data.testimonials.length > 0) {
        console.log("Setting testimonials from API:", data.testimonials);
        setTestimonials(data.testimonials);
      } else {
        console.log("No testimonials from API, using fallback");
        // Fallback to default testimonials if none exist
        setTestimonials([
           {
          id: "1",
          name: "HG Radhe Shyam Prabhu",
          role: "Temple President, ISKCON Pune",
          image: "../../RadheshyamPrabhu.jpg",
          message: "When I had gone to Ujjain, I was deeply inspired by the gold-leafed small size altars which I felt our grihasthas in our community may appreciate very much.",
        },
        {
          id: "2",
          name: "HG Gauranga Prabhu",
          role: "ISKCON GBC, India",
          image: "../../Gauranga_Das.jpg",
          message: "HG Gauranga Prabhu visited our temple and very much appreciated our humble service attempts. He emphasized that for the future growth of ISKCON, it is important that ISKCON funds remain within the society, helping us become a self-sufficient movement.",
        },
        ]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      console.log("Using fallback testimonials due to error");
      // Use fallback testimonials on error
      setTestimonials([
       
        {
          id: "1",
          name: "HG Radhe Shyam Prabhu",
          role: "Temple President, ISKCON Pune",
          image: "../../RadheshyamPrabhu.jpg",
          message: "When I had gone to Ujjain, I was deeply inspired by the gold-leafed small size altars which I felt our grihasthas in our community may appreciate very much.",
        },
        {
          id: "2",
          name: "HG Gauranga Prabhu",
          role: "ISKCON GBC, India",
          image: "../../Gauranga_Das.jpg",
          message: "HG Gauranga Prabhu visited our temple and very much appreciated our humble service attempts. He emphasized that for the future growth of ISKCON, it is important that ISKCON funds remain within the society, helping us become a self-sufficient movement.",
        },
      ]);
      setLoading(false);
    }
  };
  
  // Create infinite loop by duplicating testimonials
  const extendedTestimonials = [...testimonials, ...testimonials, ...testimonials];
  const startIndex = testimonials.length;

  const scrollCarousel = (direction) => {
    if (direction === 'left') {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  useEffect(() => {
    // Initialize to middle set on mount
    if (testimonials.length > 0) {
      setCurrentIndex(startIndex);
    }
  }, [testimonials.length]);

  useEffect(() => {
    if (gridRef.current && testimonials.length > 0) {
      const cardWidth = 380;
      const gap = 35;
      const containerWidth = gridRef.current.offsetWidth;
      const actualIndex = startIndex + currentIndex;
      const scrollPosition = (cardWidth + gap) * actualIndex - (containerWidth / 2) + (cardWidth / 2);
      
      gridRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });

      // Reset position for infinite loop
      const timer = setTimeout(() => {
        if (currentIndex >= testimonials.length) {
          gridRef.current.scrollTo({
            left: (cardWidth + gap) * startIndex - (containerWidth / 2) + (cardWidth / 2),
            behavior: 'auto'
          });
          setCurrentIndex(0);
        } else if (currentIndex < 0) {
          gridRef.current.scrollTo({
            left: (cardWidth + gap) * (startIndex + testimonials.length - 1) - (containerWidth / 2) + (cardWidth / 2),
            behavior: 'auto'
          });
          setCurrentIndex(testimonials.length - 1);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, testimonials.length]);

  const getVisibleIndex = (index) => {
    return ((index % testimonials.length) + testimonials.length) % testimonials.length;
  };

  if (loading) {
    return (
      <section className="testimonials">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading testimonials...</p>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className="testimonials">

<Helmet>
  <title>Divine Sky - ISKCON Ujjain Altars</title>
  <meta
    name="description"
    content="Handcrafted wooden altars, deities, Tulsi tables and temple furniture from ISKCON Ujjain."
  />
</Helmet>

      <h2>Words of Encouragement</h2>
      <p className="testimonials-subtitle">
        Appreciation and blessings from senior Vaishnavas
      </p>

      <div className="testimonial-carousel">
        <button 
          className="carousel-arrow left" 
          onClick={() => scrollCarousel('left')}
          aria-label="Previous testimonial"
        >
          <span className="arrow-icon"></span>
        </button>
        
        <div className="testimonial-grid" ref={gridRef}>
          {extendedTestimonials.map((item, index) => (
            <div 
              key={`${item.id}-${index}`}
              className={`testimonial-card ${index === startIndex + currentIndex ? 'active' : ''}`}
            >
              {item.image && <img src={item.image} alt={item.name} />}
              <p className="testimonial-text">"{item.message}"</p>
              <div className="testimonial-author">
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          className="carousel-arrow right" 
          onClick={() => scrollCarousel('right')}
          aria-label="Next testimonial"
        >
          <span className="arrow-icon"></span>
        </button>
      </div>

      <div className="carousel-dots">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === getVisibleIndex(currentIndex) ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}