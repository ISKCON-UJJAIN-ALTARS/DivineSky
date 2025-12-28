import { useEffect, useRef, useState } from "react";

export default function CategoryBar({ categories, selectedCategory, onCategoryChange }) {
  const categoryBarRef = useRef(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      const bar = categoryBarRef.current;
      if (!bar) return;

      // Check if content is scrollable and not at the end
      const isScrollable = bar.scrollWidth > bar.clientWidth;
      const isAtEnd = bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 10; // 10px threshold
      
      setShowScrollIndicator(isScrollable && !isAtEnd);
    };

    const bar = categoryBarRef.current;
    if (bar) {
      // Check on mount and resize
      checkScroll();
      window.addEventListener('resize', checkScroll);
      bar.addEventListener('scroll', checkScroll);

      return () => {
        window.removeEventListener('resize', checkScroll);
        bar.removeEventListener('scroll', checkScroll);
      };
    }
  }, [categories]);

  // Scroll right function
  const handleScrollRight = () => {
    const bar = categoryBarRef.current;
    if (!bar) return;

    // Scroll by 300px to the right with smooth animation
    bar.scrollBy({
      left: 300,
      behavior: 'smooth'
    });
  };

  return (
    <div className="category-bar-wrapper">
      <div 
        ref={categoryBarRef}
        className="category-bar"
      >
        <nav className="category-nav">
          {categories.map((category) => (
            <div
              key={category.value}
              className={`category-item ${selectedCategory === category.value ? 'active' : ''}`}
            >
              <button
                className="category-trigger"
                onClick={() => onCategoryChange(category.value)}
                aria-current={selectedCategory === category.value ? 'page' : undefined}
              >
                {category.label}
              </button>
            </div>
          ))}
        </nav>
      </div>
      
      {/* Scroll Indicator - Fixed on right side with click functionality */}
      <div className={`scroll-indicator ${showScrollIndicator ? 'visible' : ''}`}>
        <div 
          className="scroll-arrow"
          onClick={handleScrollRight}
          role="button"
          aria-label="Scroll right to see more categories"
          tabIndex={showScrollIndicator ? 0 : -1}
        >
          ›
        </div>
      </div>
    </div>
  );
}