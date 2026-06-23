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
 * 🔐 PUT /admin/products/:category/:id
 * Update existing product - FIXED for category changes + Ready Stock support + Altar Specifications
 * ✅ UPDATED: Now supports altar specifications
 */
router.put(
  "/products/:category/:id",
  auth,
  upload.fields([
    { name: "model", maxCount: 1 },
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { category, id } = req.params;
      const { 
        name, 
        price, 
        description,
        hidden, 
        includeModel, 
        removeModel, 
        removeVideo,
        replaceImages,
        newCategory,
        subCategory,
        // Ready Stock fields
        inReadyStock,
        readyStockQuantity,
        // ✅ NEW: Altar specifications
        altarSize,
        altarDesign
      } = req.body;
      
      console.log("=== UPDATE PRODUCT REQUEST ===");
      console.log("Product ID:", id);
      console.log("Current Category:", category);
      console.log("New Category:", newCategory);
      console.log("Ready Stock:", inReadyStock, "Quantity:", readyStockQuantity);
      console.log("Altar Size:", altarSize);
      console.log("Altar Design:", altarDesign);
      console.log("Request body:", req.body);

      // Check if changing category
      const isChangingCategory = newCategory && newCategory !== category;
      const targetCategory = isChangingCategory ? newCategory : category;
      
      // ✅ NEW: Validate altar specifications if target category is altars
      if (targetCategory === "altars") {
        if (!altarSize || !altarDesign) {
          return res.status(400).json({
            success: false,
            message: "Altar size and design are required for altar products",
          });
        }
      }
      
      // Load existing product data from CURRENT category
      const jsonKey = `products/${category}.json`;
      let data = await getJsonFromR2(jsonKey);

      if (!data || !data.products[id]) {
        return res.status(404).json({
          success: false,
          message: "Product not found in current category",
        });
      }

      const existingProduct = data.products[id];
      const modelFile = req.files?.model?.[0];
      const imageFiles = req.files?.images || [];
      const videoFile = req.files?.video?.[0];

      // ========================================
      // UPDATE TEXT FIELDS - ALWAYS UPDATE
      // ========================================
      
      // ✅ ALWAYS update name
      if (name !== undefined && name.trim() !== "") {
        existingProduct.name = name.trim();
        console.log("Updated name:", existingProduct.name);
      }
      
      // ✅ ALWAYS update price
      if (price !== undefined && price !== "") {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({
            success: false,
            message: "Price must be a valid number",
          });
        }
        existingProduct.price = parsedPrice;
        console.log("Updated price:", existingProduct.price);
      }
      
      // ✅ ALWAYS update description
      if (description !== undefined) {
        existingProduct.description = description.trim();
        console.log("Updated description:", existingProduct.description.substring(0, 50) + "...");
      }

      // ✅ ALWAYS update subcategory
      existingProduct.subCategory = subCategory || null;
      console.log("Updated subcategory:", existingProduct.subCategory);

      // Update hidden status
   // Update hidden status — ONLY change it if explicitly told to
if (hidden === "true") {
  existingProduct.hidden = true;
  console.log("Product explicitly hidden");
} else if (hidden === "false") {
  existingProduct.hidden = false;
  console.log("Product explicitly unhidden");
} else {
  // hidden was not sent at all (undefined) — leave existing value untouched
  console.log("Hidden field not sent — leaving as:", existingProduct.hidden);
}

      // ✅ NEW: Update altar specifications
      if (targetCategory === "altars") {
        existingProduct.altarSize = altarSize;
        existingProduct.altarDesign = altarDesign;
        console.log("Updated altar size:", existingProduct.altarSize);
        console.log("Updated altar design:", existingProduct.altarDesign);
      } else {
        // Remove altar specifications if moving away from altars category
        delete existingProduct.altarSize;
        delete existingProduct.altarDesign;
        console.log("Removed altar specifications (not an altar product)");
      }

      // ✅ Update category field in product object
      if (isChangingCategory) {
        existingProduct.category = newCategory;
        console.log("Updated category in product:", existingProduct.category);
      } else {
        // Ensure category field is correct even when not changing
        existingProduct.category = category;
      }

      // ========================================
      // HANDLE MODEL
      // ========================================
      
      // Remove model
      if (removeModel === "true" && existingProduct.model) {
        console.log("Removing existing model");
        await deleteFromR2(existingProduct.model);
        delete existingProduct.model;
        delete existingProduct.modelSize;
        delete existingProduct.modelType;
        existingProduct.hasModel = false;
      }

      // Upload/Replace model
      if (includeModel === "true" && modelFile) {
        console.log("Uploading new model");
        
        // Delete old model if exists
        if (existingProduct.model) {
          await deleteFromR2(existingProduct.model);
        }

        // Upload to target category
        const uploadCategory = isChangingCategory ? newCategory : category;
        const modelResult = await uploadToR2(modelFile, uploadCategory);
        existingProduct.model = modelResult.url;
        existingProduct.modelSize = modelResult.size;
        existingProduct.modelType = modelResult.mimetype;
        existingProduct.hasModel = true;
      }

      // ========================================
      // HANDLE VIDEO
      // ========================================
      
      // Remove video
      if (removeVideo === "true" && existingProduct.video) {
        console.log("Removing existing video");
        await deleteFromR2(existingProduct.video);
        delete existingProduct.video;
        delete existingProduct.videoSize;
        delete existingProduct.videoType;
      }

      // Upload/Replace video
      if (videoFile) {
        console.log("Uploading new video");
        
        // Delete old video if exists
        if (existingProduct.video) {
          await deleteFromR2(existingProduct.video);
        }

        // Upload to target category
        const uploadCategory = isChangingCategory ? newCategory : category;
        const videoResult = await uploadToR2(videoFile, uploadCategory);
        existingProduct.video = videoResult.url;
        existingProduct.videoSize = videoResult.size;
        existingProduct.videoType = videoResult.mimetype;
      }

      // ========================================
      // HANDLE IMAGES
      // ========================================
      
      if (imageFiles.length > 0) {
        const uploadCategory = isChangingCategory ? newCategory : category;
        
        if (replaceImages === "true") {
          // Replace all images
          console.log("Replacing all images");
          
          // Delete old images
          if (existingProduct.images && Array.isArray(existingProduct.images)) {
            for (const image of existingProduct.images) {
              await deleteFromR2(image.url);
            }
          }

          // Upload new images
          const imageResults = [];
          for (const imageFile of imageFiles) {
            const result = await uploadToR2(imageFile, uploadCategory);
            imageResults.push({
              url: result.url,
              size: result.size,
              mimetype: result.mimetype,
            });
          }
          existingProduct.images = imageResults;
        } else {
          // Add to existing images
          console.log("Adding new images to existing ones");
          
          if (!existingProduct.images) {
            existingProduct.images = [];
          }

          const totalImages = existingProduct.images.length + imageFiles.length;
          if (totalImages > 10) {
            return res.status(400).json({
              success: false,
              message: `Cannot add ${imageFiles.length} images. Maximum 10 images total (currently ${existingProduct.images.length})`,
            });
          }

          for (const imageFile of imageFiles) {
            const result = await uploadToR2(imageFile, uploadCategory);
            existingProduct.images.push({
              url: result.url,
              size: result.size,
              mimetype: result.mimetype,
            });
          }
        }
      }

      // Update timestamp
      existingProduct.updated_at = new Date().toISOString();

      // ========================================
      // HANDLE CATEGORY CHANGE
      // ========================================
      
      if (isChangingCategory) {
        console.log(`=== MOVING PRODUCT FROM ${category} TO ${newCategory} ===`);
        
        // Load target category data
        const newJsonKey = `products/${newCategory}.json`;
        let newCategoryData = await getJsonFromR2(newJsonKey);
        
        // Initialize if doesn't exist
        if (!newCategoryData) {
          console.log("Creating new category file:", newJsonKey);
          newCategoryData = {
            category: newCategory,
            products: {},
            last_updated: new Date().toISOString(),
          };
        }

        // Add to new category
        newCategoryData.products[id] = existingProduct;
        newCategoryData.last_updated = new Date().toISOString();
        await putJsonToR2(newJsonKey, newCategoryData);
        console.log(`✅ Product added to ${newCategory}`);

        // Remove from old category
        delete data.products[id];
        data.last_updated = new Date().toISOString();
        await putJsonToR2(jsonKey, data);
        console.log(`✅ Product removed from ${category}`);

        console.log("=== CATEGORY MOVE COMPLETE ===");
      } else {
        // ========================================
        // SAVE CHANGES (Same Category)
        // ========================================
        
        console.log("Saving changes to same category");
        
        // Save updated data
        data.products[id] = existingProduct;
        data.last_updated = new Date().toISOString();
        await putJsonToR2(jsonKey, data);

        console.log("✅ Product updated successfully");
      }

      // ========================================
      // 🆕 HANDLE READY STOCK
      // ========================================
      
      const readyStockKey = "products/ready-stock.json";
      let readyStockData = await getJsonFromR2(readyStockKey);
      
      if (!readyStockData) {
        readyStockData = {
          products: {},
          last_updated: new Date().toISOString(),
        };
      }

      const isInReadyStock = readyStockData.products[id] !== undefined;
      const shouldBeInReadyStock = inReadyStock === "true" || inReadyStock === true;

      if (shouldBeInReadyStock) {
        // Add or update in ready stock
        const quantity = parseInt(readyStockQuantity) || 0;
        
        if (quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: "Ready stock quantity must be greater than 0",
          });
        }

        readyStockData.products[id] = {
          ...existingProduct,
          quantity: quantity,
          addedToStock: isInReadyStock 
            ? readyStockData.products[id].addedToStock 
            : new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };

        readyStockData.last_updated = new Date().toISOString();
        await putJsonToR2(readyStockKey, readyStockData);
        
        console.log(`✅ Product ${isInReadyStock ? 'updated in' : 'added to'} ready stock with quantity: ${quantity}`);
      } else if (isInReadyStock && !shouldBeInReadyStock) {
        // Remove from ready stock
        delete readyStockData.products[id];
        readyStockData.last_updated = new Date().toISOString();
        await putJsonToR2(readyStockKey, readyStockData);
        
        console.log("✅ Product removed from ready stock");
      }

      // ========================================
      // SEND RESPONSE
      // ========================================
      
      const responseMessage = isChangingCategory 
        ? `Product moved to ${newCategory} and updated successfully`
        : "Product updated successfully";

      res.json({
        success: true,
        message: responseMessage,
        product: existingProduct,
        newCategory: isChangingCategory ? newCategory : undefined,
        readyStock: shouldBeInReadyStock ? {
          inStock: true,
          quantity: parseInt(readyStockQuantity) || 0
        } : {
          inStock: false
        }
      });
      
    } catch (err) {
      console.error("=== UPDATE ERROR ===");
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to update product",
      });
    }
  }
);

