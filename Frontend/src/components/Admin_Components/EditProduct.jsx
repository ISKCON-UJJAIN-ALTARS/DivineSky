import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CATEGORIES_OBJECT, getCategoryLabel, getSubCategoryLabel } from "../../config/categories";
import { ALTAR_SPECIFICATIONS } from "../../config/altarSpecifications";
import { API_ENDPOINTS } from "../../config/api";
import "../../styles/Admin/EditProduct.css";

export default function EditProduct() {
  const { category, id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [subCategory, setSubCategory] = useState("");
  
  // Altar specifications
  const [altarSize, setAltarSize] = useState("");
  const [altarDesign, setAltarDesign] = useState("");
  
  // Ready Stock states
  const [inReadyStock, setInReadyStock] = useState(false);
  const [readyStockQuantity, setReadyStockQuantity] = useState("");
  
  // File states
  const [newImages, setNewImages] = useState([]);
  const [replaceImages, setReplaceImages] = useState(false);
  const [newModel, setNewModel] = useState(null);
  const [newVideo, setNewVideo] = useState(null);
  
  // Preview states
  const [imagePreviews, setImagePreviews] = useState([]);
  
  useEffect(() => {
    fetchProduct();
  }, [category, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        API_ENDPOINTS.admin.getProduct(category, id),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        const p = data.product;
        setProduct(p);
        setName(p.name);
        setPrice(p.price);
        setDescription(p.description || "");
        setSelectedCategory(p.category || category);
        setSubCategory(p.subCategory || "");
        
        // Set altar specifications if available
        setAltarSize(p.altarSize || "");
        setAltarDesign(p.altarDesign || "");
        
        // Set Ready Stock info
        if (data.readyStock) {
          setInReadyStock(data.readyStock.inReadyStock || false);
          setReadyStockQuantity(data.readyStock.quantity ? String(data.readyStock.quantity) : "");
        }
      } else {
        setMessage({ type: "error", text: "Product not found" });
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage({ type: "error", text: "Failed to load product" });
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const currentImageCount = product?.images?.length || 0;
    const maxAllowed = replaceImages ? 5 : (10 - currentImageCount);
    
    if (files.length > maxAllowed) {
      setMessage({ 
        type: "error", 
        text: replaceImages 
          ? "Maximum 5 images when replacing" 
          : `Can only add ${maxAllowed} more images (max 10 total)` 
      });
      return;
    }

    setNewImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    setMessage({ type: "", text: "" });
  };

  const handleModelChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isGLB = file.name.toLowerCase().endsWith(".glb") || 
                  file.name.toLowerCase().endsWith(".gltf");

    if (!isGLB) {
      setMessage({ type: "error", text: "Only GLB/GLTF files allowed" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: "error", text: "Model must be under 50MB" });
      return;
    }

    setNewModel(file);
    setMessage({ type: "", text: "" });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMessage({ type: "error", text: "Only video files allowed" });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setMessage({ type: "error", text: "Video must be under 100MB" });
      return;
    }

    setNewVideo(file);
    setMessage({ type: "", text: "" });
  };

  const removeImage = async (imageIndex) => {
    if (!window.confirm(`Remove this image?`)) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      
      const response = await fetch(
        API_ENDPOINTS.admin.removeImage(category, id),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageIndex }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "✅ Image removed" });
        fetchProduct();
        setTimeout(() => setMessage({ type: "", text: "" }), 2000);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to remove image" });
    } finally {
      setSaving(false);
    }
  };

  const removeExistingModel = async () => {
    if (!window.confirm("Remove 3D model from this product?")) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("removeModel", "true");

      const response = await fetch(
        API_ENDPOINTS.admin.updateProduct(category, id),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "✅ Model removed" });
        fetchProduct();
        setTimeout(() => setMessage({ type: "", text: "" }), 2000);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to remove model" });
    } finally {
      setSaving(false);
    }
  };

  const removeExistingVideo = async () => {
    if (!window.confirm("Remove video from this product?")) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("removeVideo", "true");

      const response = await fetch(
        API_ENDPOINTS.admin.updateProduct(category, id),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "✅ Video removed" });
        fetchProduct();
        setTimeout(() => setMessage({ type: "", text: "" }), 2000);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to remove video" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }

    if (!price || parseFloat(price) < 0) {
      setMessage({ type: "error", text: "Price must be a valid number" });
      return;
    }

    // Validate ready stock quantity
    if (inReadyStock) {
      const qty = parseInt(readyStockQuantity);
      if (!readyStockQuantity || qty <= 0) {
        setMessage({ type: "error", text: "Ready stock quantity must be greater than 0" });
        return;
      }
    }

    // Validate subcategory if category has subcategories
    const currentCategoryData = CATEGORIES_OBJECT[selectedCategory];
    const hasSubCategories = currentCategoryData?.subCategories?.length > 0;
    if (hasSubCategories && !subCategory) {
      setMessage({ type: "error", text: "Please select a subcategory" });
      return;
    }

    // Validate altar specifications if category is altars
    if (selectedCategory === "altars") {
      if (!altarSize) {
        setMessage({ type: "error", text: "Please select an altar size" });
        return;
      }
      if (!altarDesign) {
        setMessage({ type: "error", text: "Please select an altar design" });
        return;
      }
    }

    // Confirm category change
    const isChangingCategory = selectedCategory !== category;
    if (isChangingCategory) {
      const confirmMsg = `This will move the product from "${getCategoryLabel(category)}" to "${getCategoryLabel(selectedCategory)}". Continue?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      
      // ALWAYS send these fields
      formData.append("name", name.trim());
      formData.append("price", price);
      formData.append("description", description.trim());
      formData.append("subCategory", subCategory);
      
      // Altar specifications if category is altars
      if (selectedCategory === "altars") {
        formData.append("altarSize", altarSize);
        formData.append("altarDesign", altarDesign);
      }
      
      // Ready Stock fields
      formData.append("inReadyStock", inReadyStock ? "true" : "false");
      if (inReadyStock && readyStockQuantity) {
        formData.append("readyStockQuantity", readyStockQuantity);
      }
      
      // Category change
      if (isChangingCategory) {
        formData.append("newCategory", selectedCategory);
      }

      if (newImages.length > 0) {
        formData.append("replaceImages", replaceImages ? "true" : "false");
        newImages.forEach(img => formData.append("images", img));
      }

      if (newModel) {
        formData.append("includeModel", "true");
        formData.append("model", newModel);
      }

      if (newVideo) {
        formData.append("video", newVideo);
      }

      const response = await fetch(
        API_ENDPOINTS.admin.updateProduct(category, id),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        let successMsg = "✅ Product updated successfully!";
        if (isChangingCategory) {
          successMsg = "✅ Product updated and moved to new category!";
        }
        if (data.readyStock?.inStock) {
          successMsg += ` (Added to Ready Stock: ${data.readyStock.quantity} units)`;
        } else if (!inReadyStock) {
          successMsg += " (Removed from Ready Stock)";
        }
        
        setMessage({ type: "success", text: successMsg });
        
        // Clear form
        setNewImages([]);
        setNewModel(null);
        setNewVideo(null);
        setImagePreviews([]);
        setReplaceImages(false);
        
        // Navigate after delay
        setTimeout(() => {
          if (isChangingCategory && data.newCategory) {
            navigate(`/admin/products?category=${data.newCategory}`);
          } else {
            navigate("/admin/products");
          }
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.message || "Update failed" });
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-loading">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="edit-error">
        <p>Product not found</p>
        <button onClick={() => navigate("/admin/products")}>
          ← Back to Products
        </button>
      </div>
    );
  }

  const currentSubCategories = CATEGORIES_OBJECT[selectedCategory]?.subCategories || [];
  const hasSubCategories = currentSubCategories.length > 0;

  return (
    <div className="edit-product-container">
      <div className="edit-header">
        <button className="back-btn" onClick={() => navigate("/admin/products")}>
          ← Back to Products
        </button>
        <h2>Edit Product</h2>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="edit-content">
        {/* Left Column */}
        <div className="current-info-section">
          <h3>Current Product Details</h3>
          
          <div className="info-block">
            <label>Current Category</label>
            <div className="current-category">
              <span className="category-badge">
                {getCategoryLabel(product.category || category)}
              </span>
            </div>
            {product.subCategory && (
              <div className="current-subcategory">
                <small>
                  Subcategory: {getSubCategoryLabel(product.category || category, product.subCategory)}
                </small>
              </div>
            )}
          </div>

          {/* Display current altar specifications if available */}
          {product.category === "altars" && (product.altarSize || product.altarDesign) && (
            <div className="info-block">
              <label>Current Altar Specifications</label>
              <div className="current-altar-specs">
                {product.altarSize && (
                  <div className="spec-item">
                    <strong>Size:</strong> {product.altarSize}
                  </div>
                )}
                {product.altarDesign && (
                  <div className="spec-item">
                    <strong>Design:</strong> {product.altarDesign}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="info-block">
            <label>Current Images ({product.images?.length || 0})</label>
            <div className="current-images-grid">
              {product.images?.map((img, idx) => (
                <div key={idx} className="image-with-remove">
                  <img src={img.url} alt={`Product ${idx + 1}`} />
                  <button
                    className="remove-image-btn"
                    onClick={() => removeImage(idx)}
                    disabled={saving}
                    title="Remove this image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="info-block">
            <label>3D Model</label>
            {product.hasModel ? (
              <div className="current-file">
                <span>✅ Model available</span>
                <button 
                  className="remove-btn"
                  onClick={removeExistingModel}
                  disabled={saving}
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="no-file">❌ No model uploaded</p>
            )}
          </div>

          <div className="info-block">
            <label>Video</label>
            {product.video ? (
              <div className="current-file">
                <video src={product.video} controls className="video-preview" />
                <button 
                  className="remove-btn"
                  onClick={removeExistingVideo}
                  disabled={saving}
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="no-file">❌ No video uploaded</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="edit-form-section">
          <h3>Update Product Information</h3>

          <div className="form-group">
            <label>Change Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const newCat = e.target.value;
                setSelectedCategory(newCat);
                setSubCategory("");
                // Reset altar specs when changing away from altars
                if (newCat !== "altars") {
                  setAltarSize("");
                  setAltarDesign("");
                }
              }}
              className="category-select"
            >
              {Object.entries(CATEGORIES_OBJECT).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
            {selectedCategory !== category && (
              <small className="form-hint warning">
                ⚠️ This will move the product to the "{getCategoryLabel(selectedCategory)}" category
              </small>
            )}
          </div>

          {hasSubCategories && (
            <div className="form-group subcategory-group">
              <label>
                Subcategory *
                <span className="label-hint">for {getCategoryLabel(selectedCategory)}</span>
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="category-select subcategory-select"
              >
                <option value="">-- Select Subcategory --</option>
                {currentSubCategories.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
              {product.subCategory && subCategory !== product.subCategory && (
                <small className="form-hint">
                  Current: {getSubCategoryLabel(product.category || category, product.subCategory)}
                </small>
              )}
            </div>
          )}

          {/* ALTAR SPECIFICATIONS (CONDITIONAL) */}
          {selectedCategory === "altars" && (
            <div className="altar-specifications-section">
              <h3 className="altar-specifications-title">
                🕉️ Altar Specifications
              </h3>
              
              {/* Altar Size */}
              <div className="altar-spec-group form-group">
                <label>
                  {ALTAR_SPECIFICATIONS.size.label} *
                </label>
                <select
                  value={altarSize}
                  onChange={(e) => setAltarSize(e.target.value)}
                  className="category-select altar-spec-select"
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
                <label>
                  {ALTAR_SPECIFICATIONS.design.label} *
                </label>
                <select
                  value={altarDesign}
                  onChange={(e) => setAltarDesign(e.target.value)}
                  className="category-select altar-spec-select"
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
            <label>Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="form-group">
            <label>Price (₹) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description"
              rows={4}
            />
          </div>

          {/* Ready Stock Section */}
          <div className="form-group ready-stock-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={inReadyStock}
                onChange={(e) => {
                  setInReadyStock(e.target.checked);
                  if (!e.target.checked) {
                    setReadyStockQuantity("");
                  }
                }}
              />
              <span className="checkbox-text">
                📦 Add to Ready Stock
              </span>
            </label>
            
            {inReadyStock && (
              <div className="quantity-input-wrapper">
                <input
                  type="number"
                  value={readyStockQuantity}
                  onChange={(e) => setReadyStockQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="1"
                  className="quantity-input"
                />
                <small className="form-hint">
                  Number of units available for immediate delivery
                </small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              {replaceImages ? "Replace All Images" : "Add New Images"}
            </label>
            
            <div className="image-mode-toggle">
              <label className="toggle-option">
                <input
                  type="radio"
                  checked={!replaceImages}
                  onChange={() => setReplaceImages(false)}
                />
                <span>Add to existing ({10 - (product.images?.length || 0)} slots available)</span>
              </label>
              <label className="toggle-option">
                <input
                  type="radio"
                  checked={replaceImages}
                  onChange={() => setReplaceImages(true)}
                />
                <span>Replace all images</span>
              </label>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input"
            />
            <small className="form-hint">
              {replaceImages 
                ? "Max 5 images - will delete all existing images" 
                : `Can add up to ${10 - (product.images?.length || 0)} more images`}
            </small>
            
            {imagePreviews.length > 0 && (
              <div className="new-images-preview">
                {imagePreviews.map((preview, idx) => (
                  <img key={idx} src={preview} alt={`Preview ${idx + 1}`} />
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Upload New 3D Model (GLB/GLTF)</label>
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleModelChange}
              className="file-input"
            />
            {newModel && (
              <p className="file-name">📦 {newModel.name}</p>
            )}
            <small className="form-hint">Will replace existing model if any</small>
          </div>

          <div className="form-group">
            <label>Upload New Video</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="file-input"
            />
            {newVideo && (
              <p className="file-name">🎥 {newVideo.name}</p>
            )}
            <small className="form-hint">Will replace existing video if any</small>
          </div>

          <div className="form-actions">
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}