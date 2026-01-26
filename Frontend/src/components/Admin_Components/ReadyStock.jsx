import { useState, useEffect } from "react";
import ProductCard from "../Catalog/ProductCard";
import { API_ENDPOINTS } from "../../config/api";
import "../../styles/ReadyStock.css";

export default function ReadyStock() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  // Fetch all ready stock products once
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        // Fetch with a very high limit to get all products at once
        const response = await fetch(API_ENDPOINTS.products.getReadyStock(1, 1000));
        const data = await response.json();

        if (data.success) {
          setAllProducts(data.products);
        } else {
          setError("Failed to load ready stock products");
        }
      } catch (err) {
        console.error("Error fetching ready stock:", err);
        setError("Failed to load ready stock products");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Reset to page 1 when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [allProducts]);

  // Calculate pagination
  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = allProducts.slice(startIndex, endIndex);

  // Pagination helper functions
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="ready-stock-wrapper">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading ready stock products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ready-stock-wrapper">
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
    <div className="ready-stock-wrapper">
      {/* Header Section */}
      <div className="ready-stock-header">
        <div className="header-content">
          <div className="stock-badge">
            <span className="badge-icon">📦</span>
            <span className="badge-text">In Stock</span>
          </div>
          <h1 className="ready-stock-title">Ready Stock Products</h1>
          <p className="ready-stock-subtitle">
            Handpicked items ready for immediate delivery. Limited quantities available!
          </p>
        </div>
      </div>

      {/* Products Grid */}
      {allProducts.length > 0 ? (
        <>
          <div className="products-count">
            <p>
              {allProducts.length} products available in stock
              {totalPages > 1 && (
                <span className="page-info"> • Page {currentPage} of {totalPages}</span>
              )}
            </p>
          </div>
          
          <div className="ready-stock-grid">
            {currentProducts.map((product) => (
              <div key={product.id} className="stock-product-wrapper">
                <ProductCard product={product} />
                <div className="stock-quantity-badge">
                  <span className="stock-dot"></span>
                  <span className="stock-label">
                    {product.quantity || 0} {(product.quantity || 0) === 1 ? "unit" : "units"} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
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
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  )
                ))}
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
          <div className="empty-icon">📦</div>
          <p className="empty-title">No Products in Stock Yet</p>
          <p className="empty-subtitle">
            Check back soon for new ready-to-ship items!
          </p>
          <a href="/catalog" className="browse-btn">
            Browse All Products
          </a>
        </div>
      )}
    </div>
  );
}