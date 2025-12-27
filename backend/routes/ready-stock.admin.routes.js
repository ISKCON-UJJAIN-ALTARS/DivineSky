const express = require("express");
const auth = require("../middleware/auth");
const {
  getJsonFromR2,
  putJsonToR2,
} = require("../services/r2.service");

const router = express.Router();

/**
 * 🔐 POST /admin/ready-stock/add
 * Add a product to ready stock
 */
router.post("/ready-stock/add", auth, async (req, res) => {
  try {
    const { productId, category, quantity } = req.body;

    if (!productId || !category || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID, category, and quantity are required",
      });
    }

    // Get the product details
    const productJsonKey = `products/${category}.json`;
    const productData = await getJsonFromR2(productJsonKey);

    if (!productData || !productData.products[productId]) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = productData.products[productId];

    // Load ready stock data
    const readyStockKey = "products/ready-stock.json";
    let readyStockData = await getJsonFromR2(readyStockKey);

    if (!readyStockData) {
      readyStockData = {
        products: {},
        last_updated: new Date().toISOString(),
      };
    }

    // Check if product already in ready stock
    if (readyStockData.products[productId]) {
      return res.status(400).json({
        success: false,
        message: "Product already in ready stock. Use update endpoint to change quantity.",
      });
    }

    // Add to ready stock
    readyStockData.products[productId] = {
      ...product,
      quantity: parseInt(quantity),
      addedToStock: new Date().toISOString(),
    };

    readyStockData.last_updated = new Date().toISOString();
    await putJsonToR2(readyStockKey, readyStockData);

    res.json({
      success: true,
      message: "Product added to ready stock",
      product: readyStockData.products[productId],
    });
  } catch (err) {
    console.error("Add to ready stock error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add to ready stock",
    });
  }
});

/**
 * 🔐 PUT /admin/ready-stock/update/:productId
 * Update quantity of a product in ready stock
 */
router.put("/ready-stock/update/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const readyStockKey = "products/ready-stock.json";
    let readyStockData = await getJsonFromR2(readyStockKey);

    if (!readyStockData || !readyStockData.products[productId]) {
      return res.status(404).json({
        success: false,
        message: "Product not found in ready stock",
      });
    }

    // Update quantity
    readyStockData.products[productId].quantity = parseInt(quantity);
    readyStockData.products[productId].lastUpdated = new Date().toISOString();
    readyStockData.last_updated = new Date().toISOString();

    await putJsonToR2(readyStockKey, readyStockData);

    res.json({
      success: true,
      message: "Ready stock quantity updated",
      product: readyStockData.products[productId],
    });
  } catch (err) {
    console.error("Update ready stock error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update ready stock",
    });
  }
});

/**
 * 🔐 DELETE /admin/ready-stock/remove/:productId
 * Remove a product from ready stock
 */
router.delete("/ready-stock/remove/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const readyStockKey = "products/ready-stock.json";
    let readyStockData = await getJsonFromR2(readyStockKey);

    if (!readyStockData || !readyStockData.products[productId]) {
      return res.status(404).json({
        success: false,
        message: "Product not found in ready stock",
      });
    }

    delete readyStockData.products[productId];
    readyStockData.last_updated = new Date().toISOString();

    await putJsonToR2(readyStockKey, readyStockData);

    res.json({
      success: true,
      message: "Product removed from ready stock",
    });
  } catch (err) {
    console.error("Remove from ready stock error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to remove from ready stock",
    });
  }
});

/**
 * 🔐 GET /admin/ready-stock
 * Get all ready stock products (Admin)
 */
router.get("/ready-stock", auth, async (req, res) => {
  try {
    const readyStockKey = "products/ready-stock.json";
    const readyStockData = await getJsonFromR2(readyStockKey);

    if (!readyStockData) {
      return res.json({
        success: true,
        products: [],
        total: 0,
      });
    }

    const products = Object.values(readyStockData.products || {});

    res.json({
      success: true,
      products,
      total: products.length,
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

module.exports = router;