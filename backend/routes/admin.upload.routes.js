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

/**
 * 🔐 POST /admin/upload
 * Upload product with optional GLB model, 1-5 images, optional video, subcategory, and altar specifications
 * ✅ UPDATED: Now supports subcategories and altar specifications
 */
router.post(
  "/upload",
  auth,
  upload.fields([
    { name: "model", maxCount: 1 },
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("📦 Admin upload request received");

      const { 
        name, 
        price, 
        description, 
        category, 
        subCategory,
        includeModel,
        altarSize,      // ✅ NEW: Altar size
        altarDesign     // ✅ NEW: Altar design
      } = req.body;
      
      const modelFile = req.files?.model?.[0];
      const imageFiles = req.files?.images || [];
      const videoFile = req.files?.video?.[0];

      console.log("Body:", req.body);
      console.log("Files:", req.files);

      // Validate required fields
      if (!name || !price || !category) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, price, and category are required",
        });
      }

      // Validate that at least one image is provided
      if (imageFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one image is required",
        });
      }

      // Validate category
      const validCategories = ["altars", "deities", "sculptures", "Laser_Engravings", "furniture", "tulsi_table_vyasasna","mridanga_stand","Prabhupada_altars","temple_altar"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        });
      }

      // ✅ NEW: Validate altar specifications if category is altars
      if (category === "altars") {
        if (!altarSize || !altarDesign) {
          return res.status(400).json({
            success: false,
            message: "Altar size and design are required for altar products",
          });
        }
      }

      // Validate price
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number",
        });
      }

      // Check if user wants to include model
      const shouldIncludeModel = includeModel === "true" || includeModel === true;

      // Upload model to R2 if provided and checkbox is checked
      let modelResult = null;
      if (shouldIncludeModel && modelFile) {
        console.log("📦 Uploading 3D model...");
        modelResult = await uploadToR2(modelFile, category);
      }

      // Upload all images
      console.log(`📸 Uploading ${imageFiles.length} images...`);
      const imageResults = [];
      for (const imageFile of imageFiles) {
        const result = await uploadToR2(imageFile, category);
        imageResults.push({
          url: result.url,
          size: result.size,
          mimetype: result.mimetype,
        });
      }

      // Upload video if provided
      let videoResult = null;
      if (videoFile) {
        console.log("🎥 Uploading video...");
        videoResult = await uploadToR2(videoFile, category);
      }

      // Load existing category JSON
      const jsonKey = `products/${category}.json`;
      let data = await getJsonFromR2(jsonKey);

      if (!data) {
        data = {
          category,
          last_updated: null,
          total_products: 0,
          products: {},
        };
      }

      // Generate product ID
      const productId = `${category.toUpperCase()}-${Date.now()}`;

      // Build product object
      const productData = {
        id: productId,
        name: name.trim(),
        price: parsedPrice,
        description: description?.trim() || "",
        category,
        subCategory: subCategory || null,
        images: imageResults,
        hasModel: !!modelResult,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // ✅ NEW: Add altar specifications if category is altars
      if (category === "altars") {
        productData.altarSize = altarSize;
        productData.altarDesign = altarDesign;
      }

      // Add model data if it was uploaded
      if (modelResult) {
        productData.model = modelResult.url;
        productData.modelSize = modelResult.size;
        productData.modelType = modelResult.mimetype;
      }

      // Add video data if it was uploaded
      if (videoResult) {
        productData.video = videoResult.url;
        productData.videoSize = videoResult.size;
        productData.videoType = videoResult.mimetype;
      }

      // Add product
      data.products[productId] = productData;

      data.last_updated = new Date().toISOString();
      data.total_products = Object.keys(data.products).length;

      // Save JSON back to R2
      await putJsonToR2(jsonKey, data);

      console.log("✅ Product uploaded successfully:", productId);
      console.log("   Category:", category);
      console.log("   SubCategory:", subCategory || "None");
      if (category === "altars") {
        console.log("   Altar Size:", altarSize);
        console.log("   Altar Design:", altarDesign);
      }

      res.status(201).json({
        success: true,
        message: "Product uploaded successfully",
        product: data.products[productId],
      });
    } catch (err) {
      console.error("❌ Admin upload error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Upload failed",
      });
    }
  }
);

