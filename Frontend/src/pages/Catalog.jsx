import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryBar from "../components/Catalog/CategoryBar";
import ProductGrid from "../components/Catalog/ProductGrid";
import LoadingState from "../components/Catalog/LoadingState";
import ErrorState from "../components/Catalog/ErrorState";
import EmptyState from "../components/Catalog/EmptyState";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { CATEGORIES, getCategoryValues } from "../config/categories";
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

  // Read category from URL on mount or when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      const categoryExists = CATEGORIES.some(cat => cat.value === categoryFromUrl);
      if (categoryExists) {
        setSelectedCategory(categoryFromUrl);
      }
    }
  }, [searchParams]);

  // OPTIMIZED: Fetch products with parallel requests
  const fetchProducts = useCallback(async (category) => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);

      let productsArray = [];

      if (category === "all") {
        // Fetch ALL products from all categories IN PARALLEL
        const categoryValues = getCategoryValues();
        
        // Use Promise.allSettled for better error handling
        const results = await Promise.allSettled(
          categoryValues.map(catValue =>
            fetch(`https://divinesky.onrender.com/products/${catValue}`)
              .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch ${catValue}`);
                return res.json();
              })
          )
        );

        // Extract successful results
        productsArray = results
          .filter(result => result.status === 'fulfilled')
          .flatMap(result => {
            const data = result.value;
            if (data.success) {
              return Array.isArray(data.products) 
                ? data.products 
                : Object.values(data.products || {});
            }
            return [];
          });

        // Log any failures (optional)
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.warn(`${failures.length} categories failed to load`);
        }

      } else {
        // Fetch specific category
        const response = await fetch(`https://divinesky.onrender.com/products/${category}`);
        
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
      // Initially load only itemsPerPage products
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
  }, [itemsPerPage]);

  // Fetch products when category changes
  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory, fetchProducts]);

  // MEMOIZED: Get filtered products based on search and subcategory
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesSearch = !search || 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());
      const matchesSubCategory = !selectedSubCategory || p.subCategory === selectedSubCategory;
      return matchesSearch && matchesSubCategory;
    });
  }, [allProducts, search, selectedSubCategory]);

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simulate network delay for smooth UX
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = page * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      const filtered = filteredProducts;
      const newProducts = filtered.slice(startIndex, endIndex);
      
      setDisplayedProducts(prev => [...prev, ...newProducts]);
      setPage(nextPage);
      setHasMore(endIndex < filtered.length);
      setIsLoadingMore(false);
    }, 300);
  }, [page, itemsPerPage, filteredProducts, hasMore, isLoadingMore]);

  // Custom hook for infinite scroll
  const loadMoreRef = useInfiniteScroll(loadMoreProducts, hasMore && !isLoadingMore);

  // Update displayed products when filters change
  useEffect(() => {
    const filtered = filteredProducts;
    setDisplayedProducts(filtered.slice(0, itemsPerPage));
    setPage(1);
    setHasMore(filtered.length > itemsPerPage);
  }, [search, selectedSubCategory, filteredProducts, itemsPerPage]);

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
  const currentCategory = CATEGORIES.find(c => c.value === selectedCategory);
  const hasSubCategories = currentCategory?.subCategories?.length > 0;

  // Show subcategory sections only when:
  // 1. Not viewing "all" category
  // 2. Category has subcategories
  // 3. No specific subcategory is selected
  const showSubCategorySections = selectedCategory !== "all" && hasSubCategories && !selectedSubCategory;

  return (
    <div className="catalog-wrapper">
      {/* Category Bar */}
      <CategoryBar
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Error State */}
      {error && !loading && (
        <ErrorState error={error} onRetry={() => fetchProducts(selectedCategory)} />
      )}

      {/* Subcategory Sections - Netflix Style (showing only 3 products) */}
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
                {/* Show only 3 products */}
                <ProductGrid products={subCategoryProducts.slice(0, 3)} />
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

      {/* Products Grid - Show when "all" category OR subcategory selected */}
      {!loading && !error && filteredProducts.length > 0 && !showSubCategorySections && (
        <>
          <div className="catalog-stats">
            <p>
              Showing {displayedProducts.length} of {filteredProducts.length} product
              {filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>

          <ProductGrid products={displayedProducts} />

          {/* Load More Trigger for Infinite Scroll */}
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

          {/* End Message */}
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