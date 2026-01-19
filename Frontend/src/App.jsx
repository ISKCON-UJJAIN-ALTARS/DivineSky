import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

import Navbar from "./components/Navbar";
import Contact from "./components/Contact";
import About from "./components/About";
import Footer from "./components/Footer";
import Testimonials from "./components/Testimonials";

import Catalog from "./pages/Catalog";
import LandingPage from "./pages/Landingpage";
import ProductDetail from "./pages/ProductDetail";
import IntroScreen from "./IntroScreen";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./routes/AdminRoute";
import ManageProducts from "./components/Admin_Components/ManageProducts.jsx";
import EditProduct from "./components/Admin_Components/EditProduct.jsx";
import ReadyStock from "./components/Admin_Components/ReadyStock.jsx";
import ManageTestimonials from "./components/Admin_Components/ManageTestimonials";

import Gallery from "./components/Gallery";
import ManageGallery from "./components/Admin_Components/ManageGallery.jsx";

export default function App() {
  const [search, setSearch] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const introSeen = sessionStorage.getItem("introSeen");
    if (introSeen === "true") {
      setShowIntro(false);
    }
    setIsChecking(false);
  }, []);

  const handleIntroFinish = () => {
    sessionStorage.setItem("introSeen", "true");
    setShowIntro(false);
  };

  if (isChecking) return null;

  if (showIntro) {
    return <IntroScreen onFinish={handleIntroFinish} />;
  }

  return (
    <>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={
       <>
       <LandingPage />
       <Testimonials />
       <Footer />
       </> 
    }
         
      />

      <Route
        path="/catalog"
        element={
          <>
            <Navbar search={search} setSearch={setSearch} />
            <Catalog search={search} />
          </>
        }
      />

      <Route
        path="/contact"
        element={
          <>
            <Navbar search={search} setSearch={setSearch} />
            {search === "" && <> <Contact /> <Footer /> </>}
            {search !== "" && <Catalog search={search} />}
          </>
        }
      />
      
      <Route
        path="/about"
        element={
          <>
            <Navbar search={search} setSearch={setSearch} />
            {search === "" && <> <About /> <Footer /> </>}
            {search !== "" && <Catalog search={search} />}
          </>
        }
      />
      <Route
        path="/product/:category/:id"
        element={
          <>
            <Navbar search={search} setSearch={setSearch} />
            <ProductDetail />
          </>
        }
      />

      {/* Admin Login (Public) */}
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      
      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <ManageProducts />
          </AdminRoute>
        }
      />
      
      <Route
        path="/admin/products/edit/:category/:id"
        element={
          <AdminRoute>
            <EditProduct />
          </AdminRoute>
        }
      />

      <Route path="/admin/testimonials" element={<ManageTestimonials />} />

     <Route path="/ready-stock" element={
      <>
          <Navbar search={search} setSearch={setSearch} />
          <ReadyStock /> 
          <Footer /> 
      </>
      } />
       <Route path="/gallery" element={ 
        <>  
        <Navbar search={search} setSearch={setSearch} />
            {search === "" && <> <Gallery /> <Footer /> </>}
            {search !== "" && <Catalog search={search} />}
       </>   
       } />

       <Route path="/admin/gallery" element={<ManageGallery />} />

    </Routes>
    <Analytics />
  </>
  );
}