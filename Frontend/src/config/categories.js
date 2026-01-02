// src/config/categories.js
// Centralized categories and subcategories configuration

export const CATEGORIES = [
  { 
    value: "all", 
    label: "All Products",
    subCategories: []
  },
  { 
    value: "altars", 
    label: "Home Altars",
    subCategories: [
      { value: "medium", label: "Medium Size" },
      { value: "small", label: "Small Size" },
      { value: "large", label: "Large Size" },
      { value: "tovp", label: "TOVP Style Altar" },
    ]
  },
  {
    value: "temple_altar",
    label: "Temple Altars",
    subCategories: [
      { value: "tm-altar", label: "Temple Altar" },
    ]
  },
  {
    value: "Prabhupada_altars",
    label: "Prabhupada Altars",
    subCategories: [
      { value: "SP_altars", label: "Prabhupada Altar" },
    ]
  },
  { 
    value: "deities", 
    label: "Deities",
    subCategories: [
      { value: "sp", label: "SP Deity" },
      { value: "guru-parampara", label: "Guru Parampara" },
      { value: "gn-deity", label: "Gaur Nitai Deity" },
      { value: "haridas", label: "Srila Haridas Thakur Deity" },
      { value: "yashoda-damodara", label: "Krishna & Ram Deities" },
      { value: "custom-deity", label: "Other Deity" },    
    ]
  },
  { 
    value: "sculptures", 
    label: "3D Reliefs",
    subCategories: [
      { value: "Gaura-Lila", label: "Gaura Lila" },
      { value: "Krishna-Lila", label: "Krishna Lila" },
      { value: "Other-Deities", label: "Other Deities" },
    ]
  },
  { 
    value: "Laser_Engravings", 
    label: "Laser Engravings",
    subCategories: [
      { value: "mahamantra-bangla", label: "Mahamantra (Bangla)" },
      { value: "mahamantra-hindi", label: "Mahamantra (Hindi)" },
      { value: "mahamantra-english", label: "Mahamantra (English)" },
      { value: "sp-quote", label: "Prabhupada Quote" },
      { value: "others", label: "Others" },
    ]
  },
  {
    value: "mridanga_stand",
    label: "Mridangam Stand",
    subCategories: [
      { value: "mridangam-stand", label: "Mridangam Stand" },
    ]
  },
  {
    value: "tulsi_table_vyasasna",
    label: "Tulsi Table & Vyasasan",
    subCategories: [
      { value: "tulsi-table", label: "Tulsi Table" },
      { value: "vyasasan", label: "Vyasasan" },
    ]
  },
  { 
    value: "furniture", 
    label: "Spiritual Furniture",
    subCategories: [
      { value: "reception-table", label: "Reception Table" },
      { value: "doors", label: "Temple Doors" },
      { value: "bookshelf", label: "Bookshelf" },
    ]
  },
];

// Helper function to get category label by value
export const getCategoryLabel = (categoryValue) => {
  const category = CATEGORIES.find(cat => cat.value === categoryValue);
  return category ? category.label : categoryValue;
};

// Helper function to get subcategory label
export const getSubCategoryLabel = (categoryValue, subCategoryValue) => {
  const category = CATEGORIES.find(cat => cat.value === categoryValue);
  if (!category) return subCategoryValue;
  
  const subCategory = category.subCategories.find(sub => sub.value === subCategoryValue);
  return subCategory ? subCategory.label : subCategoryValue;
};

// Get all category values (excluding "all") for fetching
export const getCategoryValues = () => {
  return CATEGORIES
    .filter(cat => cat.value !== "all")
    .map(cat => cat.value);
};

// Convert to object format (for components that need it)
export const CATEGORIES_OBJECT = CATEGORIES.reduce((acc, cat) => {
  if (cat.value !== "all") {
    acc[cat.value] = {
      label: cat.label,
      subCategories: cat.subCategories
    };
  }
  return acc;
}, {});