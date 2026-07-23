const express = require("express");
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/auth");
const {
  uploadToR2,
  getJsonFromR2,
  putJsonToR2,
} = require("../services/r2.service");

const router = express.Router();

const MOST_SELLING_KEY = "products/most-selling.json";

/**
 * 🔐 POST /admin/upload
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
        hidePrice,
        mostSelling,
      } = req.body;

      const modelFile = req.files?.model?.[0];
      const imageFiles = req.files?.images || [];
      const videoFile = req.files?.video?.[0];

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

      const validCategories = [
        "altars", "deities", "sculptures", "Laser_Engravings", "gifts",
        "furniture", "tulsi_table_vyasasna", "mridanga_stand",
        "Prabhupada_altars", "temple_altar",
      ];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        });
      }

      if (category === "altars" && (!altarSize || !altarDesign)) {
        return res.status(400).json({
          success: false,
          message: "Altar size and design are required for altar products",
        });
      }

      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a positive number",
        });
      }

      const shouldIncludeModel  = includeModel  === "true" || includeModel  === true;
      const shouldBeHidden      = isHidden      === "true" || isHidden      === true;
      const shouldHidePrice     = hidePrice     === "true" || hidePrice     === true;
      const shouldBeMostSelling = mostSelling   === "true" || mostSelling   === true;

      // ── Upload model ───────────────────────────────────────────
      let modelResult = null;
      if (shouldIncludeModel && modelFile) {
        modelResult = await uploadToR2(modelFile, category);
      }

      // ── Upload images ──────────────────────────────────────────
      const imageResults = [];
      for (const imageFile of imageFiles) {
        const result = await uploadToR2(imageFile, category);
        imageResults.push({ url: result.url, size: result.size, mimetype: result.mimetype });
      }

      // ── Upload video ───────────────────────────────────────────
      let videoResult = null;
      if (videoFile) {
        videoResult = await uploadToR2(videoFile, category);
      }

      // ── Build product object ───────────────────────────────────
      const jsonKey = `products/${category}.json`;
      let data = await getJsonFromR2(jsonKey) || {
        category,
        last_updated: null,
        total_products: 0,
        products: {},
      };

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
        mostSelling: shouldBeMostSelling,
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

      // ── Save to category JSON ──────────────────────────────────
      data.products[productId] = productData;
      data.last_updated = new Date().toISOString();
      data.total_products = Object.keys(data.products).length;
      await putJsonToR2(jsonKey, data);

      // ── Add to most-selling JSON if checked ────────────────────
      if (shouldBeMostSelling) {
        let mostSellingData = await getJsonFromR2(MOST_SELLING_KEY) || {
          products: {},
          last_updated: new Date().toISOString(),
        };

        mostSellingData.products[productId] = {
          ...productData,
          addedToMostSelling: new Date().toISOString(),
        };
        mostSellingData.last_updated = new Date().toISOString();
        await putJsonToR2(MOST_SELLING_KEY, mostSellingData);
        console.log("✅ Product added to most selling");
      }

      console.log("✅ Product uploaded successfully:", productId);

      res.status(201).json({
        success: true,
        message: "Product uploaded successfully",
        product: productData,
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
  await putJsonToR2(`products/${category}.json`, testData);
  res.json({ success: true, message: `Test JSON created for ${category}` });
});

module.exports = router;