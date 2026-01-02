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
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      // Get all category values (excluding "all")
      const categoryValues = getCategoryValues();
      
      // Fetch all categories in parallel with increased limit
      const results = await Promise.allSettled(
        categoryValues.map(category =>
          fetch(`${API_ENDPOINTS.products.getByCategory(category)}?limit=100`)
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch ${category}`);
              return res.json();
            })
        )
      );

      // Combine all products
      const allProducts = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => {
          const data = result.value;
          if (data.success && data.products) {
            // Convert products object to array with IDs
            const productsArray = Array.isArray(data.products)
              ? data.products
              : Object.entries(data.products).map(([id, product]) => ({
                  ...product,
                  id: id,
                }));
            return productsArray;
          }
          return [];
        });

      console.log(`Loaded ${allProducts.length} products from all categories`);
      setProducts(allProducts);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setMessage({ type: "error", text: "Failed to load products" });
      setLoading(false);
    }
  };

  const deleteProduct = async (product, event) => {
    // Prevent row click navigation
    event.stopPropagation();
    
    if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        API_ENDPOINTS.admin.deleteProduct(product.category, product.id),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "✅ Product deleted successfully" });
        fetchAllProducts(); // Reload all products
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to delete product" });
      }
    } catch (err) {
      console.error("Delete error:", err);
      setMessage({ type: "error", text: "Failed to delete product" });
    }
  };

  const handleProductClick = (product) => {
    navigate(`/admin/products/edit/${product.category}/${product.id}`);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  // Memoized filtered products with search
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesCategory = p.category?.toLowerCase().includes(query);
        const matchesSubCategory = p.subCategory?.toLowerCase().includes(query);
        const matchesPrice = p.price?.toString().includes(query);
        const matchesProductId = p.id?.toString().includes(query);
        
        return matchesName || matchesCategory || matchesSubCategory || matchesPrice || matchesProductId;
      });
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

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
            <span className="stat-badge">
              📦 {filteredProducts.length} {selectedCategory !== "all" || searchQuery ? "Found" : "Total"}
            </span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="filter-bar">
          {/* Search Input */}
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, category, subcategory, or price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            <label>Category:</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory !== "all" || searchQuery) && (
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
              title="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Active Filters Display */}
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
                Category: {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory("all")}>✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status Message */}
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Products Table */}
      <div className="products-table-wrapper">
        {filteredProducts.length > 0 ? (
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Price</th>
                <th>Images</th>
                <th>Video</th>
                <th>3D Model</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr 
                  key={`${product.category}-${product.id}`}
                  onClick={() => handleProductClick(product)}
                  className="product-row"
                >
                  <td>
                    {product.images?.[0]?.url ? (
                      <img 
                        src={product.images[0].url} 
                        alt={product.name}
                        className="product-thumb"
                      />
                    ) : (
                      <div className="no-thumb">📦</div>
                    )}
                  </td>
                  <td className="product-name-cell">
                    {/* Highlight search term in name */}
                    {searchQuery && product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                      <span dangerouslySetInnerHTML={{
                        __html: product.name.replace(
                          new RegExp(`(${searchQuery})`, 'gi'),
                          '<mark>$1</mark>'
                        )
                      }} />
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
                  <td className="price-cell">
                    ₹{product.price?.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="text-center">
                    <span className="count-badge">{product.images?.length || 0}</span>
                  </td>
                  <td className="text-center">
                    {product.video ? (
                      <span className="badge-success">✅</span>
                    ) : (
                      <span className="badge-warning">❌</span>
                    )}
                  </td>
                  <td className="text-center">
                    {product.hasModel ? (
                      <span className="badge-success">✅</span>
                    ) : (
                      <span className="badge-warning">❌</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                        title="Edit product"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={(e) => deleteProduct(product, e)}
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
              <button className="clear-filters-btn-large" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}