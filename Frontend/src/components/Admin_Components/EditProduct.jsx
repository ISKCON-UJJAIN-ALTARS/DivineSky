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

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [subCategory, setSubCategory] = useState("");

  const [tagline, setTagline] = useState("");
  const [features, setFeatures] = useState("");
  const [specs, setSpecs] = useState([{ key: "", value: "" }]);

  const [altarSize, setAltarSize] = useState("");
  const [altarDesign, setAltarDesign] = useState("");

  const [isHidden, setIsHidden] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);
  const [isMostSelling, setIsMostSelling] = useState(false);

  const [inReadyStock, setInReadyStock] = useState(false);
  const [readyStockQuantity, setReadyStockQuantity] = useState("");

  const [newImages, setNewImages] = useState([]);
  const [replaceImages, setReplaceImages] = useState(false);
  const [newModel, setNewModel] = useState(null);
  const [newVideo, setNewVideo] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [category, id]);

  const parseDescription = (raw) => {
    if (!raw) return { tagline: "", features: "", specs: [{ key: "", value: "" }] };
    try {
      const parsed = JSON.parse(raw);
      if (parsed.tagline || parsed.features || parsed.specs) {
        return {
          tagline: parsed.tagline || "",
          features: typeof parsed.features === "string" ? parsed.features : "",
          specs: parsed.specs?.length ? parsed.specs : [{ key: "", value: "" }],
        };
      }
    } catch { /* fall through */ }
    return { tagline: "", features: raw, specs: [{ key: "", value: "" }] };
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      const response = await fetch(API_ENDPOINTS.admin.getProduct(category, id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        const p = data.product;
        setProduct(p);
        setName(p.name);
        setPrice(p.price);
        setSelectedCategory(p.category || category);
        setSubCategory(p.subCategory || "");
        setAltarSize(p.altarSize || "");
        setAltarDesign(p.altarDesign || "");
        setIsHidden(!!p.isHidden);
        setHidePrice(!!p.hidePrice);
        setIsMostSelling(p.mostSelling || false);

        const desc = parseDescription(p.description);
        setTagline(desc.tagline);
        setFeatures(desc.features);
        setSpecs(desc.specs);

        if (data.readyStock) {
          setInReadyStock(data.readyStock.inReadyStock || false);
          setReadyStockQuantity(
            data.readyStock.quantity ? String(data.readyStock.quantity) : ""
          );
        }
      } else {
        setMessage({ type: "error", text: "Product not found" });
      }
      setLoading(false);
    } catch {
      setMessage({ type: "error", text: "Failed to load product" });
      setLoading(false);
    }
  };

  // ─── Spec table ────────────────────────────────────────────────
  const handleSpecChange = (index, field, value) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSpec = () => {
    if (specs.length >= 15) return;
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeSpec = (index) => {
    if (specs.length === 1) return;
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Image processing ──────────────────────────────────────────
  const processImageFiles = (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) { setMessage({ type: "error", text: "Only image files are allowed" }); return; }
    const maxAllowed = replaceImages ? 5 : 10 - (product?.images?.length || 0);
    if (files.length > maxAllowed) {
      setMessage({
        type: "error",
        text: replaceImages
          ? "Maximum 5 images when replacing"
          : `Can only add ${maxAllowed} more images (max 10 total)`,
      });
      return;
    }
    setNewImages(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
    setMessage({ type: "", text: "" });
  };

  const handleImageChange = (e) => processImageFiles(e.target.files);
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) processImageFiles(e.dataTransfer.files); };
  const handlePaste = (e) => {
    const files = Array.from(e.clipboardData?.items || [])
      .filter((i) => i.type.startsWith("image/"))
      .map((i) => i.getAsFile())
      .filter(Boolean);
    if (files.length > 0) processImageFiles(files);
  };

  const handleModelChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isGLB = file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf");
    if (!isGLB) { setMessage({ type: "error", text: "Only GLB/GLTF files allowed" }); return; }
    if (file.size > 50 * 1024 * 1024) { setMessage({ type: "error", text: "Model must be under 50MB" }); return; }
    setNewModel(file);
    setMessage({ type: "", text: "" });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { setMessage({ type: "error", text: "Only video files allowed" }); return; }
    if (file.size > 100 * 1024 * 1024) { setMessage({ type: "error", text: "Video must be under 100MB" }); return; }
    setNewVideo(file);
    setMessage({ type: "", text: "" });
  };

  // ─── Remove existing media ─────────────────────────────────────
  const removeImage = async (imageIndex) => {
    if (!window.confirm("Remove this image?")) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      const response = await fetch(API_ENDPOINTS.admin.removeImage(category, id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageIndex }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "✅ Image removed" });
        fetchProduct();
        setTimeout(() => setMessage({ type: "", text: "" }), 2000);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove image" });
    } finally {
      setSaving(false);
    }
  };

  const removeExistingMedia = async (field) => {
    const label = field === "removeModel" ? "3D model" : "video";
    if (!window.confirm(`Remove ${label} from this product?`)) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append(field, "true");
      const response = await fetch(API_ENDPOINTS.admin.updateProduct(category, id), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: `✅ ${label.charAt(0).toUpperCase() + label.slice(1)} removed` });
        fetchProduct();
        setTimeout(() => setMessage({ type: "", text: "" }), 2000);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: `Failed to remove ${label}` });
    } finally {
      setSaving(false);
    }
  };

  // ─── Build formData ────────────────────────────────────────────
  const buildBaseFormData = () => {
    const descriptionData = {
      tagline: tagline.trim(),
      features: features.trim(),
      specs: specs.filter((s) => s.key.trim() && s.value.trim()),
    };

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("price", price);
    formData.append("description", JSON.stringify(descriptionData));
    formData.append("subCategory", subCategory);
    formData.append("isHidden", isHidden ? "true" : "false");
    formData.append("hidePrice", hidePrice ? "true" : "false");
    formData.append("mostSelling", isMostSelling ? "true" : "false");
    formData.append("inReadyStock", inReadyStock ? "true" : "false");
    if (inReadyStock && readyStockQuantity) {
      formData.append("readyStockQuantity", readyStockQuantity);
    }
    if (selectedCategory === "altars") {
      formData.append("altarSize", altarSize);
      formData.append("altarDesign", altarDesign);
    }
    return formData;
  };

  // ─── Quick toggles ─────────────────────────────────────────────
  const quickToggle = async (field, currentValue, messages) => {
    const next = !currentValue;
    if (!window.confirm(next ? messages.confirmOn : messages.confirmOff)) return;
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      const token = localStorage.getItem("admin_token");
      const formData = buildBaseFormData();
      formData.set(field, next ? "true" : "false");

      const response = await fetch(API_ENDPOINTS.admin.updateProduct(category, id), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        if (field === "isHidden") setIsHidden(next);
        if (field === "hidePrice") setHidePrice(next);
        if (field === "mostSelling") setIsMostSelling(next);
        setMessage({ type: "success", text: next ? messages.successOn : messages.successOff });
        fetchProduct();
        setTimeout(() => setMessage({ type: "", text: "" }), 2500);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  const toggleHidden = () => quickToggle("isHidden", isHidden, {
    confirmOn: "Hide this product from customers?",
    confirmOff: "Unhide this product so customers can see it again?",
    successOn: "✅ Product hidden from customers",
    successOff: "✅ Product is now visible to customers",
  });

  const toggleHidePrice = () => quickToggle("hidePrice", hidePrice, {
    confirmOn: "Hide the price? Customers will see a Call/WhatsApp prompt instead.",
    confirmOff: "Show the price again for this product?",
    successOn: "✅ Price hidden — customers will see Call/WhatsApp instead",
    successOff: "✅ Price is now visible to customers",
  });

  const toggleMostSelling = () => quickToggle("mostSelling", isMostSelling, {
    confirmOn: "Feature this product as Most Selling?",
    confirmOff: "Remove this product from Most Selling?",
    successOn: "✅ Product marked as Most Selling",
    successOff: "✅ Product removed from Most Selling",
  });

  // ─── Main save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) { setMessage({ type: "error", text: "Name cannot be empty" }); return; }
    if (!price || parseFloat(price) < 0) { setMessage({ type: "error", text: "Price must be a valid number" }); return; }
    if (inReadyStock && (!readyStockQuantity || parseInt(readyStockQuantity) <= 0)) {
      setMessage({ type: "error", text: "Ready stock quantity must be greater than 0" }); return;
    }

    const currentCategoryData = CATEGORIES_OBJECT[selectedCategory];
    if (currentCategoryData?.subCategories?.length > 0 && !subCategory) {
      setMessage({ type: "error", text: "Please select a subcategory" }); return;
    }
    if (selectedCategory === "altars") {
      if (!altarSize) { setMessage({ type: "error", text: "Please select an altar size" }); return; }
      if (!altarDesign) { setMessage({ type: "error", text: "Please select an altar design" }); return; }
    }

    const isChangingCategory = selectedCategory !== category;
    if (isChangingCategory) {
      if (!window.confirm(
        `This will move the product from "${getCategoryLabel(category)}" to "${getCategoryLabel(selectedCategory)}". Continue?`
      )) return;
    }

    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const token = localStorage.getItem("admin_token");
      const formData = buildBaseFormData();

      if (isChangingCategory) formData.append("newCategory", selectedCategory);
      if (newImages.length > 0) {
        formData.append("replaceImages", replaceImages ? "true" : "false");
        newImages.forEach((img) => formData.append("images", img));
      }
      if (newModel) { formData.append("includeModel", "true"); formData.append("model", newModel); }
      if (newVideo) formData.append("video", newVideo);

      const response = await fetch(API_ENDPOINTS.admin.updateProduct(category, id), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        let successMsg = isChangingCategory
          ? "✅ Product updated and moved to new category!"
          : "✅ Product updated successfully!";
        if (data.readyStock?.inStock) {
          successMsg += ` (Ready Stock: ${data.readyStock.quantity} units)`;
        }
        if (data.mostSelling) {
          successMsg += " · 🔥 Most Selling";
        }

        setMessage({ type: "success", text: successMsg });
        setNewImages([]);
        setNewModel(null);
        setNewVideo(null);
        setImagePreviews([]);
        setReplaceImages(false);

        setTimeout(() => {
          navigate(
            isChangingCategory && data.newCategory
              ? `/admin/products?category=${data.newCategory}`
              : "/admin/products"
          );
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.message || "Update failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="edit-loading"><div className="spinner"></div><p>Loading product...</p></div>;
  }

  if (!product) {
    return (
      <div className="edit-error">
        <p>Product not found</p>
        <button onClick={() => navigate("/admin/products")}>← Back to Products</button>
      </div>
    );
  }

  const currentSubCategories = CATEGORIES_OBJECT[selectedCategory]?.subCategories || [];
  const hasSubCategories = currentSubCategories.length > 0;

  return (
    <div className="edit-product-container">
      <div className="edit-header">
        <button className="back-btn" onClick={() => navigate("/admin/products")}>← Back to Products</button>
        <h2>Edit Product</h2>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}

      <div className="edit-content">
        {/* ── LEFT: Current Info ── */}
        <div className="current-info-section">
          <h3>Current Product Details</h3>

          {/* Visibility */}
          <div className="info-block">
            <label>Visibility</label>
            <div className="current-category">
              <span className={`category-badge ${isHidden ? "badge-hidden" : "badge-visible"}`}>
                {isHidden ? "🙈 Hidden from customers" : "👁️ Visible to customers"}
              </span>
            </div>
            <button type="button" className="remove-btn" onClick={toggleHidden} disabled={saving} style={{ marginTop: "8px" }}>
              {isHidden ? "Unhide Product" : "Hide Product"}
            </button>
            <small className="form-hint">
              {isHidden ? "This product is hidden and won't appear on the storefront." : "This product is live on the storefront."}
            </small>
          </div>

          {/* Price Display */}
          <div className="info-block">
            <label>Price Display</label>
            <div className="current-category">
              <span className={`category-badge ${hidePrice ? "badge-hidden" : "badge-visible"}`}>
                {hidePrice ? "📞 Showing Call/WhatsApp" : "₹ Showing price"}
              </span>
            </div>
            <button type="button" className="remove-btn" onClick={toggleHidePrice} disabled={saving} style={{ marginTop: "8px" }}>
              {hidePrice ? "Show Price Again" : "Hide Price (Show Call/WhatsApp)"}
            </button>
            <small className="form-hint">
              {hidePrice ? 'Customers see "📞 Call / WhatsApp: +91 97136 00059" instead of the price.' : "Customers see the price normally."}
            </small>
          </div>

          {/* Most Selling */}
          <div className="info-block">
            <label>Most Selling</label>
            <div className="current-category">
              <span className={`category-badge ${isMostSelling ? "badge-visible" : "badge-hidden"}`}>
                {isMostSelling ? "🔥 Featured as Most Selling" : "➖ Not in Most Selling"}
              </span>
            </div>
            <button type="button" className="remove-btn" onClick={toggleMostSelling} disabled={saving} style={{ marginTop: "8px" }}>
              {isMostSelling ? "Remove from Most Selling" : "Mark as Most Selling"}
            </button>
            <small className="form-hint">
              {isMostSelling ? "This product appears in the Most Selling section." : "Feature this product in the Most Selling section."}
            </small>
          </div>

          {/* Category */}
          <div className="info-block">
            <label>Current Category</label>
            <div className="current-category">
              <span className="category-badge">{getCategoryLabel(product.category || category)}</span>
            </div>
            {product.subCategory && (
              <div className="current-subcategory">
                <small>Subcategory: {getSubCategoryLabel(product.category || category, product.subCategory)}</small>
              </div>
            )}
          </div>

          {/* Altar Specs */}
          {product.category === "altars" && (product.altarSize || product.altarDesign) && (
            <div className="info-block">
              <label>Current Altar Specifications</label>
              <div className="current-altar-specs">
                {product.altarSize && <div className="spec-item"><strong>Size:</strong> {product.altarSize}</div>}
                {product.altarDesign && <div className="spec-item"><strong>Design:</strong> {product.altarDesign}</div>}
              </div>
            </div>
          )}

          {/* Ready Stock Status */}
          <div className="info-block">
            <label>Ready Stock Status</label>
            <div className="current-category">
              <span className={`category-badge ${inReadyStock ? "badge-visible" : "badge-hidden"}`}>
                {inReadyStock ? `📦 In Ready Stock — ${readyStockQuantity || "?"} units` : "❌ Not in Ready Stock"}
              </span>
            </div>
          </div>

          {/* Images */}
          <div className="info-block">
            <label>Current Images ({product.images?.length || 0})</label>
            <div className="current-images-grid">
              {product.images?.map((img, idx) => (
                <div key={idx} className="image-with-remove">
                  <img src={img.url} alt={`Product ${idx + 1}`} />
                  <button className="remove-image-btn" onClick={() => removeImage(idx)} disabled={saving} title="Remove this image">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Model */}
          <div className="info-block">
            <label>3D Model</label>
            {product.hasModel ? (
              <div className="current-file">
                <span>✅ Model available</span>
                <button className="remove-btn" onClick={() => removeExistingMedia("removeModel")} disabled={saving}>Remove</button>
              </div>
            ) : (
              <p className="no-file">❌ No model uploaded</p>
            )}
          </div>

          {/* Video */}
          <div className="info-block">
            <label>Video</label>
            {product.video ? (
              <div className="current-file">
                <video src={product.video} controls className="video-preview" />
                <button className="remove-btn" onClick={() => removeExistingMedia("removeVideo")} disabled={saving}>Remove</button>
              </div>
            ) : (
              <p className="no-file">❌ No video uploaded</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Edit Form ── */}
        <div className="edit-form-section">
          <h3>Update Product Information</h3>

          {/* Category */}
          <div className="form-group">
            <label>Change Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const newCat = e.target.value;
                setSelectedCategory(newCat);
                setSubCategory("");
                if (newCat !== "altars") { setAltarSize(""); setAltarDesign(""); }
              }}
              className="category-select"
            >
              {Object.entries(CATEGORIES_OBJECT).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
            {selectedCategory !== category && (
              <small className="form-hint warning">
                ⚠️ This will move the product to the "{getCategoryLabel(selectedCategory)}" category
              </small>
            )}
          </div>

          {/* Subcategory */}
          {hasSubCategories && (
            <div className="form-group subcategory-group">
              <label>
                Subcategory * <span className="label-hint">for {getCategoryLabel(selectedCategory)}</span>
              </label>
              <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="category-select subcategory-select">
                <option value="">-- Select Subcategory --</option>
                {currentSubCategories.map((sub) => (
                  <option key={sub.value} value={sub.value}>{sub.label}</option>
                ))}
              </select>
              {product.subCategory && subCategory !== product.subCategory && (
                <small className="form-hint">
                  Current: {getSubCategoryLabel(product.category || category, product.subCategory)}
                </small>
              )}
            </div>
          )}

          {/* Altar Specifications */}
          {selectedCategory === "altars" && (
            <div className="altar-specifications-section">
              <h3 className="altar-specifications-title">🕉️ Altar Specifications</h3>
              <div className="altar-spec-group form-group">
                <label>{ALTAR_SPECIFICATIONS.size.label} *</label>
                <select value={altarSize} onChange={(e) => setAltarSize(e.target.value)} className="category-select altar-spec-select">
                  <option value="">-- Select Size --</option>
                  {ALTAR_SPECIFICATIONS.size.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="altar-spec-group form-group">
                <label>{ALTAR_SPECIFICATIONS.design.label} *</label>
                <select value={altarDesign} onChange={(e) => setAltarDesign(e.target.value)} className="category-select altar-spec-select">
                  <option value="">-- Select Design --</option>
                  {ALTAR_SPECIFICATIONS.design.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Name & Price */}
          <div className="form-group">
            <label>Product Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter product name" />
          </div>

          <div className="form-group">
            <label>Price (₹) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </div>

          {/* Description */}
          <div className="description-section">
            <h3 className="description-section-title">📝 Product Description</h3>
            <div className="form-group">
              <label>Tagline / Headline</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder='e.g. "Handcrafted Royal Prabhupada Altar in Teak & Gold Finish"' maxLength={120} />
              <small className="form-hint">{tagline.length}/120 characters</small>
            </div>
            <div className="form-group">
              <label>About this Item <span className="label-hint">shown as a description on the product page</span></label>
              <textarea value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Enter product description, features, pricing options, materials, etc." rows={10} />
            </div>
            <div className="form-group">
              <label>Specifications <span className="label-hint">shown as a table on product page</span></label>
              <div className="specs-table">
                <div className="specs-header-row">
                  <span className="specs-col-label">Attribute</span>
                  <span className="specs-col-label">Value</span>
                  <span className="specs-col-action" />
                </div>
                {specs.map((spec, index) => (
                  <div key={index} className="spec-row">
                    <input type="text" value={spec.key} onChange={(e) => handleSpecChange(index, "key", e.target.value)} placeholder="e.g. Material" className="spec-input" />
                    <input type="text" value={spec.value} onChange={(e) => handleSpecChange(index, "value", e.target.value)} placeholder="e.g. Teak Wood" className="spec-input" />
                    <button type="button" className="remove-feature-btn" onClick={() => removeSpec(index)} disabled={specs.length === 1} title="Remove">✕</button>
                  </div>
                ))}
              </div>
              {specs.length < 15 && <button type="button" className="add-row-btn" onClick={addSpec}>+ Add Row</button>}
            </div>
          </div>

          {/* Visibility */}
          <div className="form-group ready-stock-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
              <span className="checkbox-text">🙈 Hide from customers</span>
            </label>
            <small className="form-hint">
              {isHidden ? "Hidden — won't appear on the storefront until unchecked and saved." : "Visible to customers."}
            </small>
          </div>

          {/* Hide price */}
          <div className="form-group ready-stock-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={hidePrice} onChange={(e) => setHidePrice(e.target.checked)} />
              <span className="checkbox-text">📞 Hide price (show Call / WhatsApp instead)</span>
            </label>
            <small className="form-hint">
              {hidePrice ? 'Customers will see "📞 Call / WhatsApp: +91 97136 00059" in place of the price.' : "Check to replace the displayed price with a Call/WhatsApp prompt."}
            </small>
          </div>

          {/* Most Selling */}
          <div className="form-group ready-stock-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={isMostSelling} onChange={(e) => setIsMostSelling(e.target.checked)} />
              <span className="checkbox-text">🔥 Mark as Most Selling</span>
            </label>
            <small className="form-hint">
              {isMostSelling ? "This product will appear in the Most Selling section on the storefront." : "Check to feature this product in the Most Selling section."}
            </small>
          </div>

          {/* Ready Stock */}
          <div className="form-group ready-stock-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={inReadyStock} onChange={(e) => { setInReadyStock(e.target.checked); if (!e.target.checked) setReadyStockQuantity(""); }} />
              <span className="checkbox-text">📦 Add to Ready Stock</span>
            </label>
            {inReadyStock && (
              <div className="quantity-input-wrapper">
                <input type="number" value={readyStockQuantity} onChange={(e) => setReadyStockQuantity(e.target.value)} placeholder="Enter quantity" min="1" className="quantity-input" />
                <small className="form-hint">Number of units available for immediate delivery</small>
              </div>
            )}
          </div>

          {/* Images */}
          <div className="form-group">
            <label>{replaceImages ? "Replace All Images" : "Add New Images"}</label>
            <div className="image-mode-toggle">
              <label className="toggle-option">
                <input type="radio" checked={!replaceImages} onChange={() => setReplaceImages(false)} />
                <span>Add to existing ({10 - (product.images?.length || 0)} slots available)</span>
              </label>
              <label className="toggle-option">
                <input type="radio" checked={replaceImages} onChange={() => setReplaceImages(true)} />
                <span>Replace all images</span>
              </label>
            </div>
            <div
              className={`image-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPaste={handlePaste}
              tabIndex={0}
              style={{ border: "2px dashed #ccc", borderRadius: "8px", padding: "24px", textAlign: "center", cursor: "pointer", background: isDragging ? "#f0f8ff" : "transparent", outline: "none" }}
            >
              <p style={{ margin: 0, color: "#666" }}>📎 Drag & drop images here, paste (Ctrl+V), or click below</p>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="file-input" style={{ marginTop: "12px" }} />
            </div>
            <small className="form-hint">
              {replaceImages ? "Max 5 images — will delete all existing images" : `Can add up to ${10 - (product.images?.length || 0)} more images`}
            </small>
            {imagePreviews.length > 0 && (
              <div className="new-images-preview">
                {imagePreviews.map((preview, idx) => <img key={idx} src={preview} alt={`Preview ${idx + 1}`} />)}
              </div>
            )}
          </div>

          {/* 3D Model */}
          <div className="form-group">
            <label>Upload New 3D Model (GLB/GLTF)</label>
            <input type="file" accept=".glb,.gltf" onChange={handleModelChange} className="file-input" />
            {newModel && <p className="file-name">📦 {newModel.name}</p>}
            <small className="form-hint">Will replace existing model if any</small>
          </div>

          {/* Video */}
          <div className="form-group">
            <label>Upload New Video</label>
            <input type="file" accept="video/*" onChange={handleVideoChange} className="file-input" />
            {newVideo && <p className="file-name">🎥 {newVideo.name}</p>}
            <small className="form-hint">Will replace existing video if any</small>
          </div>

          <div className="form-actions">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}