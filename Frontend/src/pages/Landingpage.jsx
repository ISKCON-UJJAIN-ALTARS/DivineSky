import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import CategoryGallery from "../components/Category_Gallery_Components/CategoryGallery";
import "../styles/Landingpage.css";
import GallerySection from "../components/GallerySection";
import { Helmet } from "react-helmet-async";

const LandingPage = () => {
  const navigate = useNavigate();

  const NavigateCatalog = () => navigate("/catalog");

  const handleCategoryClick = (slug) => {
    navigate(`/catalog?category=${slug}`);
  };

  const categories = [
    { title: "Home Altars",            slug: "altars",                 image: "../../HomeAltar.jpeg" },
    { title: "Temple Altars",          slug: "temple_altar",           image: "../../TempleAltar.jpeg" },
    { title: "Prabhupada Altars",      slug: "sp_altar",               image: "../../PrabhupadaAltar.jpeg" },
    { title: "Deities",                slug: "deities",                image: "../../Deity.jpeg" },
    { title: "3D Reliefs",             slug: "sculptures",             image: "../../3dReliefs.jpeg" },
    { title: "Laser Engravings",       slug: "Laser_Engravings",       image: "../../laser_engravings.jpeg" },
    { title: "Spiritual Furniture",    slug: "furniture",              image: "../../furniture.jpeg" },
    { title: "Tulsi Table & Vyasasan", slug: "tulsi_table_vyasasan",   image: "../../TulsiTable.jpeg" },
    { title: "Mridangam Stand",        slug: "mridanga_stand",         image: "../../mridangamStand.jpeg" },
  ];

  return (
    <>
      {/* ✅ Helmet is now INSIDE the component */}
      <Helmet>
        <title>Divine Sky | ISKCON Ujjain Altars | Wooden Altars & Temple Furniture</title>
        <meta
          name="description"
          content="Divine Sky crafts premium handcrafted wooden altars, ISKCON deities, Vyasasans, Tulsi tables, temple furniture, and devotional interiors for temples and homes worldwide."
        />
        <link rel="canonical" href="https://divinesky.vercel.app/" />
        <meta property="og:title" content="Divine Sky | ISKCON Ujjain Altars" />
        <meta property="og:description" content="Premium handcrafted wooden altars and devotional temple furniture from Divine Sky, Ujjain." />
        <meta property="og:url" content="https://divinesky.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://divinesky.vercel.app/og-image.jpg" />
      </Helmet>

      <main>
        <HeroSection onExploreClick={NavigateCatalog} />
      </main>
      <Bridge />
      <CategoryGallery categories={categories} onCategoryClick={handleCategoryClick} />
      <GallerySection />
    </>
  );
};

const Bridge = () => {
  return (
    <div className="section-bridge">
      <div className="divider">
        <span>✦</span>
      </div>
      <p className="bridge-text">Crafted with Devotion</p>
    </div>
  );
};

export default LandingPage;