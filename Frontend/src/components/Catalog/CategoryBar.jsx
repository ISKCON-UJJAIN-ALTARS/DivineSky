import { useState, useEffect } from "react";

export default function CategoryBar({ categories, selectedCategory, onCategoryChange }) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        window.matchMedia("(hover: none)").matches || 
        window.matchMedia("(pointer: coarse)").matches ||
        'ontouchstart' in window
      );
    };
    
    checkTouchDevice();
    window.addEventListener("resize", checkTouchDevice);
    
    return () => window.removeEventListener("resize", checkTouchDevice);
  }, []);

  const handleCategoryClick = (categoryValue) => {
    onCategoryChange(categoryValue);
  };

  return (
    <div className="category-bar">
      <nav className="category-nav">
        {categories.map((cat) => (
          <div
            key={cat.value}
            className={`category-item ${
              selectedCategory === cat.value ? "active" : ""
            }`}
          >
            <button
              className="category-trigger"
              onClick={() => handleCategoryClick(cat.value)}
            >
              {cat.label}
            </button>
          </div>
        ))}
      </nav>
    </div>
  );
}