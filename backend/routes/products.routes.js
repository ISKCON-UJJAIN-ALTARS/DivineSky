const express = require("express");
const { getJsonFromR2 } = require("../services/r2.service");

const router = express.Router();

/**
 * 🌍 GET /products
 * Fetch all products from all categories with pagination
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 *   - subCategory: Filter by subcategory
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const subCategory = req.query.subCategory || "";
    
    const categories = ["altars", "deities", "sculptures", "custom", "furniture"];
    const allProducts = [];

    for (const category of categories) {
      const jsonKey = `products/${category}.json`;
      const data = await getJsonFromR2(jsonKey);

      if (data?.products) {
        allProducts.push(
          ...Object.values(data.products).map((p) => ({
            ...p,
            category: p.category || category,
            images: Array.isArray(p.images) 
              ? p.images 
              : (p.image ? [{ url: p.image, size: p.imageSize, mimetype: p.imageType }] : []),
            hasModel: !!p.model,
            hasVideo: !!p.video,
          }))
        );
      }
    }

    // Filter by subcategory if provided
    let filteredProducts = allProducts;
    if (subCategory) {
      filteredProducts = allProducts.filter(p => p.subCategory === subCategory);
    }

    // Calculate pagination
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      success: true,
      products: paginatedProducts,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_products: totalProducts,
        per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      }
    });
  } catch (err) {
    console.error("Error fetching all products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

/**
 * 🌍 GET /products/:category
 * Fetch all products from a specific category with pagination
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 *   - subCategory: Filter by subcategory
 */
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const subCategory = req.query.subCategory || "";
    
    // Validate category
    const validCategories = ["altars", "deities", "sculptures", "custom", "furniture"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      });
    }

    const jsonKey = `products/${category}.json`;
    const data = await getJsonFromR2(jsonKey);

    if (!data) {
      return res.json({
        success: true,
        category,
        products: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_products: 0,
          per_page: limit,
          has_next: false,
          has_prev: false,
        }
      });
    }

    let productsArray = Object.values(data.products || {}).map((p) => ({
      ...p,
      images: Array.isArray(p.images) 
        ? p.images 
        : (p.image ? [{ url: p.image, size: p.imageSize, mimetype: p.imageType }] : []),
      hasModel: !!p.model,
      hasVideo: !!p.video,
    }));

    // Filter by subcategory if provided
    if (subCategory) {
      productsArray = productsArray.filter(p => p.subCategory === subCategory);
    }

    // Calculate pagination
    const totalProducts = productsArray.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = productsArray.slice(startIndex, endIndex);

    res.json({
      success: true,
      category,
      products: paginatedProducts,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_products: totalProducts,
        per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      last_updated: data.last_updated,
    });
  } catch (err) {
    console.error(`Error fetching products for category ${req.params.category}:`, err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

/**
 * 🌍 GET /products/:category/:id
 * Fetch a specific product by category and ID
 */
router.get("/:category/:id", async (req, res) => {
  try {
    const { category, id } = req.params;
    
    // Validate category
    const validCategories = ["altars", "deities", "sculptures", "custom", "furniture"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      });
    }

    const jsonKey = `products/${category}.json`;
    const data = await getJsonFromR2(jsonKey);

    if (!data || !data.products[id]) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = data.products[id];

    // Transform product data for response
    const productResponse = {
      ...product,
      images: Array.isArray(product.images) 
        ? product.images 
        : (product.image 
            ? [{ url: product.image, size: product.imageSize, mimetype: product.imageType }] 
            : []),
      hasModel: !!product.model,
      hasVideo: !!product.video,
      imageCount: Array.isArray(product.images) 
        ? product.images.length 
        : (product.image ? 1 : 0),
    };

    res.json({
      success: true,
      product: productResponse,
    });
  } catch (err) {
    console.error(`Error fetching product ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

/**
 * 🌍 GET /products/subcategory/:category/:subCategory
 * Fetch products by category and subcategory with pagination
 * This is a dedicated endpoint for subcategory filtering
 */
router.get("/subcategory/:category/:subCategory", async (req, res) => {
  try {
    const { category, subCategory } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Default 10 for subcategory view
    
    // Validate category
    const validCategories = ["altars", "deities", "sculptures", "custom", "furniture"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      });
    }

    const jsonKey = `products/${category}.json`;
    const data = await getJsonFromR2(jsonKey);

    if (!data) {
      return res.json({
        success: true,
        category,
        subCategory,
        products: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_products: 0,
          per_page: limit,
          has_next: false,
          has_prev: false,
        }
      });
    }

    // Filter by subcategory
    const productsArray = Object.values(data.products || {})
      .filter(p => p.subCategory === subCategory)
      .map((p) => ({
        ...p,
        images: Array.isArray(p.images) 
          ? p.images 
          : (p.image ? [{ url: p.image, size: p.imageSize, mimetype: p.imageType }] : []),
        hasModel: !!p.model,
        hasVideo: !!p.video,
      }));

    // Calculate pagination
    const totalProducts = productsArray.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = productsArray.slice(startIndex, endIndex);

    res.json({
      success: true,
      category,
      subCategory,
      products: paginatedProducts,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_products: totalProducts,
        per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      last_updated: data.last_updated,
    });
  } catch (err) {
    console.error(`Error fetching products for subcategory:`, err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

module.exports = router;