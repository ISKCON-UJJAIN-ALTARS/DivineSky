import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryBar from "../components/Catalog/CategoryBar";
import ProductGrid from "../components/Catalog/ProductGrid";
import LoadingState from "../components/Catalog/LoadingState";
import ErrorState from "../components/Catalog/ErrorState";
import EmptyState from "../components/Catalog/EmptyState";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { CATEGORIES } from "../config/categories";
import { API_ENDPOINTS } from "../config/api";
import "../styles/Catalog/Catalog.css";
import "../styles/Catalog/Catalog-responsive.css";

import { Helmet } from "react-helmet-async";

export default function Catalog({ search }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔧 FIX: Initialize directly from URL so the first render/fetch
  // already uses the correct category — no "all products" flash.
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const categoryFromUrl = searchParams.get("category");
    const categoryExists =
      categoryFromUrl && CATEGORIES.some((cat) => cat.value === categoryFromUrl);
    return categoryExists ? categoryFromUrl : "all";
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState(
    () => searchParams.get("subCategory") || ""
  );

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

  // 🔧 Sync state with URL on subsequent changes (back/forward nav,
  // manual URL edits). Initial state is already handled above, so this
  // just keeps things consistent after mount — and skips redundant
  // updates to avoid extra re-fetches.
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const subCategoryFromUrl = searchParams.get("subCategory");

    const categoryExists =
      categoryFromUrl && CATEGORIES.some((cat) => cat.value === categoryFromUrl);
    const nextCategory = categoryExists ? categoryFromUrl : "all";
    const nextSubCategory = subCategoryFromUrl || "";

    setSelectedCategory((prev) => (prev !== nextCategory ? nextCategory : prev));
    setSelectedSubCategory((prev) => (prev !== nextSubCategory ? nextSubCategory : prev));
  }, [searchParams]);

  // SUPER OPTIMIZED: Use single backend endpoint for "all" category
  const fetchProducts = useCallback(async (category) => {
    try {
      setError(null);
      setPage(1);
      setLoading(true);

      let productsArray = [];

      if (category === "all") {
        // 🚀 Single optimized request to backend - fetch ALL products
        const response = await fetch(
          API_ENDPOINTS.products.getAll(1, 500), // Increased to 500 to ensure we get all products
          {
            signal: AbortSignal.timeout(15000),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is valid JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        const data = await response.json();

        if (data.success && data.products) {
          productsArray = data.products;
        }

        setAllProducts(productsArray);
        setDisplayedProducts(productsArray.slice(0, itemsPerPage));
        setHasMore(productsArray.length > itemsPerPage);

        console.log(`✅ Loaded ${productsArray.length} products in ONE request!`);
      } else {
        // 🔧 FIX: Fetch specific category with increased limit to get ALL products
        const response = await fetch(
          `${API_ENDPOINTS.products.getByCategory(category)}?limit=1000`, // Added limit parameter
          {
            signal: AbortSignal.timeout(10000),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is valid JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        const data = await response.json();

        if (data.success) {
          productsArray = Array.isArray(data.products)
            ? data.products
            : Object.values(data.products || {});
        }

        console.log(`✅ Loaded ${productsArray.length} products from ${category} category`);

        setAllProducts(productsArray);
        setDisplayedProducts(productsArray.slice(0, itemsPerPage));
        setHasMore(productsArray.length > itemsPerPage);
      }

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
      const matchesSearch =
        !search ||
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

      setDisplayedProducts((prev) => [...prev, ...newProducts]);
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

    // 🔧 Sync URL with selected category
    if (categoryValue === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryValue });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle subcategory change
  const handleSubCategoryChange = (subCategoryValue) => {
    setSelectedSubCategory(subCategoryValue);

    // 🔧 Sync URL with selected subcategory (keep category param intact)
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (subCategoryValue) {
        params.set("subCategory", subCategoryValue);
      } else {
        params.delete("subCategory");
      }
      return params;
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get current category subcategories
  const currentCategory = CATEGORIES.find((c) => c.value === selectedCategory);
  const hasSubCategories = currentCategory?.subCategories?.length > 0;
  const hasMultipleSubCategories = currentCategory?.subCategories?.length > 1;

  // Show subcategory sections only when:
  // 1. Not viewing "all" category
  // 2. Category has MULTIPLE subcategories (more than 1)
  // 3. No specific subcategory is selected
  const showSubCategorySections = selectedCategory !== "all" && hasMultipleSubCategories && !selectedSubCategory;

  return (
    <div className="catalog-wrapper">
      <Helmet>
        <title>Catalog | Wooden Altars, Deities & Temple Furniture | Divine Sky</title>
        <meta
          name="description"
          content="Browse Divine Sky's full catalog of handcrafted wooden altars, deities, Vyasasans, Tulsi tables, 3D reliefs, and spiritual furniture."
        />
        <link rel="canonical" href="https://divinesky.vercel.app/catalog" />
      </Helmet>

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

      {/* Subcategory Sections - Netflix Style (showing more products now) */}
      {!loading && showSubCategorySections && (
        <div className="subcategory-sections-wrapper">
          <div className="category-intro">
            <h2>{currentCategory.label}</h2>
            <p>Browse by type or scroll to see all products</p>
          </div>

          {currentCategory.subCategories.map((subCat) => {
            const subCategoryProducts = allProducts.filter(
              (p) => p.subCategory === subCat.value
            );

            if (subCategoryProducts.length === 0) return null;

            return (
              <div key={subCat.value} className="subcategory-section">
                <div className="subcategory-header">
                  <h3>
                    {subCat.label}
                    <span className="product-count-badge">({subCategoryProducts.length})</span>
                  </h3>
                </div>
                <button
                  className="view-all-btn"
                  onClick={() => handleSubCategoryChange(subCat.value)}
                >
                  View All →
                </button>
                {/* Show up to 3 products in the preview */}
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
            {currentCategory?.subCategories.find((s) => s.value === selectedSubCategory)?.label}
            <button
              className="filter-remove"
              onClick={() => handleSubCategoryChange("")}
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
          onClearFilter={() => handleSubCategoryChange("")}
          onViewAll={() => handleCategoryChange("all")}
        />
      )}

      {/* Products Grid - Show when "all" category OR subcategory selected OR single subcategory */}
      {!loading && !error && filteredProducts.length > 0 && !showSubCategorySections && (
        <>
          <div className="catalog-stats">
            <p>
              Showing {displayedProducts.length} of {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
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