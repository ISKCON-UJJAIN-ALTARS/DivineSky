import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Upload from "../components/Admin_Components/Upload";
import ManageProducts from "../components/Admin_Components/ManageProducts";
import "../styles/Admin/Admin.css";

import { Helmet } from "react-helmet-async";

<Helmet>
  <title>Divine Sky - ISKCON Ujjain Altars</title>
  <meta
    name="description"
    content="Handcrafted wooden altars, deities, Tulsi tables and temple furniture from ISKCON Ujjain."
  />
</Helmet>

export default function Admin() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard", "upload", "manage"

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <p>Manage your products and content</p>
        </div>
       
        <button 
          className="admin-logout-btn" 
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </header>

      <main className="admin-main">
        {activeView === "dashboard" && (
          <div className="dashboard-container">
            <h2 className="dashboard-title">What would you like to do?</h2>
            
            <div className="dashboard-cards">
              {/* Upload New Product Card */}
              <div 
                className="dashboard-card"
                onClick={() => setActiveView("upload")}
              >
                <div className="card-icon">📦</div>
                <h3 className="card-title">Upload New Product</h3>
                <p className="card-description">
                  Add a new product with images and optional 3D model
                </p>
                <div className="card-arrow">→</div>
              </div>

              {/* Manage Products Card */}
              <div 
                className="dashboard-card"
                onClick={() => setActiveView("manage")}
              >
                <div className="card-icon">🎨</div>
                <h3 className="card-title">Manage Products</h3>
                <p className="card-description">
                  Add 3D models to existing products or manage catalog
                </p>
                <div className="card-arrow">→</div>
              </div>

              {/* Manage Testimonials Card */}
              <div 
                className="dashboard-card"
                onClick={() => navigate("/admin/testimonials")}
              >
                <div className="card-icon">💬</div>
                <h3 className="card-title">Manage Testimonials</h3>
                <p className="card-description">
                  Add and manage testimonials from devotees
                </p>
                <div className="card-arrow">→</div>
              </div>

             {/*Manage Gallery Card */}
              <div 
                className="dashboard-card"
                onClick={() => navigate("/admin/gallery")}
              >
                <div className="card-icon">🖼️</div>
                <h3 className="card-title">Manage Gallery</h3>
                <p className="card-description">
                  Add and manage gallery images
                </p>
                <div className="card-arrow">→</div>
              </div>

            </div>
          </div>
        )}

        {activeView === "upload" && (
          <div className="view-container">
            <button 
              className="back-to-dashboard-btn"
              onClick={() => setActiveView("dashboard")}
            >
              ← Back to Dashboard
            </button>
            <Upload />
          </div>
        )}

        {activeView === "manage" && (
          <div className="view-container">
            <button 
              className="back-to-dashboard-btn"
              onClick={() => setActiveView("dashboard")}
            >
              ← Back to Dashboard
            </button>
            <ManageProducts />
          </div>
        )}
      </main>
    </div>
  );
}