/**
 * 🔐 PATCH /admin/products/:category/:id/remove-image
 * Remove a specific image by index
 */
router.patch(
  "/products/:category/:id/remove-image",
  auth,
  async (req, res) => {
    try {
      const { category, id } = req.params;
      const { imageIndex } = req.body;

      if (imageIndex === undefined) {
        return res.status(400).json({
          success: false,
          message: "Image index is required",
        });
      }

      console.log(`Removing image at index ${imageIndex} from product ${id}`);

      // Load existing product
      const jsonKey = `products/${category}.json`;
      let data = await getJsonFromR2(jsonKey);

      if (!data || !data.products[id]) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const product = data.products[id];

      if (product.hidden === undefined) {
      product.hidden = false;
      }

      if (!product.images || !Array.isArray(product.images)) {
        return res.status(400).json({
          success: false,
          message: "Product has no images",
        });
      }

      if (imageIndex < 0 || imageIndex >= product.images.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid image index",
        });
      }

      // Delete the image from R2
      const imageToDelete = product.images[imageIndex];
      await deleteFromR2(imageToDelete.url);

      // Remove from array
      product.images.splice(imageIndex, 1);
      product.updated_at = new Date().toISOString();

      // Save
      data.products[id] = product;
      data.last_updated = new Date().toISOString();
      await putJsonToR2(jsonKey, data);

      res.json({
        success: true,
        message: "Image removed successfully",
        product: product,
      });
    } catch (err) {
      console.error("Remove image error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to remove image",
      });
    }
  }
);

