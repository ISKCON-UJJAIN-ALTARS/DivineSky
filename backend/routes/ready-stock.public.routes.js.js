const express = require("express");
const { getJsonFromR2 } = require("../services/r2.service");

const router = express.Router();

/**
 * 🌍 GET /ready-stock
 * Get all ready stock products (Public - no auth required)
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 */
router.get("/ready-stock", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const readyStockKey = "products/ready-stock.json";
    const readyStockData = await getJsonFromR2(readyStockKey);

    if (!readyStockData) {
      return res.json({
        success: true,
        products: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_products: 0,
          per_page: limit,
          has_next: false,
          has_prev: false,
        },
      });
    }

    // Filter out products with 0 quantity
    const productsArray = Object.values(readyStockData.products || {})
      .filter(p => p.quantity > 0)
      .map(p => ({
        ...p,
        inStock: true,
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
      products: paginatedProducts,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_products: totalProducts,
        per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      last_updated: readyStockData.last_updated,
    });
  } catch (err) {
    console.error("Get ready stock error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ready stock",
    });
  }
});

/**
 * 🌍 GET /ready-stock/:id
 * Get a specific ready stock product
 */
router.get("/ready-stock/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const readyStockKey = "products/ready-stock.json";
    const readyStockData = await getJsonFromR2(readyStockKey);

    if (!readyStockData || !readyStockData.products[id]) {
      return res.status(404).json({
        success: false,
        message: "Product not found in ready stock",
      });
    }

    const product = readyStockData.products[id];

    // Check if in stock
    if (product.quantity <= 0) {
      return res.status(404).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    res.json({
      success: true,
      product: {
        ...product,
        inStock: true,
        hasModel: !!product.model,
        hasVideo: !!product.video,
      },
    });
  } catch (err) {
    console.error("Get ready stock product error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

module.exports = router;