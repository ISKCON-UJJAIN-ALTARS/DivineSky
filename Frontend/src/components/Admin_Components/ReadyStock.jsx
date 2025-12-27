import { useState, useEffect } from "react";
import ProductCard from "../Catalog/ProductCard";
import "../../styles/ReadyStock.css";

export default function ReadyStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch ready stock products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // ✅ FIXED: Changed from single quotes to backticks for template literal
        const response = await fetch(
          `https://divinesky.onrender.com/products/ready-stock?page=${page}&limit=20`
        );
        const data = await response.json();

        if (data.success) {
          setProducts(data.products);
          setHasMore(data.pagination.has_next);
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

    fetchProducts();
  }, [page]);

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
      {products.length > 0 ? (
        <>
          <div className="products-count">
            <p>{products.length} products available in stock</p>
          </div>
          
          <div className="ready-stock-grid">
            {products.map((product) => (
              <div key={product.id} className="stock-product-card">
                <ProductCard product={product} />
                <div className="stock-indicator">
                  <span className="stock-dot"></span>
                  <span className="stock-label">
                    {product.quantity} {product.quantity === 1 ? "unit" : "units"} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="load-more-section">
              <button
                className="load-more-btn"
                onClick={() => setPage(page + 1)}
              >
                Load More Products
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
          <a href="/" className="browse-btn">
            Browse All Products
          </a>
        </div>
      )}
    </div>
  );
}