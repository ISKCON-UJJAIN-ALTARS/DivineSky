const express = require("express");
const { getJsonFromR2, putJsonToR2, uploadToR2 } = require("../services/r2.service");
const authenticateAdmin = require("../middleware/auth");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Initialize testimonials file if it doesn't exist
 */
async function initializeTestimonialsFile() {
  console.log("🔧 Initializing testimonials file...");
  const jsonKey = "testimonials/testimonials.json";
  const data = await getJsonFromR2(jsonKey);

  if (!data) {
    console.log("📝 Creating new testimonials.json file...");
    const initialData = {
      testimonials: {},
      last_updated: new Date().toISOString(),
      total_testimonials: 0,
    };

    await putJsonToR2(jsonKey, initialData);
    console.log("✅ Created testimonials.json file in R2");
    return initialData;
  }

  console.log("✅ Testimonials file already exists");
  return data;
}

/**
 * GET /testimonials (public)
 */
router.get("/", async (req, res) => {
  try {
    console.log("📥 GET /testimonials - Fetching all testimonials");
    const jsonKey = "testimonials/testimonials.json";
    let data = await getJsonFromR2(jsonKey);

    if (!data) {
      console.log("⚠️ No testimonials file found, initializing...");
      data = await initializeTestimonialsFile();
    }

    const testimonialsArray = Object.values(data.testimonials || {}).sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    console.log(`✅ Returning ${testimonialsArray.length} testimonials`);
    res.json({
      success: true,
      testimonials: testimonialsArray,
      last_updated: data.last_updated,
    });
  } catch (err) {
    console.error("❌ Error fetching testimonials:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch testimonials",
    });
  }
});

/**
 * POST /testimonials (admin)
 */
router.post("/", authenticateAdmin, upload.single("image"), async (req, res) => {
  try {
    console.log("📤 POST /testimonials - Creating new testimonial");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { name, role, message, order } = req.body;

    if (!name || !role || !message) {
      console.log("❌ Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Name, role, and message are required",
      });
    }

    let imageUrl = null;

    if (req.file) {
      console.log("🖼️ Processing image upload...");
      console.log("📸 Uploading image to R2...");
      
      // Use the SAME pattern as product uploads (which work)
      const imageResult = await uploadToR2(req.file, "testimonials/images");
      imageUrl = imageResult.url;
      console.log("✅ Image uploaded:", imageUrl);
    } else {
      console.log("ℹ️ No image file provided");
    }

    const jsonKey = "testimonials/testimonials.json";
    console.log("📥 Fetching current testimonials data...");
    let data = await getJsonFromR2(jsonKey);

    if (!data) {
      console.log("⚠️ No data found, initializing...");
      data = await initializeTestimonialsFile();
    }

    const testimonialId = `TESTIMONIAL-${Date.now()}`;
    console.log("🆔 Generated ID:", testimonialId);

    const newTestimonial = {
      id: testimonialId,
      name,
      role,
      message,
      image: imageUrl,
      order: parseInt(order) || Object.keys(data.testimonials).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("💾 Adding testimonial to data...");
    data.testimonials[testimonialId] = newTestimonial;
    data.total_testimonials = Object.keys(data.testimonials).length;
    data.last_updated = new Date().toISOString();

    console.log("💾 Saving updated data to R2...");
    await putJsonToR2(jsonKey, data);

    console.log("✅ Testimonial created successfully");
    res.json({
      success: true,
      message: "Testimonial created successfully",
      testimonial: newTestimonial,
    });
  } catch (err) {
    console.error("❌ Error creating testimonial:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      success: false,
      message: "Failed to create testimonial",
      error: err.message
    });
  }
});

/**
 * PUT /testimonials/:id (admin)
 */
router.put("/:id", authenticateAdmin, upload.single("image"), async (req, res) => {
  try {
    console.log(`📝 PUT /testimonials/${req.params.id} - Updating testimonial`);
    const { id } = req.params;
    const { name, role, message, order } = req.body;

    const jsonKey = "testimonials/testimonials.json";
    const data = await getJsonFromR2(jsonKey);

    if (!data || !data.testimonials[id]) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    let imageUrl = data.testimonials[id].image;

    if (req.file) {
      console.log("🖼️ Uploading new image...");
      const imageResult = await uploadToR2(req.file, "testimonials/images");
      imageUrl = imageResult.url;
      console.log("✅ New image uploaded:", imageUrl);
    }

    data.testimonials[id] = {
      ...data.testimonials[id],
      name: name || data.testimonials[id].name,
      role: role || data.testimonials[id].role,
      message: message || data.testimonials[id].message,
      image: imageUrl,
      order: order !== undefined ? parseInt(order) : data.testimonials[id].order,
      updated_at: new Date().toISOString(),
    };

    data.last_updated = new Date().toISOString();
    await putJsonToR2(jsonKey, data);

    console.log("✅ Testimonial updated successfully");
    res.json({
      success: true,
      message: "Testimonial updated successfully",
      testimonial: data.testimonials[id],
    });
  } catch (err) {
    console.error("❌ Error updating testimonial:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update testimonial",
      error: err.message
    });
  }
});

/**
 * DELETE /testimonials/:id (admin)
 */
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    console.log(`🗑️ DELETE /testimonials/${req.params.id}`);
    const { id } = req.params;

    const jsonKey = "testimonials/testimonials.json";
    const data = await getJsonFromR2(jsonKey);

    if (!data || !data.testimonials[id]) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    delete data.testimonials[id];
    data.total_testimonials = Object.keys(data.testimonials).length;
    data.last_updated = new Date().toISOString();

    await putJsonToR2(jsonKey, data);

    console.log("✅ Testimonial deleted successfully");
    res.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting testimonial:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete testimonial",
    });
  }
});

module.exports = router;