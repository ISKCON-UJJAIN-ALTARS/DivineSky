import { useState, useRef, useEffect } from "react";
import ProductCard from "./ProductCard";

export default function SubCategorySection({ 
  category, 
  selectedSubCategory, 
  onSubCategoryChange,
  products 
}) {
  const [scrollPositions, setScrollPositions] = useState({});
  const scrollRefs = useRef({});

  // Get products for a specific subcategory
  // Show up to 20 products in the carousel (increased from 10)
  const getSubCategoryProducts = (subCategoryValue) => {
    return products
      .filter(p => p.subCategory === subCategoryValue)
      .slice(0, 20); // Increased limit to show more products
  };

  // Scroll handler for horizontal scroll
  const handleScroll = (subCategoryValue, direction) => {
    const container = scrollRefs.current[subCategoryValue];
    if (!container) return;

    const scrollAmount = 300;
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Update scroll position state
  const updateScrollPosition = (subCategoryValue) => {
    const container = scrollRefs.current[subCategoryValue];
    if (!container) return;

    setScrollPositions(prev => ({
      ...prev,
      [subCategoryValue]: {
        isAtStart: container.scrollLeft <= 0,
        isAtEnd: container.scrollLeft >= container.scrollWidth - container.clientWidth - 10
      }
    }));
  };

  // Initialize scroll positions
  useEffect(() => {
    category.subCategories.forEach(sub => {
      updateScrollPosition(sub.value);
    });
  }, [category, products]);

  return (
    <div className="subcategory-section">
      <div className="subcategory-header">
        <h2 className="section-title">{category.label}</h2>
        <p className="section-subtitle">Explore our collection by category</p>
      </div>

      <div className="subcategories-container">
        {category.subCategories.map((sub) => {
          const subProducts = getSubCategoryProducts(sub.value);
          
          if (subProducts.length === 0) return null;

          const scrollPos = scrollPositions[sub.value] || { isAtStart: true, isAtEnd: false };

          return (
            <div key={sub.value} className="subcategory-row">
              <div className="subcategory-row-header">
                <h3 className="subcategory-row-title">
                  {sub.label}
                  <span className="product-count">({subProducts.length})</span>
                </h3>
                <button
                  className={`view-all-link ${selectedSubCategory === sub.value ? 'active' : ''}`}
                  onClick={() => onSubCategoryChange(sub.value)}
                >
                  {selectedSubCategory === sub.value ? 'Viewing All' : 'View All'} 
                  <span className="arrow">→</span>
                </button>
              </div>

              <div className="subcategory-carousel-wrapper">
                {/* Left Scroll Button */}
                {!scrollPos.isAtStart && (
                  <button
                    className="carousel-nav-btn left"
                    onClick={() => handleScroll(sub.value, 'left')}
                    aria-label="Scroll left"
                  >
                    ‹
                  </button>
                )}

                {/* Products Carousel */}
                <div
                  ref={el => scrollRefs.current[sub.value] = el}
                  className="subcategory-carousel"
                  onScroll={() => updateScrollPosition(sub.value)}
                >
                  {subProducts.map((product) => (
                    <div key={product.id} className="carousel-item">
                      <ProductCard {...product} />
                    </div>
                  ))}
                </div>

                {/* Right Scroll Button */}
                {!scrollPos.isAtEnd && subProducts.length > 4 && (
                  <button
                    className="carousel-nav-btn right"
                    onClick={() => handleScroll(sub.value, 'right')}
                    aria-label="Scroll right"
                  >
                    ›
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}