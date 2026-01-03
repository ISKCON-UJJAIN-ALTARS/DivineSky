const express = require("express");
const { getJsonFromR2, uploadToR2, deleteFromR2 } = require("../services/r2.service");
const { authenticateAdmin } = require("../middleware/auth");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Initialize gallery file if it doesn't exist
 */
async function initializeGalleryFile() {
  const jsonKey = "gallery/gallery.json";
  const data = await getJsonFromR2(jsonKey);
  
  if (!data) {
    const initialData = {
      hero: null,
      guests: [],
      workshop: [],
      team: [],
      last_updated: new Date().toISOString(),
    };
    
    await uploadToR2(
      jsonKey,
      Buffer.from(JSON.stringify(initialData, null, 2)),
      "application/json"
    );
    
    console.log("✅ Created gallery.json file in R2");
    return initialData;
  }
  
  return data;
}

/**
 * GET /gallery
 * Fetch all gallery photos (public)
 */
router.get("/", async (req, res) => {
  try {
    const jsonKey = "gallery/gallery.json";
    let data = await getJsonFromR2(jsonKey);

    if (!data) {
      data = await initializeGalleryFile();
    }

    res.json({
      success: true,
      hero: data.hero,
      guests: data.guests || [],
      workshop: data.workshop || [],
      team: data.team || [],
      last_updated: data.last_updated,
    });
  } catch (err) {
    console.error("Error fetching gallery:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery",
    });
  }
});

/**
 * POST /gallery/upload
 * Upload a photo to a specific section (admin only)
 */
router.post("/upload", authenticateAdmin, upload.single("photo"), async (req, res) => {
  try {
    const { section, caption, featured } = req.body;

    if (!section || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Section and photo are required",
      });
    }

    // Validate section
    const validSections = ["hero", "guests", "workshop", "team"];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section. Must be: hero, guests, workshop, or team",
      });
    }

    // Upload photo to R2
    const imageKey = `gallery/${section}/${uuidv4()}.${req.file.mimetype.split("/")[1]}`;
    const imageUrl = await uploadToR2(imageKey, req.file.buffer, req.file.mimetype);

    // Get existing gallery data
    const jsonKey = "gallery/gallery.json";
    let data = await getJsonFromR2(jsonKey);

    if (!data) {
      data = await initializeGalleryFile();
    }

    const newPhoto = {
      id: `${section.toUpperCase()}-${Date.now()}`,
      url: imageUrl,
      caption: caption || "",
      featured: featured === "true" || false,
      uploaded_at: new Date().toISOString(),
    };

    // Update appropriate section
    if (section === "hero") {
      data.hero = newPhoto;
    } else {
      data[section].push(newPhoto);
    }

    data.last_updated = new Date().toISOString();

    // Save back to R2
    await uploadToR2(
      jsonKey,
      Buffer.from(JSON.stringify(data, null, 2)),
      "application/json"
    );

    res.json({
      success: true,
      message: "Photo uploaded successfully",
      photo: newPhoto,
    });
  } catch (err) {
    console.error("Error uploading photo:", err);
    res.status(500).json({
      success: false,
      message: "Failed to upload photo",
    });
  }
});

/**
 * DELETE /gallery/:section/:id
 * Delete a photo from a specific section (admin only)
 */
router.delete("/:section/:id", authenticateAdmin, async (req, res) => {
  try {
    const { section, id } = req.params;

    const validSections = ["hero", "guests", "workshop", "team"];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section",
      });
    }

    const jsonKey = "gallery/gallery.json";
    const data = await getJsonFromR2(jsonKey);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Gallery data not found",
      });
    }

    // Delete from appropriate section
    if (section === "hero") {
      if (data.hero && data.hero.id === id) {
        data.hero = null;
      } else {
        return res.status(404).json({
          success: false,
          message: "Photo not found",
        });
      }
    } else {
      const index = data[section].findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "Photo not found",
        });
      }
      data[section].splice(index, 1);
    }

    data.last_updated = new Date().toISOString();

    // Save back to R2
    await uploadToR2(
      jsonKey,
      Buffer.from(JSON.stringify(data, null, 2)),
      "application/json"
    );

    res.json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting photo:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete photo",
    });
  }
});

/**
 * PUT /gallery/:section/:id
 * Update photo caption (admin only)
 */
router.put("/:section/:id", authenticateAdmin, async (req, res) => {
  try {
    const { section, id } = req.params;
    const { caption } = req.body;

    const validSections = ["hero", "guests", "workshop", "team"];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section",
      });
    }

    const jsonKey = "gallery/gallery.json";
    const data = await getJsonFromR2(jsonKey);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Gallery data not found",
      });
    }

    // Update caption
    if (section === "hero") {
      if (data.hero && data.hero.id === id) {
        data.hero.caption = caption;
      } else {
        return res.status(404).json({
          success: false,
          message: "Photo not found",
        });
      }
    } else {
      const photo = data[section].find(p => p.id === id);
      if (!photo) {
        return res.status(404).json({
          success: false,
          message: "Photo not found",
        });
      }
      photo.caption = caption;
    }

    data.last_updated = new Date().toISOString();

    // Save back to R2
    await uploadToR2(
      jsonKey,
      Buffer.from(JSON.stringify(data, null, 2)),
      "application/json"
    );

    res.json({
      success: true,
      message: "Photo updated successfully",
    });
  } catch (err) {
    console.error("Error updating photo:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update photo",
    });
  }
});

module.exports = router;