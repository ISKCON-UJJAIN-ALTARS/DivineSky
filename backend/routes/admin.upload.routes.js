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
 * Upload product with optional GLB model, 1-5 images, optional video, and subcategory
 * ✅ UPDATED: Now supports subcategories
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
        subCategory,  // ✅ NEW: Subcategory field
        includeModel 
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
      const validCategories = ["altars", "deities", "sculptures", "custom", "furniture", "tulsi_table_vyasasna","mridanga_stand","SP_altar","temple_altar"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        });
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
        subCategory: subCategory || null,  // ✅ NEW: Store subcategory
        images: imageResults,
        hasModel: !!modelResult,  // ✅ Add hasModel flag
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

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