import { useState } from "react";
import { CATEGORIES_OBJECT } from "../../config/categories";
import { ALTAR_SPECIFICATIONS } from "../../config/altarSpecifications";
import { API_ENDPOINTS } from "../../config/api";
import "../../styles/Admin/Upload.css";

export default function Upload() {
  const [model, setModel] = useState(null);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [includeModel, setIncludeModel] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("altars");
  const [subCategory, setSubCategory] = useState("");

  // Altar-specific specifications
  const [altarSize, setAltarSize] = useState("");
  const [altarDesign, setAltarDesign] = useState("");

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleModelChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isGLB =
      file.name.toLowerCase().endsWith(".glb") ||
      file.name.toLowerCase().endsWith(".gltf");

    if (!isGLB) {
      alert("Only GLB / GLTF models are allowed");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("Model must be under 50MB");
      return;
    }

    setModel(file);
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (images.length + files.length > 5) {
      alert("You can upload a maximum of 5 images");
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is larger than 10MB`);
        return;
      }
    }

    // Add new images
    setImages(prev => [...prev, ...files]);

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Only video files allowed");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("Video must be under 100MB");
      return;
    }

    setVideo(file);

    const reader = new FileReader();
    reader.onloadend = () => setVideoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Handle category change and reset subcategory
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    setSubCategory(""); // Reset subcategory when category changes
    
    // Reset altar specifications when changing away from altars
    if (newCategory !== "altars") {
      setAltarSize("");
      setAltarDesign("");
    }
  };

  const uploadProduct = () => {
    // Validation
    if (!name || !price) {
      alert("Name and price are required");
      return;
    }

    if (includeModel && !model) {
      alert("Please upload a 3D model or uncheck the 'Include 3D Model' option");
      return;
    }

    if (images.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    // Validate subcategory if main category has subcategories
    const hasSubCategories = CATEGORIES_OBJECT[category]?.subCategories?.length > 0;
    if (hasSubCategories && !subCategory) {
      alert("Please select a subcategory");
      return;
    }

    // Validate altar specifications if category is altars
    if (category === "altars") {
      if (!altarSize) {
        alert("Please select an altar size");
        return;
      }
      if (!altarDesign) {
        alert("Please select an altar design");
        return;
      }
    }

    const formData = new FormData();
    
    // Add model if checkbox is checked
    if (includeModel && model) {
      formData.append("model", model);
    }
    
    // Add all images
    images.forEach(image => {
      formData.append("images", image);
    });

    // Add video if provided
    if (video) {
      formData.append("video", video);
    }

    formData.append("name", name);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("subCategory", subCategory);
    formData.append("includeModel", includeModel);

    // Add altar specifications if category is altars
    if (category === "altars") {
      formData.append("altarSize", altarSize);
      formData.append("altarDesign", altarDesign);
    }

    console.log("📤 Uploading product...");
    console.log("Category:", category);
    console.log("SubCategory:", subCategory);
    if (category === "altars") {
      console.log("Altar Size:", altarSize);
      console.log("Altar Design:", altarDesign);
    }
    console.log("Model:", includeModel ? (model ? model.name : "No model") : "Model not included");
    console.log("Images:", images.length);
    console.log("Video:", video ? video.name : "No video");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_ENDPOINTS.admin.upload());

    const token = localStorage.getItem("admin_token");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    setIsUploading(true);
    setStatus("uploading");
    setProgress(0);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setIsUploading(false);

      if (xhr.status === 200 || xhr.status === 201) {
        console.log("✅ Upload successful!");
        try {
          const response = JSON.parse(xhr.responseText);
          console.log("Response:", response);
          
          setStatus("success");
          setProgress(100);
          setTimeout(() => clearForm(), 2000);
        } catch (err) {
          console.error("Failed to parse response:", err);
          setStatus("error");
        }
      } else {
        console.error("❌ Upload failed with status:", xhr.status);
        console.error("Response:", xhr.responseText);
        setStatus("error");
      }
    };

    xhr.onerror = () => {
      console.error("❌ Network error during upload");
      setIsUploading(false);
      setStatus("error");
    };

    xhr.send(formData);
  };

  const clearForm = () => {
    setModel(null);
    setImages([]);
    setPreviews([]);
    setVideo(null);
    setVideoPreview(null);
    setIncludeModel(false);
    setName("");
    setPrice("");
    setDescription("");
    setCategory("altars");
    setSubCategory("");
    setAltarSize("");
    setAltarDesign("");
    setProgress(0);
    setStatus("");
  };

  // Get current subcategories
  const currentSubCategories = CATEGORIES_OBJECT[category]?.subCategories || [];
  const hasSubCategories = currentSubCategories.length > 0;

  return (
    <div className="upload-container">
      <div className="upload-card">
        <div className="upload-header">
          <h2 className="upload-title">Upload Product</h2>
          <p className="upload-subtitle">Add a new sacred creation to the catalog</p>
        </div>

        <div className="upload-form">
          {/* CHECKBOX FOR MODEL UPLOAD */}
          <div className="checkbox-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeModel}
                onChange={(e) => setIncludeModel(e.target.checked)}
                disabled={isUploading}
                className="checkbox-input"
              />
              <span className="checkbox-text">Include 3D Model (Optional)</span>
            </label>
          </div>

          {/* MODEL UPLOAD (CONDITIONAL) */}
          {includeModel && (
            <div className="file-section">
              <label className="file-label">
                {model ? (
                  <div className="file-selected">
                    <div className="file-icon">📦</div>
                    <p className="file-name">{model.name}</p>
                    <span className="file-size">
                      {(model.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        setModel(null);
                      }}
                    >
                      Remove Model
                    </button>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <div className="upload-icon">📦</div>
                    <p className="placeholder-text">Click to upload 3D Model</p>
                    <span className="placeholder-hint">GLB or GLTF up to 50MB</span>
                  </div>
                )}
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleModelChange}
                  style={{ display: "none" }}
                  disabled={isUploading}
                />
              </label>
            </div>
          )}

          {/* MULTIPLE IMAGES UPLOAD */}
          <div className="file-section">
            <label className="images-label">
              <div className="images-upload-area">
                <div className="upload-icon">📸</div>
                <p className="placeholder-text">Click to upload images ({images.length}/5)</p>
                <span className="placeholder-hint">PNG, JPG up to 10MB each · Required</span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                style={{ display: "none" }}
                disabled={isUploading || images.length >= 5}
              />
            </label>

            {/* IMAGE PREVIEWS GRID */}
            {previews.length > 0 && (
              <div className="images-preview-grid">
                {previews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} className="preview-thumbnail" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      disabled={isUploading}
                    >
                      ✕
                    </button>
                    <span className="image-number">{index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VIDEO UPLOAD (OPTIONAL) */}
          <div className="file-section">
            <label className="file-label">
              {videoPreview ? (
                <div className="video-preview">
                  <video src={videoPreview} controls className="preview-video" />
                  <button
                    type="button"
                    className="remove-video-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      setVideo(null);
                      setVideoPreview(null);
                    }}
                  >
                    Remove Video
                  </button>
                </div>
              ) : (
                <div className="video-placeholder">
                  <div className="upload-icon">🎥</div>
                  <p className="placeholder-text">Click to upload video (optional)</p>
                  <span className="placeholder-hint">MP4, WebM, MOV up to 100MB</span>
                </div>
              )}
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                style={{ display: "none" }}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* FORM FIELDS */}
          <div className="form-group">
            <label className="label">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              className="form-input"
              disabled={isUploading}
            />
          </div>

          <div className="form-group">
            <label className="label">Price (INR) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              className="form-input"
              disabled={isUploading}
            />
          </div>

          {/* Category with subcategories */}
          <div className="form-group">
            <label className="label">Category *</label>
            <select
              value={category}
              onChange={handleCategoryChange}
              className="form-select"
              disabled={isUploading}
            >
              {Object.entries(CATEGORIES_OBJECT).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory dropdown (conditional) */}
          {hasSubCategories && (
            <div className="form-group subcategory-group">
              <label className="label">
                Subcategory * 
                <span className="label-hint">for {CATEGORIES_OBJECT[category].label}</span>
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="form-select subcategory-select"
                disabled={isUploading}
              >
                <option value="">-- Select Subcategory --</option>
                {currentSubCategories.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ALTAR SPECIFICATIONS (CONDITIONAL) */}
          {category === "altars" && (
            <div className="altar-specifications-section">
              <h3 className="altar-specifications-title">
               Altar Specifications
              </h3>
              
              {/* Altar Size */}
              <div className="altar-spec-group form-group">
                <label className="label">
                  {ALTAR_SPECIFICATIONS.size.label} *
                </label>
                <select
                  value={altarSize}
                  onChange={(e) => setAltarSize(e.target.value)}
                  className="form-select altar-spec-select"
                  disabled={isUploading}
                >
                  <option value="">-- Select Size --</option>
                  {ALTAR_SPECIFICATIONS.size.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Altar Design */}
              <div className="altar-spec-group form-group">
                <label className="label">
                  {ALTAR_SPECIFICATIONS.design.label} *
                </label>
                <select
                  value={altarDesign}
                  onChange={(e) => setAltarDesign(e.target.value)}
                  className="form-select altar-spec-select"
                  disabled={isUploading}
                >
                  <option value="">-- Select Design --</option>
                  {ALTAR_SPECIFICATIONS.design.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description (optional)"
              rows={4}
              className="form-textarea"
              disabled={isUploading}
            />
          </div>

          {/* PROGRESS */}
          {progress > 0 && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}

          {/* STATUS */}
          {status && (
            <div className={`status-${status}`}>
              {status === "uploading" && "⏳ Uploading..."}
              {status === "success" && "✅ Upload successful!"}
              {status === "error" && "❌ Upload failed. Please try again."}
            </div>
          )}

          {/* ACTIONS */}
          <div className="form-actions">
            <button
              type="button"
              onClick={clearForm}
              className="btn-secondary"
              disabled={isUploading}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={uploadProduct}
              className="btn-primary"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}