/**
 * 🔐 PUT /admin/products/:category/:id
 * Update product (supports category change, subcategory, and altar specifications)
 * ✅ UPDATED: Now supports altar specifications
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
        altarSize,      // ✅ NEW: Altar size
        altarDesign     // ✅ NEW: Altar design
      } = req.body;

      console.log("📝 Update request:", { category, id, newCategory, altarSize, altarDesign });

      const modelFile = req.files?.model?.[0];
      const imageFiles = req.files?.images || [];
      const videoFile = req.files?.video?.[0];

      // Determine which category to work with
      const targetCategory = newCategory || category;
      const isCategoryChange = newCategory && newCategory !== category;

      // ✅ NEW: Validate altar specifications if target category is altars
      if (targetCategory === "altars") {
        if (!altarSize || !altarDesign) {
          return res.status(400).json({
            success: false,
            message: "Altar size and design are required for altar products",
          });
        }
      }

      // Load source category JSON
      const sourceJsonKey = `products/${category}.json`;
      let sourceData = await getJsonFromR2(sourceJsonKey);

      if (!sourceData || !sourceData.products[id]) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      let product = sourceData.products[id];

      // Update basic fields
      if (name) product.name = name.trim();
      if (price !== undefined) product.price = parseFloat(price);
      if (description !== undefined) product.description = description.trim();
      if (subCategory !== undefined) product.subCategory = subCategory || null;

      // ✅ NEW: Update altar specifications
      if (targetCategory === "altars") {
        product.altarSize = altarSize;
        product.altarDesign = altarDesign;
      } else {
        // Remove altar specifications if moving away from altars category
        delete product.altarSize;
        delete product.altarDesign;
      }

      // Handle model removal
      if (removeModel === "true") {
        if (product.model) {
          await deleteFromR2(product.model);
          delete product.model;
          delete product.modelSize;
          delete product.modelType;
          product.hasModel = false;
        }
      }

      // Handle model upload
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

      // Handle video removal
      if (removeVideo === "true") {
        if (product.video) {
          await deleteFromR2(product.video);
          delete product.video;
          delete product.videoSize;
          delete product.videoType;
        }
      }

      // Handle video upload
      if (videoFile) {
        if (product.video) {
          await deleteFromR2(product.video);
        }
        const videoResult = await uploadToR2(videoFile, targetCategory);
        product.video = videoResult.url;
        product.videoSize = videoResult.size;
        product.videoType = videoResult.mimetype;
      }

      // Handle images
      if (imageFiles.length > 0) {
        if (replaceImages === "true") {
          // Delete old images
          for (const img of product.images) {
            await deleteFromR2(img.url);
          }
          product.images = [];
        }

        // Upload new images
        for (const imageFile of imageFiles) {
          const result = await uploadToR2(imageFile, targetCategory);
          product.images.push({
            url: result.url,
            size: result.size,
            mimetype: result.mimetype,
          });
        }
      }

      // Update ready stock
      let readyStockData = null;
      if (inReadyStock === "true") {
        const qty = parseInt(readyStockQuantity) || 0;
        if (qty > 0) {
          readyStockData = {
            inStock: true,
            quantity: qty,
            lastUpdated: new Date().toISOString(),
          };

          const readyStockKey = `ready_stock/${targetCategory}.json`;
          let stockData = await getJsonFromR2(readyStockKey);
          if (!stockData) {
            stockData = { category: targetCategory, products: {} };
          }
          stockData.products[id] = {
            productId: id,
            quantity: qty,
            addedAt: new Date().toISOString(),
          };
          await putJsonToR2(readyStockKey, stockData);
        }
      } else {
        const readyStockKey = `ready_stock/${targetCategory}.json`;
        let stockData = await getJsonFromR2(readyStockKey);
        if (stockData?.products?.[id]) {
          delete stockData.products[id];
          await putJsonToR2(readyStockKey, stockData);
        }
      }

      product.updated_at = new Date().toISOString();

      // Handle category change
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

      res.json({
        success: true,
        message: "Product updated successfully",
        product,
        readyStock: readyStockData,
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

    const readyStockKey = `ready_stock/${category}.json`;
    const stockData = await getJsonFromR2(readyStockKey);
    const stockInfo = stockData?.products?.[id];

    res.json({
      success: true,
      product,
      readyStock: {
        inReadyStock: !!stockInfo,
        quantity: stockInfo?.quantity || 0,
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
 * Delete product and associated files
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

    // Delete model file if exists
    if (product.model) {
      console.log("🗑️ Deleting model file...");
      await deleteFromR2(product.model);
    }

    // Delete video file if exists
    if (product.video) {
      console.log("🗑️ Deleting video file...");
      await deleteFromR2(product.video);
    }

    // Delete all image files
    if (product.images && Array.isArray(product.images)) {
      console.log(`🗑️ Deleting ${product.images.length} images...`);
      for (const image of product.images) {
        await deleteFromR2(image.url);
      }
    }

    // Remove from ready stock if exists
    const readyStockKey = `ready_stock/${category}.json`;
    const stockData = await getJsonFromR2(readyStockKey);
    if (stockData?.products?.[id]) {
      delete stockData.products[id];
      await putJsonToR2(readyStockKey, stockData);
    }

    // Remove product
    delete data.products[id];

    data.last_updated = new Date().toISOString();
    data.total_products = Object.keys(data.products).length;

    // Save updated JSON
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
      message: "Failed to delete product",
    });
  }
});

/**
 * 🔐 GET /admin/test-json/:category
 */
router.get("/test-json/:category", auth, async (req, res) => {
  const { category } = req.params;

  const testData = {
    category,
    last_updated: new Date().toISOString(),
    total_products: 0,
    products: {},
  };

  const jsonKey = `products/${category}.json`;
  await putJsonToR2(jsonKey, testData);

  res.json({
    success: true,
    message: `Test JSON created for ${category}`,
  });
});

module.exports = router;