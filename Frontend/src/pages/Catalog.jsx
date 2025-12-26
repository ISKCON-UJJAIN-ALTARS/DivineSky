import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryBar from "../components/Catalog/CategoryBar";
import SubCategorySection from "../components/Catalog/SubCategorySection";
import ProductGrid from "../components/Catalog/ProductGrid";
import LoadingState from "../components/Catalog/LoadingState";
import ErrorState from "../components/Catalog/ErrorState";
import EmptyState from "../components/Catalog/EmptyState";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import "../styles/Catalog/Catalog.css";
import "../styles/Catalog/Catalog-responsive.css";

export default function Catalog({ search }) {
  const [searchParams] = useSearchParams();
  
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Determine items per page based on screen size
  const getItemsPerPage = () => {
    if (window.innerWidth <= 768) return 6; // Mobile
    return 10; // Desktop/Tablet
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

  // Update items per page on resize
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(getItemsPerPage());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Categories configuration
  const categories = [
    { 
      value: "all", 
      label: "All Products",
      subCategories: []
    },
    { 
      value: "altars", 
      label: "Altars & Temple Setups",
      subCategories: [
        { value: "medium", label: "Medium Size" },
        { value: "small", label: "Small Size" },
        { value: "large", label: "Large Size" },
        { value: "tovp", label: "TOVP Style Altar" },        
        { value: "sp-altar", label: "Prabhupada Altar" },
      ]
    },
    { 
      value: "deities", 
      label: "Deity Statues",
      subCategories: [
        { value: "sp", label: "SP Deity" },
        { value: "guru-parampara", label: "Guru Parampara" },
        { value: "haridas", label: "Srila Haridas Thakur Deity" },
        { value: "yashoda-damodara", label: "Yashoda Damodara" },
        { value: "custom-deity", label: "Custom Deity" },
      ]
    },
    { 
      value: "sculptures", 
      label: "3D Reviels",
      subCategories: [
        { value: "Gaura-Lila", label: "Gaura Lila" },
        { value: "Krishna-Lila", label: "Krishna Lila" },
        { value: "Other-Deities", label: "Other Deities" },
      ]
    },
    { 
      value: "custom", 
      label: "Divine Gifts",
      subCategories: [
        { value: "laser-engravings", label: "Laser Engravings" },
      ]
    },
    { 
      value: "furniture", 
      label: "Spiritual Furniture",
      subCategories: [
        { value: "tulsi-table", label: "Tulsi Table" },
        { value: "reception-table", label: "Reception Table" },
        { value: "doors", label: "Temple Doors" },
        { value: "vyasasan", label: "Vyasasan" },
        { value: "bookshelf", label: "Bookshelf" },
        { value: "mridangam-stand", label: "Mridangam Stand" },
      ]
    },
  ];

  // Read category from URL on mount or when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      // Check if the category exists in your categories array
      const categoryExists = categories.some(cat => cat.value === categoryFromUrl);
      if (categoryExists) {
        setSelectedCategory(categoryFromUrl);
      }
    }
  }, [searchParams]);

  // Fetch products - FIXED for "all" category to get ALL products
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);

      let productsArray = [];

      if (selectedCategory === "all") {
        // Fetch ALL products from all categories
        const categoryValues = categories
          .filter(cat => cat.value !== "all")
          .map(cat => cat.value);
        
        const fetchPromises = categoryValues.map(catValue =>
          fetch(`https://divinesky.onrender.com/products/${catValue}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                return Array.isArray(data.products) 
                  ? data.products 
                  : Object.values(data.products || {});
              }
              return [];
            })
            .catch(err => {
              console.error(`Error fetching ${catValue}:`, err);
              return [];
            })
        );

        const results = await Promise.all(fetchPromises);
        productsArray = results.flat();
      } else {
        // Fetch specific category
        const url = `https://divinesky.onrender.com/products/${selectedCategory}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          productsArray = Array.isArray(data.products) 
            ? data.products 
            : Object.values(data.products || {});
        }
      }
      
      setAllProducts(productsArray);
      setDisplayedProducts(productsArray.slice(0, itemsPerPage));
      setHasMore(productsArray.length > itemsPerPage);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setLoading(false);
      setAllProducts([]);
      setDisplayedProducts([]);
      setHasMore(false);
    }
  };

  // Load more products
  const loadMoreProducts = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simulate network delay for smooth UX
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = page * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      const filteredProducts = getFilteredProducts();
      const newProducts = filteredProducts.slice(startIndex, endIndex);
      
      setDisplayedProducts(prev => [...prev, ...newProducts]);
      setPage(nextPage);
      setHasMore(endIndex < filteredProducts.length);
      setIsLoadingMore(false);
    }, 300);
  };

  // Custom hook for infinite scroll
  const loadMoreRef = useInfiniteScroll(loadMoreProducts, hasMore && !isLoadingMore);

  // Get filtered products based on search and subcategory
  const getFilteredProducts = () => {
    return allProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                           p.category.toLowerCase().includes(search.toLowerCase());
      const matchesSubCategory = !selectedSubCategory || p.subCategory === selectedSubCategory;
      return matchesSearch && matchesSubCategory;
    });
  };

  // Update displayed products when filters change
  useEffect(() => {
    const filtered = getFilteredProducts();
    setDisplayedProducts(filtered.slice(0, itemsPerPage));
    setPage(1);
    setHasMore(filtered.length > itemsPerPage);
  }, [search, selectedSubCategory, allProducts, itemsPerPage]);

  // Handle category change
  const handleCategoryChange = (categoryValue) => {
    setSelectedCategory(categoryValue);
    setSelectedSubCategory("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle subcategory change
  const handleSubCategoryChange = (subCategoryValue) => {
    setSelectedSubCategory(subCategoryValue);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get current category subcategories
  const currentCategory = categories.find(c => c.value === selectedCategory);
  const hasSubCategories = currentCategory?.subCategories?.length > 0;

  const filteredProducts = getFilteredProducts();

  // UPDATED: Show subcategory sections for specific categories (not "all")
  const showSubCategorySections = selectedCategory !== "all" && hasSubCategories && !selectedSubCategory;

  return (
    <div className="catalog-wrapper">
      {/* Category Bar */}
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Error State */}
      {error && !loading && (
        <ErrorState error={error} onRetry={fetchProducts} />
      )}

      {/* Show Subcategory Sections for specific categories */}
      {!loading && showSubCategorySections && (
        <div className="subcategory-sections-wrapper">
          <div className="category-intro">
            <h2>{currentCategory.label}</h2>
            <p>Browse by type or scroll to see all products</p>
          </div>
          
          {currentCategory.subCategories.map((subCat) => {
            const subCategoryProducts = allProducts.filter(
              p => p.subCategory === subCat.value
            );
            
            if (subCategoryProducts.length === 0) return null;
            
            return (
              <div key={subCat.value} className="subcategory-section">
                <div className="subcategory-header">
                  <h3>{subCat.label}</h3>
                  <button 
                    className="view-all-btn"
                    onClick={() => handleSubCategoryChange(subCat.value)}
                  >
                    View All ({subCategoryProducts.length})
                  </button>
                </div>
                <ProductGrid products={subCategoryProducts.slice(0, 8)} />
              </div>
            );
          })}
        </div>
      )}

      {/* Active Filter Display */}
      {selectedSubCategory && (
        <div className="active-filters">
          <span className="filter-label">Filtered by:</span>
          <span className="filter-tag">
            {currentCategory?.subCategories.find(s => s.value === selectedSubCategory)?.label}
            <button 
              className="filter-remove"
              onClick={() => setSelectedSubCategory("")}
              aria-label="Remove filter"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <EmptyState
          search={search}
          selectedSubCategory={selectedSubCategory}
          selectedCategory={selectedCategory}
          onClearFilter={() => setSelectedSubCategory("")}
          onViewAll={() => {
            setSelectedCategory("all");
            setSelectedSubCategory("");
          }}
        />
      )}

      {/* Products Grid - Show when "all" category OR subcategory selected OR no subcategories */}
      {!loading && !error && filteredProducts.length > 0 && !showSubCategorySections && (
        <>
          <div className="catalog-stats">
            <p>
              Showing {displayedProducts.length} of {filteredProducts.length} product
              {filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>

          <ProductGrid products={displayedProducts} />

          {/* Load More Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="load-more-trigger">
              {isLoadingMore && (
                <div className="loading-more">
                  <div className="spinner-small"></div>
                  <p>Loading more products...</p>
                </div>
              )}
            </div>
          )}

          {!hasMore && displayedProducts.length > itemsPerPage && (
            <div className="end-message">
              <p>You've reached the end! 🎉</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}