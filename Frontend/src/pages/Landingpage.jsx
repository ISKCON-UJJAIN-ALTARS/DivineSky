import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import CategoryGallery from "../components/Category_Gallery_Components/CategoryGallery";
import "../styles/Landingpage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  const NavigateCatalog = () => {
    navigate("/catalog");
  };

  const handleCategoryClick = (slug) => {
    navigate(`/catalog?category=${slug}`);
  };

  // Landing page categories with display images
  const categories = [
    { 
      title: "Home Altars", 
      slug: "altars", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/altars/60fac0cb-b3b1-4c15-bcb9-03e924e4e9d2.jpeg" 
    },
    { 
      title: "Temple Altars", 
      slug: "temple_altar", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/altars/60fac0cb-b3b1-4c15-bcb9-03e924e4e9d2.jpeg" 
    },
    { 
      title: "Prabhupada Altars", 
      slug: "sp_altar", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/altars/60fac0cb-b3b1-4c15-bcb9-03e924e4e9d2.jpeg" 
    },
    { 
      title: "Deity Statues", 
      slug: "deities", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/deities/06c07679-7777-4367-9d0a-10fb0ebbaa1b.jpeg" 
    },
    { 
      title: "3D Reviels", 
      slug: "sculptures", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/sculptures/2fb00765-8ff3-4a59-bd23-67dc02a4ef30.jpeg" 
    },
    { 
      title: "Divine Gifts", 
      slug: "custom", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/custom/5f44c360-60a5-4170-8df5-eec47ae2b98b.jpeg" 
    },
    { 
      title: "Spiritual Furniture", 
      slug: "furniture", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/furniture/bb81407c-0dcb-4b58-8afd-48f2d617040b.jpeg"
    },
    { 
      title: "Tulsi Table & Vyasasan", 
      slug: "tulsi_table_vyasasan", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/furniture/bb81407c-0dcb-4b58-8afd-48f2d617040b.jpeg"
    },
    { 
      title: "Mridangam Stand", 
      slug: "mridanga_stand", 
      image: "https://pub-43e577891e9c4714928c02b437c487ce.r2.dev/products/furniture/bb81407c-0dcb-4b58-8afd-48f2d617040b.jpeg"
    },
  ];

  return (
    <>
      <HeroSection onExploreClick={NavigateCatalog} />
      <Bridge />
      <CategoryGallery 
        categories={categories} 
        onCategoryClick={handleCategoryClick} 
      />
    </>
  );
};

const Bridge = () => {
  return (
    <div className="section-bridge">
      <div className="divider">
        <span>✦</span>
      </div>
      <p className="bridge-text">
        Crafted with devotion • Experienced in detail
      </p>
    </div>
  );
};

export default LandingPage;