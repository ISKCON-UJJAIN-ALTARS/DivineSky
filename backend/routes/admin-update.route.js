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

/**
 * 🔐 PUT /admin/products/:category/:id
 * Update product (supports category change, subcategory, altar specifications, isHidden, ready stock)
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
        inReadyStock,
        readyStockQuantity,
        altarSize,
        altarDesign,
        isHidden,
        hidePrice
      } = req.body;

      console.log("=== UPDATE PRODUCT REQUEST ===", { category, id, newCategory, altarSize, altarDesign, isHidden, hidePrice, inReadyStock, readyStockQuantity });

      const modelFile = req.files?.model?.[0];
      const imageFiles = req.files?.images || [];
      const videoFile = req.files?.video?.[0];

      const targetCategory = newCategory || category;
      const isCategoryChange = newCategory && newCategory !== category;

      if (targetCategory === "altars") {
        if (!altarSize || !altarDesign) {
          return res.status(400).json({
            success: false,
            message: "Altar size and design are required for altar products",
          });
        }
      }

      const sourceJsonKey = `products/${category}.json`;
      let sourceData = await getJsonFromR2(sourceJsonKey);

      if (!sourceData || !sourceData.products[id]) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      let product = sourceData.products[id];

      if (name) product.name = name.trim();
      if (price !== undefined) product.price = parseFloat(price);
      if (description !== undefined) product.description = description.trim();
      if (subCategory !== undefined) product.subCategory = subCategory || null;

      if (isHidden !== undefined) {
        product.isHidden = isHidden === "true" || isHidden === true;
      }

      if (hidePrice !== undefined) {
        product.hidePrice = hidePrice === "true" || hidePrice === true;
      }

      if (targetCategory === "altars") {
        product.altarSize = altarSize;
        product.altarDesign = altarDesign;
      } else {
        delete product.altarSize;
        delete product.altarDesign;
      }

      if (removeModel === "true") {
        if (product.model) {
          await deleteFromR2(product.model);
          delete product.model;
          delete product.modelSize;
          delete product.modelType;
          product.hasModel = false;
        }
      }

      if (includeModel === "true" && modelFile) {
        if (product.model) {
          await deleteFromR2(product.model);
        }
        const modelResult = await uploadToR2(modelFile, targetCategory);
        product.model = modelResult.url;
        product.modelSize = modelResult.size;
        product.modelType = modelResult.mimetype;
        product.hasModel = true;
      }

      if (removeVideo === "true") {
        if (product.video) {
          await deleteFromR2(product.video);
          delete product.video;
          delete product.videoSize;
          delete product.videoType;
        }
      }

      if (videoFile) {
        if (product.video) {
          await deleteFromR2(product.video);
        }
        const videoResult = await uploadToR2(videoFile, targetCategory);
        product.video = videoResult.url;
        product.videoSize = videoResult.size;
        product.videoType = videoResult.mimetype;
      }

      if (imageFiles.length > 0) {
        if (replaceImages === "true") {
          for (const img of product.images) {
            await deleteFromR2(img.url);
          }
          product.images = [];
        }

        for (const imageFile of imageFiles) {
          const result = await uploadToR2(imageFile, targetCategory);
          product.images.push({
            url: result.url,
            size: result.size,
            mimetype: result.mimetype,
          });
        }
      }

      product.updated_at = new Date().toISOString();

      // Handle category change / save
      if (isCategoryChange) {
        product.category = targetCategory;

        const targetJsonKey = `products/${targetCategory}.json`;
        let targetData = await getJsonFromR2(targetJsonKey);

        if (!targetData) {
          targetData = {
            category: targetCategory,
            last_updated: null,
            total_products: 0,
            products: {},
          };
        }

        targetData.products[id] = product;
        targetData.last_updated = new Date().toISOString();
        targetData.total_products = Object.keys(targetData.products).length;

        delete sourceData.products[id];
        sourceData.last_updated = new Date().toISOString();
        sourceData.total_products = Object.keys(sourceData.products).length;

        await putJsonToR2(targetJsonKey, targetData);
        await putJsonToR2(sourceJsonKey, sourceData);

        console.log(`✅ Product moved from ${category} to ${targetCategory}`);
      } else {
        sourceData.products[id] = product;
        sourceData.last_updated = new Date().toISOString();
        await putJsonToR2(sourceJsonKey, sourceData);
      }

      // ========================================
      // READY STOCK — unified key used by public route
      // ========================================
      let readyStockData = await getJsonFromR2(READY_STOCK_KEY);
      if (!readyStockData) {
        readyStockData = {
          products: {},
          last_updated: new Date().toISOString(),
        };
      }

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

        console.log(`✅ Product ${wasInReadyStock ? 'updated in' : 'added to'} ready stock with quantity: ${qty}`);
        readyStockResponse = { inStock: true, quantity: qty };
      } else if (wasInReadyStock) {
        delete readyStockData.products[id];
        readyStockData.last_updated = new Date().toISOString();
        await putJsonToR2(READY_STOCK_KEY, readyStockData);
        console.log("✅ Product removed from ready stock");
      }

      res.json({
        success: true,
        message: isCategoryChange
          ? `Product moved to ${targetCategory} and updated successfully`
          : "Product updated successfully",
        product,
        readyStock: readyStockResponse,
        newCategory: isCategoryChange ? targetCategory : null,
      });
    } catch (err) {
      console.error("❌ Update error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to update product",
      });
    }
  }
);

/**
 * 🔐 GET /admin/products/:category/:id
 * Get single product with ready stock info
 */
