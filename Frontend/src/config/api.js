// src/config/api.js

// Get API base URL from environment variable or use default
// For Vite: use import.meta.env
// For CRA: use process.env
const API_BASE_URL = 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'https://divinesky-613l.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Products
  products: {
    // NEW: Get all products from all categories (OPTIMIZED!)
    getAll: (page = 1, limit = 100) => `${API_BASE_URL}/products?page=${page}&limit=${limit}`,
    getByCategory: (category) => `${API_BASE_URL}/products/${category}`,
    getByCategoryAndId: (category, id) => `${API_BASE_URL}/products/${category}/${id}`,
    getById: (id) => `${API_BASE_URL}/products/id/${id}`,
    getReadyStock: (page = 1, limit = 20) => `${API_BASE_URL}/products/ready-stock?page=${page}&limit=${limit}`,
    getBySubCategory: (category, subCategory, page = 1, limit = 10) => 
      `${API_BASE_URL}/products/subcategory/${category}/${subCategory}?page=${page}&limit=${limit}`,
  },
  
  // Admin
  admin: {
    upload: () => `${API_BASE_URL}/admin/upload`,
    getProduct: (category, id) => `${API_BASE_URL}/admin/products/${category}/${id}`,
    updateProduct: (category, id) => `${API_BASE_URL}/admin/products/${category}/${id}`,
    deleteProduct: (category, id) => `${API_BASE_URL}/admin/products/${category}/${id}`,
    removeImage: (category, id) => `${API_BASE_URL}/admin/products/${category}/${id}/remove-image`,
  },
  
  // Auth
  auth: {
    login: () => `${API_BASE_URL}/auth/login`,
    register: () => `${API_BASE_URL}/auth/register`,
  },

  // Testimonials
  testimonials: {
    getAll: () => `${API_BASE_URL}/api/testimonials`,
    create: () => `${API_BASE_URL}/api/testimonials`,
    update: (id) => `${API_BASE_URL}/api/testimonials/${id}`,
    delete: (id) => `${API_BASE_URL}/api/testimonials/${id}`,
  },

  // Gallery
gallery: {
  getAll: () => `${API_BASE_URL}/api/gallery`,
  upload: () => `${API_BASE_URL}/api/gallery/upload`,
  delete: (section, id) => `${API_BASE_URL}/api/gallery/${section}/${id}`,
  update: (section, id) => `${API_BASE_URL}/api/gallery/${section}/${id}`,
},


};

// Export base URL for direct use if needed
export default API_BASE_URL;