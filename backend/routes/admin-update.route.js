const express = require("express");
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth");
const {
  uploadToR2,
  getJsonFromR2,
  putJsonToR2,
  deleteFromR2,
} = require("../services/r2.service");

const router = express.Router();

const READY_STOCK_KEY = "products/ready-stock.json";
const MOST_SELLING_KEY = "products/most-selling.json";

/**
 * 🔐 PUT /admin/products/:category/:id
 */
router.put(
  "/products/:category/:id",
  auth,
  upload.fields([
    { name: "model", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { category, id } = req.params;
      const {
        name,
        price,
        description,
        subCategory,
        newCategory,
        replaceImages,
        includeModel,
        removeModel,
        removeVideo,
        mostSelling,
        inReadyStock,
        readyStockQuantity,
        altarSize,
        altarDesign,
        isHidden,
        hidePrice,
      } = req.body;

      const modelFile = req.files?.model?.[0];
      const imageFiles = req.files?.images || [];
      const videoFile = req.files?.video?.[0];

      const targetCategory = newCategory || category;
      const isCategoryChange = newCategory && newCategory !== category;

      if (targetCategory === "altars" && (!altarSize || !altarDesign)) {
        return res.status(400).json({
          success: false,
          message: "Altar size and design are required for altar products",
        });
      }

      const sourceJsonKey = `products/${category}.json`;
      let sourceData = await getJsonFromR2(sourceJsonKey);

      if (!sourceData || !sourceData.products[id]) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      let product = sourceData.products[id];

      if (name) product.name = name.trim();
      if (price !== undefined) product.price = parseFloat(price);
      if (description !== undefined) product.description = description.trim();
      if (subCategory !== undefined) product.subCategory = subCategory || null;
      if (isHidden !== undefined) product.isHidden = isHidden === "true" || isHidden === true;
      if (hidePrice !== undefined) product.hidePrice = hidePrice === "true" || hidePrice === true;
      if (mostSelling !== undefined) product.mostSelling = mostSelling === "true" || mostSelling === true;

      if (targetCategory === "altars") {
        product.altarSize = altarSize;
        product.altarDesign = altarDesign;
      } else {
        delete product.altarSize;
        delete product.altarDesign;
      }

      // ── Model ──────────────────────────────────────────────────
      if (removeModel === "true" && product.model) {
        await deleteFromR2(product.model);
        delete product.model;
        delete product.modelSize;
        delete product.modelType;
        product.hasModel = false;
      }

      if (includeModel === "true" && modelFile) {
        if (product.model) await deleteFromR2(product.model);
        const modelResult = await uploadToR2(modelFile, targetCategory);
        product.model = modelResult.url;
        product.modelSize = modelResult.size;
        product.modelType = modelResult.mimetype;
        product.hasModel = true;
      }

      // ── Video ──────────────────────────────────────────────────
      if (removeVideo === "true" && product.video) {
        await deleteFromR2(product.video);
        delete product.video;
        delete product.videoSize;
        delete product.videoType;
      }

      if (videoFile) {
        if (product.video) await deleteFromR2(product.video);
        const videoResult = await uploadToR2(videoFile, targetCategory);
        product.video = videoResult.url;
        product.videoSize = videoResult.size;
        product.videoType = videoResult.mimetype;
      }

      // ── Images ─────────────────────────────────────────────────
      if (imageFiles.length > 0) {
        if (replaceImages === "true") {
          for (const img of product.images || []) await deleteFromR2(img.url);
          product.images = [];
        }
        for (const imageFile of imageFiles) {
          const result = await uploadToR2(imageFile, targetCategory);
          product.images.push({ url: result.url, size: result.size, mimetype: result.mimetype });
        }
      }

      product.updated_at = new Date().toISOString();

      // ── Category change / save ─────────────────────────────────
      if (isCategoryChange) {
        product.category = targetCategory;
        const targetJsonKey = `products/${targetCategory}.json`;
        let targetData = await getJsonFromR2(targetJsonKey) || {
          category: targetCategory,
          last_updated: null,
          total_products: 0,
          products: {},
        };
        targetData.products[id] = product;
        targetData.last_updated = new Date().toISOString();
        targetData.total_products = Object.keys(targetData.products).length;

        delete sourceData.products[id];
        sourceData.last_updated = new Date().toISOString();
        sourceData.total_products = Object.keys(sourceData.products).length;

        await putJsonToR2(targetJsonKey, targetData);
        await putJsonToR2(sourceJsonKey, sourceData);
      } else {
        sourceData.products[id] = product;
        sourceData.last_updated = new Date().toISOString();
        await putJsonToR2(sourceJsonKey, sourceData);
      }

      // ── Ready Stock ────────────────────────────────────────────
      let readyStockData = await getJsonFromR2(READY_STOCK_KEY) || {
        products: {},
        last_updated: new Date().toISOString(),
      };

      const wasInReadyStock = readyStockData.products[id] !== undefined;
      const shouldBeInReadyStock = inReadyStock === "true" || inReadyStock === true;
      let readyStockResponse = { inStock: false };

      if (shouldBeInReadyStock) {
        const qty = parseInt(readyStockQuantity) || 0;
        if (qty <= 0) {
          return res.status(400).json({
            success: false,
            message: "Ready stock quantity must be greater than 0",
          });
        }
        readyStockData.products[id] = {
          ...product,
          quantity: qty,
          addedToStock: wasInReadyStock
            ? readyStockData.products[id].addedToStock
            : new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        readyStockData.last_updated = new Date().toISOString();
        await putJsonToR2(READY_STOCK_KEY, readyStockData);
        readyStockResponse = { inStock: true, quantity: qty };
      } else if (wasInReadyStock) {
        delete readyStockData.products[id];
        readyStockData.last_updated = new Date().toISOString();
        await putJsonToR2(READY_STOCK_KEY, readyStockData);
      }

      // ── Most Selling ───────────────────────────────────────────
      let mostSellingData = await getJsonFromR2(MOST_SELLING_KEY) || {
        products: {},
        last_updated: new Date().toISOString(),
      };

      const wasInMostSelling = mostSellingData.products[id] !== undefined;
      const shouldBeInMostSelling = mostSelling === "true" || mostSelling === true;

      if (shouldBeInMostSelling && !wasInMostSelling) {
        mostSellingData.products[id] = {
          ...product,
          addedToMostSelling: new Date().toISOString(),
        };
        mostSellingData.last_updated = new Date().toISOString();
        await putJsonToR2(MOST_SELLING_KEY, mostSellingData);
        console.log("✅ Product added to most selling");
      } else if (shouldBeInMostSelling && wasInMostSelling) {
        // Keep in most selling but refresh the product data
        mostSellingData.products[id] = {
          ...product,
          addedToMostSelling: mostSellingData.products[id].addedToMostSelling,
          lastUpdated: new Date().toISOString(),
        };
        mostSellingData.last_updated = new Date().toISOString();
        await putJsonToR2(MOST_SELLING_KEY, mostSellingData);
      } else if (!shouldBeInMostSelling && wasInMostSelling) {
        delete mostSellingData.products[id];
        mostSellingData.last_updated = new Date().toISOString();
        await putJsonToR2(MOST_SELLING_KEY, mostSellingData);
        console.log("✅ Product removed from most selling");
      }

      res.json({
        success: true,
        message: isCategoryChange
          ? `Product moved to ${targetCategory} and updated successfully`
          : "Product updated successfully",
        product,
        readyStock: readyStockResponse,
        mostSelling: shouldBeInMostSelling,
        newCategory: isCategoryChange ? targetCategory : null,
      });
    } catch (err) {
      console.error("❌ Update error:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to update product" });
    }
  }
);

/**
 * 🔐 GET /admin/products/:category/:id
 */
router.get("/products/:category/:id", auth, async (req, res) => {
  try {
    const { category, id } = req.params;

    const data = await getJsonFromR2(`products/${category}.json`);
    if (!data || !data.products[id]) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = data.products[id];

    const [readyStockData, mostSellingData] = await Promise.all([
      getJsonFromR2(READY_STOCK_KEY),
      getJsonFromR2(MOST_SELLING_KEY),
    ]);

    const stockInfo = readyStockData?.products?.[id];
    const isInMostSelling = !!mostSellingData?.products?.[id];

    res.json({
      success: true,
      product,
      readyStock: {
        inReadyStock: !!stockInfo,
        quantity: stockInfo?.quantity || 0,
        addedToStock: stockInfo?.addedToStock,
        lastUpdated: stockInfo?.lastUpdated,
      },
      mostSelling: isInMostSelling,
    });
  } catch (err) {
    console.error("❌ Get product error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
});

/**
 * 🔐 PATCH /admin/products/:category/:id/images
 */
router.patch("/products/:category/:id/images", auth, async (req, res) => {
  try {
    const { category, id } = req.params;
    const { imageIndex } = req.body;

    const jsonKey = `products/${category}.json`;
    const data = await getJsonFromR2(jsonKey);

    if (!data || !data.products[id]) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = data.products[id];

    if (!product.images[imageIndex]) {
      return res.status(400).json({ success: false, message: "Image not found" });
    }

    await deleteFromR2(product.images[imageIndex].url);
    product.images.splice(imageIndex, 1);
    product.updated_at = new Date().toISOString();

    data.products[id] = product;
    data.last_updated = new Date().toISOString();
    await putJsonToR2(jsonKey, data);

    res.json({ success: true, message: "Image removed successfully", product });
  } catch (err) {
    console.error("❌ Remove image error:", err);
    res.status(500).json({ success: false, message: "Failed to remove image" });
  }
});

/**
 * 🔐 DELETE /admin/products/:category/:id
 */
router.delete("/products/:category/:id", auth, async (req, res) => {
  try {
    const { category, id } = req.params;

    const jsonKey = `products/${category}.json`;
    const data = await getJsonFromR2(jsonKey);

    if (!data || !data.products[id]) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = data.products[id];

    if (product.model) await deleteFromR2(product.model);
    if (product.video) await deleteFromR2(product.video);
    if (product.images?.length) {
      for (const image of product.images) await deleteFromR2(image.url);
    }

    // Remove from ready stock
    const readyStockData = await getJsonFromR2(READY_STOCK_KEY);
    if (readyStockData?.products?.[id]) {
      delete readyStockData.products[id];
      readyStockData.last_updated = new Date().toISOString();
      await putJsonToR2(READY_STOCK_KEY, readyStockData);
    }

    // Remove from most selling
    const mostSellingData = await getJsonFromR2(MOST_SELLING_KEY);
    if (mostSellingData?.products?.[id]) {
      delete mostSellingData.products[id];
      mostSellingData.last_updated = new Date().toISOString();
      await putJsonToR2(MOST_SELLING_KEY, mostSellingData);
      console.log("✅ Product also removed from most selling");
    }

    delete data.products[id];
    data.last_updated = new Date().toISOString();
    data.total_products = Object.keys(data.products).length;
    await putJsonToR2(jsonKey, data);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Admin delete error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to delete product" });
  }
});

module.exports = router;