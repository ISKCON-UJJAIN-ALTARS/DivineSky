import { useState, useEffect } from "react";
import ProductCard from "../Catalog/ProductCard";
import { API_ENDPOINTS } from "../../config/api";
import "../../styles/MostSelling.css";

export default function MostSelling() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.products.getMostSelling(1, 1000));
        const data = await response.json();

        if (data.success) {
          setAllProducts(data.products);
        } else {
          setError("Failed to load most selling products");
        }
      } catch (err) {
        console.error("Error fetching most selling:", err);
        setError("Failed to load most selling products");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [allProducts]);

  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const currentProducts = allProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      [1, 2, 3, 4, "...", totalPages].forEach((p) => pages.push(p));
    } else if (currentPage >= totalPages - 2) {
      [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages].forEach((p) => pages.push(p));
    } else {
      [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages].forEach((p) => pages.push(p));
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="most-selling-wrapper">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading most selling products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="most-selling-wrapper">
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="most-selling-wrapper">
      {/* Header */}
      <div className="most-selling-header">
        <div className="header-content">
          <div className="stock-badge">
            <span className="badge-icon">🔥</span>
            <span className="badge-text">Most Selling</span>
          </div>
          <h1 className="most-selling-title">Our Most Popular Products</h1>
          <p className="most-selling-subtitle">
            Handpicked favourites loved by devotees across the world. Don't miss out!
          </p>
        </div>
      </div>

      {/* Products */}
      {allProducts.length > 0 ? (
        <>
          <div className="products-count">
            <p>
              {allProducts.length} featured product{allProducts.length !== 1 ? "s" : ""}
              {totalPages > 1 && (
                <span className="page-info"> · Page {currentPage} of {totalPages}</span>
              )}
            </p>
          </div>

          <div className="most-selling-grid">
            {currentProducts.map((product, index) => (
              <div key={product.id} className="selling-product-wrapper">
                <div className="selling-rank-badge">#{startIndex + index + 1}</div>
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>

              <div className="pagination-numbers">
                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`pagination-number ${currentPage === page ? "active" : ""}`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-stock-state">
          <div className="empty-icon">🔥</div>
          <p className="empty-title">No Featured Products Yet</p>
          <p className="empty-subtitle">
            Check back soon — we'll be featuring our most popular items here!
          </p>
          <a href="/catalog" className="browse-btn">
            Browse All Products
          </a>
        </div>
      )}
    </div>
  );
}