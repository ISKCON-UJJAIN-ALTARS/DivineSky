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
      image: "../../HomeAltar.jpeg" 
    },
    { 
      title: "Temple Altars", 
      slug: "temple_altar", 
      image: "../../TempleAltar.jpeg" 
    },
    { 
      title: "Prabhupada Altars", 
      slug: "sp_altar", 
      image: "../../PrabhupadaAltar.jpeg" 
    },
    { 
      title: "Deities", 
      slug: "deities", 
      image: "../../Deity.jpeg" 
    },
    { 
      title: "3D Reliefs", 
      slug: "sculptures", 
      image: "../../3dReliefs.jpeg" 
    },
    { 
      title: "Laser Engravings", 
      slug: "Laser_Engravings", 
      image: "../../LaserEngravings.jpeg" 
    },
    { 
      title: "Spiritual Furniture", 
      slug: "furniture", 
      image: "../../furniture.jpeg"
    },
    { 
      title: "Tulsi Table & Vyasasan", 
      slug: "tulsi_table_vyasasan", 
      image: "../../TulsiTable.jpeg"
    },
    { 
      title: "Mridangam Stand", 
      slug: "mridanga_stand", 
      image: "../../MridangamStand.jpeg"
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