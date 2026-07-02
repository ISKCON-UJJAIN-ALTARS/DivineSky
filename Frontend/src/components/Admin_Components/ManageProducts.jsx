import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, getCategoryValues } from "../../config/categories";
import { API_ENDPOINTS } from "../../config/api";
import "../../styles/Admin/ManageProducts.css";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 50;
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const token = localStorage.getItem("admin_token");

      const results = await Promise.allSettled(
        getCategoryValues().map((category) =>
          fetch(`${API_ENDPOINTS.products.getByCategory(category)}?limit=1000`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
            .then((res) => {
              if (!res.ok) throw new Error(`Failed to fetch ${category}`);
              return res.json();
            })
        )
      );

      const allProducts = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => {
          const data = r.value;
          if (!data.success || !data.products) return [];
          return Array.isArray(data.products)
            ? data.products
            : Object.entries(data.products).map(([id, product]) => ({ ...product, id }));
        });

      setProducts(allProducts);
      setLoading(false);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load products" });
      setLoading(false);
    }
  };

  const deleteProduct = async (product, event) => {
    event.stopPropagation();
    if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        API_ENDPOINTS.admin.deleteProduct(product.category, product.id),
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "✅ Product deleted successfully" });
        fetchAllProducts();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to delete product" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete product" });
    }
  };

  const toggleHidden = async (product, event) => {
    event.stopPropagation();
    const nextHidden = !product.isHidden;

    if (!confirm(
      nextHidden
        ? `Hide "${product.name}" from customers?`
        : `Unhide "${product.name}" so customers can see it again?`
    )) return;

    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("name", product.name || "");
      formData.append("price", product.price ?? "");
      formData.append("description", product.description || "");
      formData.append("subCategory", product.subCategory || "");
      formData.append("isHidden", nextHidden ? "true" : "false");
      if (product.category === "altars") {
        formData.append("altarSize", product.altarSize || "");
        formData.append("altarDesign", product.altarDesign || "");
      }

      const response = await fetch(
        API_ENDPOINTS.admin.updateProduct(product.category, product.id),
        { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: nextHidden
            ? "✅ Product hidden from customers"
            : "✅ Product is now visible to customers",
        });
        fetchAllProducts();
        setTimeout(() => setMessage({ type: "", text: "" }), 2500);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update visibility" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update visibility" });
    }
  };

  const handleProductClick = (product) => {
    navigate(`/admin/products/edit/${product.category}/${product.id}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.subCategory?.toLowerCase().includes(query) ||
        p.price?.toString().includes(query) ||
        p.id?.toString().includes(query) ||
        p.altarSize?.toLowerCase().includes(query) ||
        p.altarDesign?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

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
      <div className="manage-loading">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="manage-container">
      <div className="manage-header">
        <div className="header-top">
          <div>
            <h2>Manage Products</h2>
            <p className="subtitle">Click on any product to view and edit details</p>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              📦 {filteredProducts.length}{" "}
              {selectedCategory !== "all" || searchQuery ? "Found" : "Total"}
            </div>
            {totalPages > 1 && (
              <div className="stat-badge">Page {currentPage} of {totalPages}</div>
            )}
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, category, subcategory, specifications, or price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="clear-search-btn" title="Clear search">
                ✕
              </button>
            )}
          </div>

          <div className="category-filter">
            <label>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {(selectedCategory !== "all" || searchQuery) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>

        {(selectedCategory !== "all" || searchQuery) && (
          <div className="active-filters-bar">
            <span className="filter-label">Active Filters:</span>
            {searchQuery && (
              <span className="filter-chip">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")}>✕</button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="filter-chip">
                Category: {CATEGORIES.find((c) => c.value === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory("all")}>✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}

      <div className="products-table-wrapper">
        {currentProducts.length > 0 ? (
          <>
            <table className="products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Specifications</th>
                  <th>Price</th>
                  <th className="text-center">Images</th>
                  <th className="text-center">Video</th>
                  <th className="text-center">3D Model</th>
                  <th className="text-center">Visibility</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product) => (
                  <tr
                    key={`${product.category}-${product.id}`}
                    onClick={() => handleProductClick(product)}
                    className={`product-row ${product.isHidden ? "product-row-hidden" : ""}`}
                  >
                    <td>
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={product.name} className="product-thumb" />
                      ) : (
                        <div className="no-thumb">📦</div>
                      )}
                    </td>

                    <td className="product-name-cell">
                      {searchQuery && product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: product.name.replace(
                              new RegExp(`(${searchQuery})`, "gi"),
                              "<mark>$1</mark>"
                            ),
                          }}
                        />
                      ) : (
                        product.name
                      )}
                    </td>

                    <td>
                      <span className="category-badge">{product.category}</span>
                    </td>

                    <td>
                      {product.subCategory ? (
                        <span className="subcategory-badge">{product.subCategory}</span>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>

                    <td>
                      {product.category === "altars" && (product.altarSize || product.altarDesign) ? (
                        <div className="specs-cell">
                          {product.altarSize && (
                            <div className="spec-item-inline">
                              <strong>Size:</strong> {product.altarSize}
                            </div>
                          )}
                          {product.altarDesign && (
                            <div className="spec-item-inline">
                              <strong>Design:</strong> {product.altarDesign}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>

                    <td className="price-cell">
                      ₹{product.price?.toLocaleString("en-IN") || "0"}
                    </td>

                    <td className="text-center">
                      <span className="count-badge">{product.images?.length || 0}</span>
                    </td>

                    <td className="text-center">
                      <span className={product.video ? "badge-success" : "badge-warning"}>
                        {product.video ? "✅" : "❌"}
                      </span>
                    </td>

                    <td className="text-center">
                      <span className={product.hasModel ? "badge-success" : "badge-warning"}>
                        {product.hasModel ? "✅" : "❌"}
                      </span>
                    </td>

                    <td className="text-center">
                      {product.isHidden ? (
                        <span className="badge-warning" title="Hidden from customers">🙈 Hidden</span>
                      ) : (
                        <span className="badge-success" title="Visible to customers">👁️ Visible</span>
                      )}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                          className="btn-edit"
                          title="Edit product"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => toggleHidden(product, e)}
                          className="btn-edit"
                          title={product.isHidden ? "Unhide product" : "Hide product"}
                        >
                          {product.isHidden ? "👁️" : "🙈"}
                        </button>
                        <button
                          onClick={(e) => deleteProduct(product, e)}
                          className="btn-delete"
                          title="Delete product"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No products found</p>
            <p className="empty-hint">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first product to get started"}
            </p>
            {(searchQuery || selectedCategory !== "all") && (
              <button onClick={clearFilters} className="clear-filters-btn-large">
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}