router.get("/products/:category/:id", auth, async (req, res) => {
  try {
    const { category, id } = req.params;

    const jsonKey = `products/${category}.json`;
    const data = await getJsonFromR2(jsonKey);

    if (!data || !data.products[id]) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = data.products[id];

    const readyStockData = await getJsonFromR2(READY_STOCK_KEY);
    const stockInfo = readyStockData?.products?.[id];

    res.json({
      success: true,
      product,
      readyStock: {
        inReadyStock: !!stockInfo,
        quantity: stockInfo?.quantity || 0,
        addedToStock: stockInfo?.addedToStock,
        lastUpdated: stockInfo?.lastUpdated,
      },
    });
  } catch (err) {
    console.error("❌ Get product error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

/**
 * 🔐 PATCH /admin/products/:category/:id/images
 * Remove a specific image from product
 */
router.patch("/products/:category/:id/images", auth, async (req, res) => {
  try {
    const { category, id } = req.params;
    const { imageIndex } = req.body;

    const jsonKey = `products/${category}.json`;
    const data = await getJsonFromR2(jsonKey);

    if (!data || !data.products[id]) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = data.products[id];

    if (!product.images[imageIndex]) {
      return res.status(400).json({
        success: false,
        message: "Image not found",
      });
    }

    await deleteFromR2(product.images[imageIndex].url);
    product.images.splice(imageIndex, 1);
    product.updated_at = new Date().toISOString();

    data.products[id] = product;
    data.last_updated = new Date().toISOString();

    await putJsonToR2(jsonKey, data);

    res.json({
      success: true,
      message: "Image removed successfully",
      product,
    });
  } catch (err) {
    console.error("❌ Remove image error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to remove image",
    });
  }
});

/**
 * 🔐 DELETE /admin/products/:category/:id
 * Delete product and associated files (also removes from ready stock)
 */
router.delete("/products/:category/:id", auth, async (req, res) => {
  try {
    const { category, id } = req.params;

    const jsonKey = `products/${category}.json`;
    const data = await getJsonFromR2(jsonKey);

    if (!data || !data.products[id]) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = data.products[id];

    if (product.model) {
      console.log("🗑️ Deleting model file...");
      await deleteFromR2(product.model);
    }

    if (product.video) {
      console.log("🗑️ Deleting video file...");
      await deleteFromR2(product.video);
    }

    if (product.images && Array.isArray(product.images)) {
      console.log(`🗑️ Deleting ${product.images.length} images...`);
      for (const image of product.images) {
        await deleteFromR2(image.url);
      }
    }

    const readyStockData = await getJsonFromR2(READY_STOCK_KEY);
    if (readyStockData?.products?.[id]) {
      delete readyStockData.products[id];
      readyStockData.last_updated = new Date().toISOString();
      await putJsonToR2(READY_STOCK_KEY, readyStockData);
      console.log("✅ Product also removed from ready stock");
    }

    delete data.products[id];
    data.last_updated = new Date().toISOString();
    data.total_products = Object.keys(data.products).length;

    await putJsonToR2(jsonKey, data);

    console.log("✅ Product deleted successfully:", id);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("❌ Admin delete error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete product",
    });
  }
});

module.exports = router;