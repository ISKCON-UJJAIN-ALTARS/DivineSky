import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../config/api";
import "../../styles/Admin/ManageGallery.css";

export default function ManageGallery() {
  const [galleryData, setGalleryData] = useState({
    hero: null,
    guests: [],
    workshop: [],
    team: [],
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploading, setUploading] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    section: "guests",
    caption: "",
    photo: null,
    featured: false,
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.gallery.getAll());
      const data = await response.json();

      if (data.success) {
        setGalleryData({
          hero: data.hero,
          guests: data.guests || [],
          workshop: data.workshop || [],
          team: data.team || [],
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching gallery:", err);
      setMessage({ type: "error", text: "Failed to load gallery" });
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.photo) {
      setMessage({ type: "error", text: "Please select a photo" });
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("photo", uploadForm.photo);
      formData.append("section", uploadForm.section);
      formData.append("caption", uploadForm.caption);
      formData.append("featured", uploadForm.featured);

      const response = await fetch(API_ENDPOINTS.gallery.upload(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "✅ Photo uploaded successfully" });
        fetchGallery();
        resetForm();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to upload" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ type: "error", text: "Failed to upload photo" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (section, id) => {
    if (!confirm("Delete this photo? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(API_ENDPOINTS.gallery.delete(section, id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "✅ Photo deleted" });
        fetchGallery();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to delete" });
      }
    } catch (err) {
      console.error("Delete error:", err);
      setMessage({ type: "error", text: "Failed to delete photo" });
    }
  };

  const resetForm = () => {
    setUploadForm({
      section: "guests",
      caption: "",
      photo: null,
      featured: false,
    });
    setPhotoPreview(null);
  };

  if (loading) {
    return (
      <div className="manage-loading">
        <div className="spinner"></div>
        <p>Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="manage-container">
      <div className="manage-header">
        <div>
          <h2>Manage Gallery</h2>
          <p className="subtitle">Upload and manage workshop, guest, and team photos</p>
        </div>
      </div>

      {/* Status Message */}
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Upload Form */}
      <div className="upload-card">
        <h3>Upload New Photo</h3>
        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-group">
              <label>Section *</label>
              <select
                value={uploadForm.section}
                onChange={(e) => setUploadForm(prev => ({ ...prev, section: e.target.value }))}
                required
              >
                <option value="hero">Hero Banner</option>
                <option value="guests">Distinguished Guests</option>
                <option value="workshop">Workshop</option>
                <option value="team">Team</option>
              </select>
              <small>Choose where this photo will appear</small>
            </div>

            <div className="form-group">
              <label>Caption</label>
              <input
                type="text"
                value={uploadForm.caption}
                onChange={(e) => setUploadForm(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="e.g., HG Gauranga Prabhu Visit"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Photo *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              required
            />
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
              </div>
            )}
          </div>

          <button type="submit" className="btn-upload" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </form>
      </div>

      {/* Hero Section */}
      <div className="gallery-section-admin">
        <h3 className="section-title-admin">
          Hero Banner
          <span className="photo-count">{galleryData.hero ? "1 photo" : "No photo"}</span>
        </h3>
        {galleryData.hero ? (
          <div className="photo-grid">
            <div className="photo-item hero-item">
              <img src={galleryData.hero.url} alt={galleryData.hero.caption} />
              <div className="photo-info">
                <p className="photo-caption-admin">{galleryData.hero.caption || "No caption"}</p>
                <button
                  className="btn-delete-small"
                  onClick={() => handleDelete("hero", galleryData.hero.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="empty-hint">No hero image uploaded yet</p>
        )}
      </div>

      {/* Guests Section */}
      <div className="gallery-section-admin">
        <h3 className="section-title-admin">
          Distinguished Guests
          <span className="photo-count">{galleryData.guests.length} photos</span>
        </h3>
        {galleryData.guests.length > 0 ? (
          <div className="photo-grid">
            {galleryData.guests.map((photo) => (
              <div key={photo.id} className="photo-item">
                <img src={photo.url} alt={photo.caption} />
                <div className="photo-info">
                  <p className="photo-caption-admin">{photo.caption || "No caption"}</p>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDelete("guests", photo.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-hint">No guest photos uploaded yet</p>
        )}
      </div>

      {/* Workshop Section */}
      <div className="gallery-section-admin">
        <h3 className="section-title-admin">
          Workshop
          <span className="photo-count">{galleryData.workshop.length} photos</span>
        </h3>
        {galleryData.workshop.length > 0 ? (
          <div className="photo-grid">
            {galleryData.workshop.map((photo) => (
              <div key={photo.id} className="photo-item">
                <img src={photo.url} alt={photo.caption} />
                <div className="photo-info">
                  <p className="photo-caption-admin">{photo.caption || "No caption"}</p>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDelete("workshop", photo.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-hint">No workshop photos uploaded yet</p>
        )}
      </div>

      {/* Team Section */}
      <div className="gallery-section-admin">
        <h3 className="section-title-admin">
          Team
          <span className="photo-count">{galleryData.team.length} photos</span>
        </h3>
        {galleryData.team.length > 0 ? (
          <div className="photo-grid">
            {galleryData.team.map((photo) => (
              <div key={photo.id} className="photo-item">
                <img src={photo.url} alt={photo.caption} />
                <div className="photo-info">
                  <p className="photo-caption-admin">{photo.caption || "No caption"}</p>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDelete("team", photo.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-hint">No team photos uploaded yet</p>
        )}
      </div>
    </div>
  );
}