const express = require("express");
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth");
const {
  uploadToR2,
  getJsonFromR2,
  putJsonToR2,
} = require("../services/r2.service");

const router = express.Router();

/**
 * 🔐 POST /admin/upload
 * Upload product with optional GLB model, 1-5 images, optional video, subcategory, and altar specifications
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
        altarSize,
        altarDesign,
        isHidden,
        hidePrice
      } = req.body;

      const modelFile = req.files?.model?.[0];
      const imageFiles = req.files?.images || [];
      const videoFile = req.files?.video?.[0];

      console.log("Body:", req.body);
      console.log("Files:", req.files);

      if (!name || !price || !category) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, price, and category are required",
        });
      }

      if (imageFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one image is required",
        });
      }

      const validCategories = ["altars", "deities", "sculptures", "Laser_Engravings", "furniture", "tulsi_table_vyasasna", "mridanga_stand", "Prabhupada_altars", "temple_altar"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        });
      }

      if (category === "altars") {
        if (!altarSize || !altarDesign) {
          return res.status(400).json({
            success: false,
            message: "Altar size and design are required for altar products",
          });
        }
      }

      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number",
        });
      }

      const shouldIncludeModel = includeModel === "true" || includeModel === true;
      const shouldBeHidden = isHidden === "true" || isHidden === true;
      const shouldHidePrice = hidePrice === "true" || hidePrice === true;

      let modelResult = null;
      if (shouldIncludeModel && modelFile) {
        console.log("📦 Uploading 3D model...");
        modelResult = await uploadToR2(modelFile, category);
      }

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

      let videoResult = null;
      if (videoFile) {
        console.log("🎥 Uploading video...");
        videoResult = await uploadToR2(videoFile, category);
      }

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

      const productId = `${category.toUpperCase()}-${Date.now()}`;

      const productData = {
        id: productId,
        name: name.trim(),
        price: parsedPrice,
        description: description?.trim() || "",
        category,
        subCategory: subCategory || null,
        images: imageResults,
        hasModel: !!modelResult,
        isHidden: shouldBeHidden,
        hidePrice: shouldHidePrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (category === "altars") {
        productData.altarSize = altarSize;
        productData.altarDesign = altarDesign;
      }

      if (modelResult) {
        productData.model = modelResult.url;
        productData.modelSize = modelResult.size;
        productData.modelType = modelResult.mimetype;
      }

      if (videoResult) {
        productData.video = videoResult.url;
        productData.videoSize = videoResult.size;
        productData.videoType = videoResult.mimetype;
      }

      data.products[productId] = productData;
      data.last_updated = new Date().toISOString();
      data.total_products = Object.keys(data.products).length;

      await putJsonToR2(jsonKey, data);

      console.log("✅ Product uploaded successfully:", productId);

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