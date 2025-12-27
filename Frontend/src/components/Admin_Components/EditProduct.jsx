import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CATEGORIES_OBJECT, getCategoryLabel, getSubCategoryLabel } from "../../config/categories";
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
        `https://divinesky.onrender.com/admin/products/${category}/${id}`,
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
    if (!confirm(`Remove this image?`)) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      
      const response = await fetch(
        `https://divinesky.onrender.com/admin/products/${category}/${id}/remove-image`,
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
    if (!confirm("Remove 3D model from this product?")) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("removeModel", "true");

      const response = await fetch(
        `https://divinesky.onrender.com/admin/products/${category}/${id}`,
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
    if (!confirm("Remove video from this product?")) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("removeVideo", "true");

      const response = await fetch(
        `https://divinesky.onrender.com/admin/products/${category}/${id}`,
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
    const isChangingName = name !== product.name;
    const isChangingPrice = parseFloat(price) !== product.price;
    const isChangingDescription = description !== (product.description || "");
    const isChangingCategory = selectedCategory !== category;
    const isChangingSubCategory = subCategory !== (product.subCategory || "");
    
    if (isChangingName && !name.trim()) {
      setMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }

    if (isChangingPrice && (!price || parseFloat(price) < 0)) {
      setMessage({ type: "error", text: "Price must be a valid number" });
      return;
    }

    // Validate subcategory if category has subcategories
    const currentCategoryData = CATEGORIES_OBJECT[selectedCategory];
    const hasSubCategories = currentCategoryData?.subCategories?.length > 0;
    if (hasSubCategories && !subCategory) {
      setMessage({ type: "error", text: "Please select a subcategory" });
      return;
    }

    // Confirm category change
    if (isChangingCategory) {
      const confirmMsg = `This will move the product from "${getCategoryLabel(category)}" to "${getCategoryLabel(selectedCategory)}". Continue?`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      
      // ALWAYS send these fields to ensure they're updated properly
      formData.append("name", name.trim());
      formData.append("price", price);
      formData.append("description", description.trim());
      formData.append("subCategory", subCategory);
      
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
        `https://divinesky.onrender.com/admin/products/${category}/${id}`,
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
        setMessage({ 
          type: "success", 
          text: isChangingCategory 
            ? "✅ Product updated and moved to new category!" 
            : "✅ Product updated successfully!" 
        });
        
        // Clear form
        setNewImages([]);
        setNewModel(null);
        setNewVideo(null);
        setImagePreviews([]);
        setReplaceImages(false);
        
        // Navigate to the NEW category if changed
        setTimeout(() => {
          if (isChangingCategory && data.newCategory) {
            navigate(`/admin/products?category=${data.newCategory}`);
          } else {
            navigate("/admin/products");
          }
        }, 1500);
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

  // Get current subcategories based on selected category
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
        {/* Left Column - Current Product Info */}
        <div className="current-info-section">
          <h3>Current Product Details</h3>
          
          {/* Current Category Display */}
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
          
          {/* Current Images */}
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

          {/* Current Model */}
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

          {/* Current Video */}
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

        {/* Right Column - Edit Form */}
        <div className="edit-form-section">
          <h3>Update Product Information</h3>

          {/* Category Selector */}
          <div className="form-group">
            <label>Change Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSubCategory(""); // Reset subcategory when category changes
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

          {/* Subcategory Selector */}
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

          {/* Basic Info */}
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

          {/* Upload New Images */}
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

          {/* Upload New Model */}
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

          {/* Upload New Video */}
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

          {/* Save Button */}
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