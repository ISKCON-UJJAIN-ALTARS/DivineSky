import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCategoryLabel } from "../config/categories";
import { API_ENDPOINTS } from "../config/api";
import "@google/model-viewer";
import "../styles/ProductDetail.css";

import { Helmet } from "react-helmet-async";




export default function ProductDetail() {
  const { category, id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  
  // Touch/Swipe handling
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // WhatsApp number
  const WHATSAPP_NUMBER = "919713600059";

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    fetchProduct();
  }, [category, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching product:", id, "from category:", category);

      const response = await fetch(API_ENDPOINTS.products.getByCategoryAndId(category, id));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched product:", data);

      if (data.success && data.product) {
        setProduct(data.product);
        console.log("Images:", data.product.images);
        console.log("Has Model:", data.product.hasModel);
      } else {
        throw new Error("Product not found");
      }

      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;

    const productUrl = window.location.href;  
    const message = `Hello! I'm interested in ordering this product:

📦 *${product.name}*
💰 Price: ${formatPrice(product.price)}
🆔 Product ID: ${product.id}
📂 Category: ${getCategoryLabel(product.category)}
🔗 Product Link: ${productUrl}


Please provide more details about availability and delivery.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
  };

  const handleModelLoad = () => {
    console.log("Model loaded successfully");
    setModelLoading(false);
    setModelError(false);
  };

  const handleModelError = (e) => {
    console.error("Model load error:", e);
    setModelLoading(false);
    setModelError(true);
  };

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && product.images) {
      setSelectedImageIndex((prev) => 
        prev < product.images.length - 1 ? prev + 1 : 0
      );
    }
    
    if (isRightSwipe && product.images) {
      setSelectedImageIndex((prev) => 
        prev > 0 ? prev - 1 : product.images.length - 1
      );
    }
  };

  const goToNextImage = () => {
    if (product.images) {
      setSelectedImageIndex((prev) => 
        prev < product.images.length - 1 ? prev + 1 : 0
      );
    }
  };

  const goToPreviousImage = () => {
    if (product.images) {
      setSelectedImageIndex((prev) => 
        prev > 0 ? prev - 1 : product.images.length - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-error">
        <div className="error-icon">❌</div>
        <h2>Product Not Found</h2>
        <p>{error || "The product you're looking for doesn't exist."}</p>
        <button onClick={() => navigate('/catalog')} className="back-btn">
          ← Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">


<Helmet>
  <title>{product?.name} | Divine Sky</title>
  <meta
    name="description"
    content={product?.description}
  />
  <link
    rel="canonical"
    href={`https://divinesky.vercel.app/product/${category}/${id}`}
  />
</Helmet>

      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>

      <div className="product-detail-wrapper">
        <div className="viewer-section">
          {showModel && product.hasModel ? (
            <div className="model-viewer-container">
              {modelError ? (
                <div className="model-error-placeholder">
                  <div className="error-icon">⚠️</div>
                  <p>Failed to load 3D model</p>
                  <small>The model file may be corrupted or unavailable</small>
                  <button 
                    onClick={() => {
                      setModelError(false);
                      setModelLoading(true);
                    }} 
                    className="retry-model-btn"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <model-viewer
                    src={product.model}
                    alt={product.name}
                    camera-controls
                    auto-rotate
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    shadow-intensity="1"
                    environment-image="neutral"
                    exposure="1"
                    className="model-viewer"
                    onLoad={handleModelLoad}
                    onError={handleModelError}
                  >
                    {modelLoading && (
                      <div className="model-loading" slot="poster">
                        <div className="spinner"></div>
                        <p>Loading 3D Model...</p>
                      </div>
                    )}
                  </model-viewer>

                  <div className="model-controls-info">
                    <div className="control-tip">
                      <span className="control-icon">🖱️</span>
                      <span>Drag to rotate</span>
                    </div>
                    <div className="control-tip">
                      <span className="control-icon">🔍</span>
                      <span>Scroll to zoom</span>
                    </div>
                    <div className="control-tip">
                      <span className="control-icon">📱</span>
                      <span>AR available on mobile</span>
                    </div>
                  </div>
                </>
              )}
              
              <button 
                className="toggle-view-btn"
                onClick={() => setShowModel(false)}
              >
                ← Back to Gallery
              </button>
            </div>
          ) : showVideo && product.video ? (
            <div className="video-viewer-container">
              <video 
                src={product.video} 
                controls 
                className="product-video-player"
                poster={product.images?.[0]?.url}
              >
                Your browser does not support the video tag.
              </video>
              
              <button 
                className="toggle-view-btn"
                onClick={() => setShowVideo(false)}
              >
                ← Back to Gallery
              </button>
            </div>
          ) : (
            <div className="image-gallery-container">
              <div 
                className="main-image-display"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {product.images && product.images.length > 0 ? (
                  <>
                    <img 
                      src={product.images[selectedImageIndex].url} 
                      alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                      className="main-product-image"
                    />
                    
                    {product.images.length > 1 && (
                      <>
                        <button 
                          className="image-nav-btn prev-btn"
                          onClick={goToPreviousImage}
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button 
                          className="image-nav-btn next-btn"
                          onClick={goToNextImage}
                          aria-label="Next image"
                        >
                          ›
                        </button>
                        
                        <div className="image-counter">
                          {selectedImageIndex + 1} / {product.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="no-image-placeholder">
                    <span className="placeholder-icon">📷</span>
                    <p>No images available</p>
                  </div>
                )}
              </div>

              {product.images && product.images.length > 1 && (
                <div className="thumbnail-gallery">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img src={image.url} alt={`Thumbnail ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}

              {product.hasModel && (
                <button 
                  className="show-model-btn"
                  onClick={() => setShowModel(true)}
                >
                  <span>🎨</span> View 3D Model
                </button>
              )}

              {product.video && (
                <button 
                  className="show-video-btn"
                  onClick={() => setShowVideo(true)}
                >
                  <span>🎥</span> Watch Video
                </button>
              )}
            </div>
          )}
        </div>

        <div className="product-info-section">
          {product.category && (
            <div className="product-category-tag">
              {getCategoryLabel(product.category)}
            </div>
          )}

          <h1 className="product-title">{product.name}</h1>

          <div className="product-price-section">
            <span className="product-price-label">Price:</span>
            <span className="product-price-value">{formatPrice(product.price)}</span>
          </div>

          {product.description && (
            <div className="product-description-section">
              <h3>Description</h3>
              <p className="product-description-text">{product.description}</p>
            </div>
          )}

          <div className="product-details-grid">
            <div className="detail-item">
              <span className="detail-label">Product ID:</span>
              <span className="detail-value">{product.id}</span>
            </div>
            {product.category && (
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{getCategoryLabel(product.category)}</span>
              </div>
            )}
            {product.hasModel && (
              <div className="detail-item">
                <span className="detail-label">3D Model:</span>
                <span className="detail-value">✅ Available</span>
              </div>
            )}
            {!product.hasModel && (
              <div className="detail-item">
                <span className="detail-label">3D Model:</span>
                <span className="detail-value">⏳ Under Process</span>
              </div>
            )}
            {product.created_at && (
              <div className="detail-item">
                <span className="detail-label">Added:</span>
                <span className="detail-value">
                  {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="product-actions">
            <button className="btn-primary whatsapp-order-btn" onClick={handleWhatsAppOrder}>
              <span>💬</span> Order via WhatsApp
            </button>
            {product.hasModel && (
              <button 
                className="btn-secondary" 
                onClick={() => window.open(product.model, '_blank')}
              >
                <span>📥</span> Download Model
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}