/**
 * 🔐 GET /admin/products/:category/:id
 * Get single product for editing (with ready stock info)
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

    // Ensure hasModel flag is set correctly
    const product = data.products[id];
    if (product.model && !product.hasModel) {
      product.hasModel = true;
    } else if (!product.model && product.hasModel) {
      product.hasModel = false;
    }

    // ✅ Ensure category field exists
    if (!product.category) {
      product.category = category;
    }

    // 🆕 Check if in ready stock
    const readyStockKey = "products/ready-stock.json";
    const readyStockData = await getJsonFromR2(readyStockKey);
    
    let readyStockInfo = {
      inReadyStock: false,
      quantity: 0
    };

    if (readyStockData && readyStockData.products[id]) {
      readyStockInfo = {
        inReadyStock: true,
        quantity: readyStockData.products[id].quantity,
        addedToStock: readyStockData.products[id].addedToStock,
        lastUpdated: readyStockData.products[id].lastUpdated
      };
    }

    res.json({
      success: true,
      product: product,
      readyStock: readyStockInfo
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

/**
 * 🔐 DELETE /admin/products/:category/:id
 * Delete a product (also removes from ready stock)
 */
router.delete("/products/:category/:id", auth, async (req, res) => {
  try {
    const { category, id } = req.params;
    
    console.log("Deleting product:", id, "from category:", category);

    // Load existing product data
    const jsonKey = `products/${category}.json`;
    let data = await getJsonFromR2(jsonKey);

    if (!data || !data.products[id]) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = data.products[id];

    // Delete all associated files from R2
    // Delete images
    if (product.images && Array.isArray(product.images)) {
      console.log(`Deleting ${product.images.length} images`);
      for (const image of product.images) {
        await deleteFromR2(image.url);
      }
    }

    // Delete model
    if (product.model) {
      console.log("Deleting model");
      await deleteFromR2(product.model);
    }

    // Delete video
    if (product.video) {
      console.log("Deleting video");
      await deleteFromR2(product.video);
    }

    // Remove product from JSON
    delete data.products[id];
    data.last_updated = new Date().toISOString();
    await putJsonToR2(jsonKey, data);

    // 🆕 Remove from ready stock if exists
    const readyStockKey = "products/ready-stock.json";
    const readyStockData = await getJsonFromR2(readyStockKey);
    
    if (readyStockData && readyStockData.products[id]) {
      delete readyStockData.products[id];
      readyStockData.last_updated = new Date().toISOString();
      await putJsonToR2(readyStockKey, readyStockData);
      console.log("✅ Product also removed from ready stock");
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete product",
    });
  }
});

module.exports = router;