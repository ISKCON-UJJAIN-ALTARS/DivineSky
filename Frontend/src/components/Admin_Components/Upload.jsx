import { useState } from "react";
import { CATEGORIES_OBJECT } from "../../config/categories";
import { ALTAR_SPECIFICATIONS } from "../../config/altarSpecifications";
import { API_ENDPOINTS } from "../../config/api";
import "../../styles/Admin/Upload.css";

export default function Upload() {

  // ─── Bulk add specs ─────────────────────────────────────────────
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const [bulkSpecsText, setBulkSpecsText] = useState("");
  
  const [model, setModel] = useState(null);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [includeModel, setIncludeModel] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("altars");
  const [subCategory, setSubCategory] = useState("");

  const [tagline, setTagline] = useState("");
  const [features, setFeatures] = useState("");
  const [specs, setSpecs] = useState([{ key: "", value: "" }]);

  const [altarSize, setAltarSize] = useState("");
  const [altarDesign, setAltarDesign] = useState("");

  const [hidePrice, setHidePrice] = useState(false);
  const [isMostSelling, setIsMostSelling] = useState(false);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // ─── File handlers ─────────────────────────────────────────────
  const handleModelChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isGLB = file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf");
    if (!isGLB) { alert("Only GLB / GLTF models are allowed"); return; }
    if (file.size > 50 * 1024 * 1024) { alert("Model must be under 50MB"); return; }
    setModel(file);
  };

  const processImageFiles = (fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    if (images.length + files.length > 5) { alert("You can upload a maximum of 5 images"); return; }
    for (const file of files) {
      if (!file.type.startsWith("image/")) { alert(`${file.name || "File"} is not an image file`); return; }
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name || "File"} is larger than 10MB`); return; }
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleImagesChange = (e) => processImageFiles(e.target.files);
  const handleImageDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleImageDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleImageDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) processImageFiles(e.dataTransfer.files); };
  const handleImagePaste = (e) => {
    const files = Array.from(e.clipboardData?.items || [])
      .filter((i) => i.type.startsWith("image/"))
      .map((i) => i.getAsFile())
      .filter(Boolean);
    if (files.length > 0) processImageFiles(files);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { alert("Only video files allowed"); return; }
    if (file.size > 100 * 1024 * 1024) { alert("Video must be under 100MB"); return; }
    setVideo(file);
    const reader = new FileReader();
    reader.onloadend = () => setVideoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    setSubCategory("");
    if (newCategory !== "altars") { setAltarSize(""); setAltarDesign(""); }
  };
  
  // ─── Bulk add specs ─────────────────────────────────────────────
  // Parses lines like "Material: Teak Wood" / "Material - Teak Wood" /
  // "Material = Teak Wood" / "Material<TAB>Teak Wood" into {key, value}
  // pairs. A line with no recognizable delimiter becomes a key with an
  // empty value, so the user can still see it and fill it in manually.
  const parseBulkSpecsText = (text) => {
    const delimiters = [":", "\t", " - ", "=", "-"];
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        for (const d of delimiters) {
          const idx = line.indexOf(d);
          if (idx > 0) {
            return {
              key: line.slice(0, idx).trim(),
              value: line.slice(idx + d.length).trim(),
            };
          }
        }
        return { key: line, value: "" };
      })
      .filter((s) => s.key);
  };

  const handleBulkAddSpecs = () => {
    const parsed = parseBulkSpecsText(bulkSpecsText);
    if (parsed.length === 0) return;

    setSpecs((prev) => {
      const existingFilled = prev.filter((s) => s.key.trim() || s.value.trim());
      const combined = [...existingFilled, ...parsed].slice(0, 15);
      return combined.length ? combined : [{ key: "", value: "" }];
    });

    setBulkSpecsText("");
    setShowBulkAdd(false);
    setMessage({ type: "success", text: `✅ Added ${parsed.length} spec row${parsed.length !== 1 ? "s" : ""}` });
    setTimeout(() => setMessage({ type: "", text: "" }), 2000);
  };

  // ─── Upload ────────────────────────────────────────────────────
  const uploadProduct = () => {
    if (!name || !price) { alert("Name and price are required"); return; }
    if (includeModel && !model) { alert("Please upload a 3D model or uncheck the option"); return; }
    if (images.length === 0) { alert("Please upload at least one image"); return; }

    const hasSubCategories = CATEGORIES_OBJECT[category]?.subCategories?.length > 0;
    if (hasSubCategories && !subCategory) { alert("Please select a subcategory"); return; }
    if (category === "altars") {
      if (!altarSize) { alert("Please select an altar size"); return; }
      if (!altarDesign) { alert("Please select an altar design"); return; }
    }

    const descriptionData = {
      tagline: tagline.trim(),
      features: features.trim(),
      specs: specs.filter((s) => s.key.trim() && s.value.trim()),
    };

    const formData = new FormData();
    if (includeModel && model) formData.append("model", model);
    images.forEach((image) => formData.append("images", image));
    if (video) formData.append("video", video);
    formData.append("name", name);
    formData.append("price", price);
    formData.append("description", JSON.stringify(descriptionData));
    formData.append("category", category);
    formData.append("subCategory", subCategory);
    formData.append("includeModel", includeModel);
    formData.append("hidePrice", hidePrice ? "true" : "false");
    formData.append("mostSelling", isMostSelling ? "true" : "false");
    if (category === "altars") {
      formData.append("altarSize", altarSize);
      formData.append("altarDesign", altarDesign);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_ENDPOINTS.admin.upload());
    const token = localStorage.getItem("admin_token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    setIsUploading(true);
    setStatus("uploading");
    setProgress(0);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200 || xhr.status === 201) {
        try { JSON.parse(xhr.responseText); setStatus("success"); setProgress(100); setTimeout(() => clearForm(), 2000); }
        catch { setStatus("error"); }
      } else {
        setStatus("error");
      }
    };

    xhr.onerror = () => { setIsUploading(false); setStatus("error"); };
    xhr.send(formData);
  };

  const clearForm = () => {
    setModel(null); setImages([]); setPreviews([]); setVideo(null); setVideoPreview(null);
    setIncludeModel(false); setName(""); setPrice(""); setTagline(""); setFeatures("");
    setSpecs([{ key: "", value: "" }]); setCategory("altars"); setSubCategory("");
    setAltarSize(""); setAltarDesign(""); setHidePrice(false); setIsMostSelling(false);
    setProgress(0); setStatus("");
  };

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

          {/* 3D MODEL TOGGLE */}
          <div className="checkbox-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={includeModel} onChange={(e) => setIncludeModel(e.target.checked)} disabled={isUploading} className="checkbox-input" />
              <span className="checkbox-text">Include 3D Model (Optional)</span>
            </label>
          </div>

          {/* MODEL UPLOAD */}
          {includeModel && (
            <div className="file-section">
              <label className="file-label">
                {model ? (
                  <div className="file-selected">
                    <div className="file-icon">📦</div>
                    <p className="file-name">{model.name}</p>
                    <span className="file-size">{(model.size / 1024 / 1024).toFixed(2)} MB</span>
                    <button type="button" className="remove-file-btn" onClick={(e) => { e.preventDefault(); setModel(null); }}>Remove Model</button>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <div className="upload-icon">📦</div>
                    <p className="placeholder-text">Click to upload 3D Model</p>
                    <span className="placeholder-hint">GLB or GLTF up to 50MB</span>
                  </div>
                )}
                <input type="file" accept=".glb,.gltf" onChange={handleModelChange} style={{ display: "none" }} disabled={isUploading} />
              </label>
            </div>
          )}

          {/* IMAGES UPLOAD */}
          <div className="file-section">
            <label className="images-label">
              <div
                className={`images-upload-area ${isDragging ? "dragging" : ""}`}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                onPaste={handleImagePaste}
                tabIndex={0}
                style={isDragging ? { background: "#f0f8ff", borderColor: "#4a90d9" } : undefined}
              >
                <div className="upload-icon">📸</div>
                <p className="placeholder-text">Drag & drop, paste (Ctrl+V), or click to upload images ({images.length}/5)</p>
                <span className="placeholder-hint">PNG, JPG up to 10MB each · Required</span>
              </div>
              <input type="file" accept="image/*" multiple onChange={handleImagesChange} style={{ display: "none" }} disabled={isUploading || images.length >= 5} />
            </label>
            {previews.length > 0 && (
              <div className="images-preview-grid">
                {previews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} className="preview-thumbnail" />
                    <button type="button" className="remove-image-btn" onClick={() => removeImage(index)} disabled={isUploading}>✕</button>
                    <span className="image-number">{index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VIDEO UPLOAD */}
          <div className="file-section">
            <label className="file-label">
              {videoPreview ? (
                <div className="video-preview">
                  <video src={videoPreview} controls className="preview-video" />
                  <button type="button" className="remove-video-btn" onClick={(e) => { e.preventDefault(); setVideo(null); setVideoPreview(null); }}>Remove Video</button>
                </div>
              ) : (
                <div className="video-placeholder">
                  <div className="upload-icon">🎥</div>
                  <p className="placeholder-text">Click to upload video (optional)</p>
                  <span className="placeholder-hint">MP4, WebM, MOV up to 100MB</span>
                </div>
              )}
              <input type="file" accept="video/*" onChange={handleVideoChange} style={{ display: "none" }} disabled={isUploading} />
            </label>
          </div>

          {/* BASIC FIELDS */}
          <div className="form-group">
            <label className="label">Product Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter product name" className="form-input" disabled={isUploading} />
          </div>

          <div className="form-group">
            <label className="label">Price (INR) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price" className="form-input" disabled={isUploading} />
          </div>

          <div className="checkbox-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={hidePrice} onChange={(e) => setHidePrice(e.target.checked)} disabled={isUploading} className="checkbox-input" />
              <span className="checkbox-text">📞 Hide price (show Call / WhatsApp instead)</span>
            </label>
            <span className="placeholder-hint">
              {hidePrice ? 'Customers will see "📞 Call / WhatsApp: +91 97136 00059" instead of the price.' : "The price above will still be saved and can be shown again later."}
            </span>
          </div>

          {/* CATEGORY */}
          <div className="form-group">
            <label className="label">Category *</label>
            <select value={category} onChange={handleCategoryChange} className="form-select" disabled={isUploading}>
              {Object.entries(CATEGORIES_OBJECT).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          {hasSubCategories && (
            <div className="form-group subcategory-group">
              <label className="label">
                Subcategory * <span className="label-hint">for {CATEGORIES_OBJECT[category].label}</span>
              </label>
              <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="form-select subcategory-select" disabled={isUploading}>
                <option value="">-- Select Subcategory --</option>
                {currentSubCategories.map((sub) => (
                  <option key={sub.value} value={sub.value}>{sub.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* ALTAR SPECIFICATIONS */}
          {category === "altars" && (
            <div className="altar-specifications-section">
              <h3 className="altar-specifications-title">Altar Specifications</h3>
              <div className="altar-spec-group form-group">
                <label className="label">{ALTAR_SPECIFICATIONS.size.label} *</label>
                <select value={altarSize} onChange={(e) => setAltarSize(e.target.value)} className="form-select altar-spec-select" disabled={isUploading}>
                  <option value="">-- Select Size --</option>
                  {ALTAR_SPECIFICATIONS.size.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="altar-spec-group form-group">
                <label className="label">{ALTAR_SPECIFICATIONS.design.label} *</label>
                <select value={altarDesign} onChange={(e) => setAltarDesign(e.target.value)} className="form-select altar-spec-select" disabled={isUploading}>
                  <option value="">-- Select Design --</option>
                  {ALTAR_SPECIFICATIONS.design.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* PRODUCT DESCRIPTION */}
          <div className="description-section">
            <h3 className="description-section-title">📝 Product Description</h3>
            <div className="form-group">
              <label className="label">Tagline / Headline</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder='e.g. "Handcrafted Royal Prabhupada Altar in Teak & Gold Finish"' className="form-input" disabled={isUploading} maxLength={120} />
              <span className="placeholder-hint">{tagline.length}/120 characters</span>
            </div>
            <div className="form-group">
              <label className="label">About this Item <span className="label-hint">shown as a description on the product page</span></label>
              <textarea value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Enter product description, features, pricing options, materials, etc." className="form-input" rows={10} disabled={isUploading} />
            </div>
            <div className="form-group">
              <label className="label">Specifications <span className="label-hint">shown as a table on product page</span></label>             

              <div className="bulk-specs-toggle">
                <button
                  type="button"
                  className="bulk-add-toggle-btn"
                  onClick={() => setShowBulkAdd((v) => !v)}
                >
                  {showBulkAdd ? "✕ Close bulk add" : "⚡ Bulk add from text"}
                </button>
              </div>

              {showBulkAdd && (
                <div className="bulk-specs-panel">
                  <textarea
                    value={bulkSpecsText}
                    onChange={(e) => setBulkSpecsText(e.target.value)}
                    placeholder={"Paste multiple lines, one spec per line:\nMaterial: Teak Wood\nColor: Golden Brown\nDimensions: 5' x 5' x 10'"}
                    rows={6}
                    className="bulk-specs-textarea"
                  />
                  <small className="form-hint">
                    One line per spec. Separate the attribute and value with a colon, dash, equals sign, or tab
                    — e.g. <em>"Material: Teak Wood"</em>. These rows will be added below the existing ones.
                  </small>
                  <button
                    type="button"
                    className="add-row-btn"
                    onClick={handleBulkAddSpecs}
                    disabled={!bulkSpecsText.trim()}
                  >
                    + Generate Rows
                  </button>
                </div>
              )}

              <div className="specs-table">
                <div className="specs-header-row">
                  <span className="specs-col-label">Attribute</span>
                  <span className="specs-col-label">Value</span>
                  <span className="specs-col-action" />
                </div>
                {specs.map((spec, index) => (
                  <div key={index} className="spec-row">
                    <input type="text" value={spec.key} onChange={(e) => handleSpecChange(index, "key", e.target.value)} placeholder="e.g. Material" className="form-input spec-input" disabled={isUploading} />
                    <input type="text" value={spec.value} onChange={(e) => handleSpecChange(index, "value", e.target.value)} placeholder="e.g. Teak Wood" className="form-input spec-input" disabled={isUploading} />
                    <button type="button" className="remove-feature-btn" onClick={() => removeSpec(index)} disabled={isUploading || specs.length === 1} title="Remove">✕</button>
                  </div>
                ))}
              </div>
              {specs.length < 15 && <button type="button" className="add-row-btn" onClick={addSpec} disabled={isUploading}>+ Add Row</button>}
            </div>
          </div>

          {/* MOST SELLING */}
          <div className="checkbox-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={isMostSelling} onChange={(e) => setIsMostSelling(e.target.checked)} disabled={isUploading} className="checkbox-input" />
              <span className="checkbox-text">🔥 Mark as Most Selling</span>
            </label>
            <span className="placeholder-hint">
              {isMostSelling ? "This product will be featured in the Most Selling section on the storefront." : "Check to feature this product in the Most Selling section."}
            </span>
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
            <button type="button" onClick={clearForm} className="btn-secondary" disabled={isUploading}>Clear</button>
            <button type="button" onClick={uploadProduct} className="btn-primary" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Product"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}