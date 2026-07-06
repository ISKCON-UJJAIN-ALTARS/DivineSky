const express = require("express");
const { getJsonFromR2 } = require("../services/r2.service");
const optionalAuth = require("../middleware/optionalAuth.middleware");

const router = express.Router();

const READY_STOCK_KEY = "products/ready-stock.json";
const MOST_SELLING_KEY = "products/most-selling.json";

const VALID_CATEGORIES = [
  "altars", "deities", "sculptures", "Laser_Engravings",
  "furniture", "tulsi_table_vyasasna", "mridanga_stand",
  "Prabhupada_altars", "temple_altar",
];

const normalizeProduct = (p, category) => ({
  ...p,
  category: p.category || category,
  images: Array.isArray(p.images)
    ? p.images
    : p.image ? [{ url: p.image, size: p.imageSize, mimetype: p.imageType }] : [],
  hasModel: !!p.model,
  hasVideo: !!p.video,
  isHidden: !!p.isHidden,
  hidePrice: !!p.hidePrice,
});

router.use(optionalAuth);

/**
 * 🌍 GET /products
 * All products from all categories with pagination
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const subCategory = req.query.subCategory || "";

    const allProducts = [];

    for (const category of VALID_CATEGORIES) {
      const data = await getJsonFromR2(`products/${category}.json`);
      if (data?.products) {
        allProducts.push(
          ...Object.values(data.products)
            .filter((p) => req.isAdmin || !p.isHidden)
            .map((p) => normalizeProduct(p, category))
        );
      }
    }

    let filtered = subCategory
      ? allProducts.filter((p) => p.subCategory === subCategory)
      : allProducts;

    const total = filtered.length;
    const start = (page - 1) * limit;

    res.json({
      success: true,
      products: filtered.slice(start, start + limit),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_products: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching all products:", err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

/**
 * 🌍 GET /products/ready-stock
 * Publicly available ready stock products
 */
router.get("/ready-stock", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const data = await getJsonFromR2(READY_STOCK_KEY);

    if (!data) {
      return res.json({ success: true, products: [], total: 0 });
    }

    const products = Object.values(data.products || {})
      .filter((p) => req.isAdmin || !p.isHidden)
      .map((p) => normalizeProduct(p, p.category));

    const total = products.length;
    const start = (page - 1) * limit;

    res.json({
      success: true,
      products: products.slice(start, start + limit),
      total,
      last_updated: data.last_updated,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching ready stock:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ready stock" });
  }
});

/**
 * 🌍 GET /products/most-selling
 * Publicly available most selling products
 */
router.get("/most-selling", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const data = await getJsonFromR2(MOST_SELLING_KEY);

    if (!data) {
      return res.json({ success: true, products: [], total: 0 });
    }

    const products = Object.values(data.products || {})
      .filter((p) => req.isAdmin || !p.isHidden)
      .map((p) => normalizeProduct(p, p.category));

    const total = products.length;
    const start = (page - 1) * limit;

    res.json({
      success: true,
      products: products.slice(start, start + limit),
      total,
      last_updated: data.last_updated,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching most selling:", err);
    res.status(500).json({ success: false, message: "Failed to fetch most selling products" });
  }
});

/**
 * 🌍 GET /products/subcategory/:category/:subCategory
 */
router.get("/subcategory/:category/:subCategory", async (req, res) => {
  try {
    const { category, subCategory } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const data = await getJsonFromR2(`products/${category}.json`);

    if (!data) {
      return res.json({
        success: true, category, subCategory, products: [],
        pagination: { current_page: 1, total_pages: 0, total_products: 0, per_page: limit, has_next: false, has_prev: false },
      });
    }

    const products = Object.values(data.products || {})
      .filter((p) => p.subCategory === subCategory && (req.isAdmin || !p.isHidden))
      .map((p) => normalizeProduct(p, category));

    const total = products.length;
    const start = (page - 1) * limit;

    res.json({
      success: true,
      category,
      subCategory,
      products: products.slice(start, start + limit),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_products: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
      last_updated: data.last_updated,
    });
  } catch (err) {
    console.error("Error fetching products for subcategory:", err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

/**
 * 🌍 GET /products/:category
 */
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const subCategory = req.query.subCategory || "";

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const data = await getJsonFromR2(`products/${category}.json`);

    if (!data) {
      return res.json({
        success: true, category, products: [],
        pagination: { current_page: 1, total_pages: 0, total_products: 0, per_page: limit, has_next: false, has_prev: false },
      });
    }

    let products = Object.values(data.products || {})
      .filter((p) => req.isAdmin || !p.isHidden)
      .map((p) => normalizeProduct(p, category));

    if (subCategory) {
      products = products.filter((p) => p.subCategory === subCategory);
    }

    const total = products.length;
    const start = (page - 1) * limit;

    res.json({
      success: true,
      category,
      products: products.slice(start, start + limit),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_products: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
      last_updated: data.last_updated,
    });
  } catch (err) {
    console.error(`Error fetching products for category ${req.params.category}:`, err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

/**
 * 🌍 GET /products/:category/:id
 */
router.get("/:category/:id", async (req, res) => {
  try {
    const { category, id } = req.params;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const data = await getJsonFromR2(`products/${category}.json`);

    if (!data || !data.products[id]) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = data.products[id];

    if (product.isHidden && !req.isAdmin) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const normalized = normalizeProduct(product, category);

    res.json({
      success: true,
      product: {
        ...normalized,
        imageCount: normalized.images.length,
      },
    });
  } catch (err) {
    console.error(`Error fetching product ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
});

module.exports = router;