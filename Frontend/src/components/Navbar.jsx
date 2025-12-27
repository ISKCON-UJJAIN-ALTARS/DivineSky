import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar({ search, setSearch }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      setIsSearchOpen(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isSearchOpen) setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen, isSearchOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <Link to="/" className="logo">
          DIVIINE<span>SKY</span>
        </Link>

        {/* Center Group: Search + Ready Stock (Desktop Only) */}
        <div className="navbar-center">
          {/* Search - Desktop */}
          <div className="search-wrapper desktop-search">
            <input
              type="text"
              className="search-input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="search-icon">⌕</span>
          </div>

          {/* Ready Stock Button - Desktop */}
          <Link to="/ready-stock" className="ready-stock-btn desktop-ready-stock">
            <span className="stock-icon">📦</span>
            <span className="stock-text">Ready Stock</span>
          </Link>
        </div>

        {/* Nav Links - Desktop */}
        <ul className={`nav-links ${isMobileMenuOpen ? "active" : ""}`}>
          <li>
            <Link to="/" onClick={handleLinkClick}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" onClick={handleLinkClick}>
              About
            </Link>
          </li>
          {/* Ready Stock Link - Mobile Menu Only */}
          <li className="mobile-only-link">
            <Link to="/ready-stock" onClick={handleLinkClick}>
              <span className="stock-icon">📦</span> Ready Stock
            </Link>
          </li>
        </ul>

        {/* Mobile Actions */}
        <div className="mobile-actions">
          {/* Ready Stock Button - Mobile */}
          <Link to="/ready-stock" className="mobile-ready-stock" aria-label="Ready Stock">
            <span className="stock-icon">📦</span>
            <span className="stock-text">Ready Stock</span>
          </Link>

          {/* Search Icon - Mobile */}
          <button
            className="mobile-search-btn"
            onClick={toggleSearch}
            aria-label="Toggle search"
          >
            ⌕
          </button>

          {/* Hamburger Menu */}
          <button
            className={`hamburger ${isMobileMenuOpen ? "active" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Search Dropdown */}
      <div className={`mobile-search-dropdown ${isSearchOpen ? "active" : ""}`}>
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus={isSearchOpen}
          />
          <span className="search-icon">⌕</span>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`nav-overlay ${isMobileMenuOpen || isSearchOpen ? "active" : ""}`}
        onClick={() => {
          setIsMobileMenuOpen(false);
          setIsSearchOpen(false);
        }}
      />
    </>
  );
}