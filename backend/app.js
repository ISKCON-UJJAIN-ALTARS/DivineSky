const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const adminUploadRoutes = require("./routes/admin.upload.routes");
const testimonialsRoutes = require("backend/routes/testimonials");
const productRoutes = require("./routes/products.routes");
const adminUpdateRoutes = require("./routes/admin-update.route");
const readyStockAdminRoutes = require('./routes/ready-stock.admin.routes');
const readyStockPublicRoutes = require('./routes/ready-stock.public.routes');
const galleryRoutes = require("./routes/gallery.routes");

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.send("Backend + Cloudflare R2 is running 🚀");
});

// routes
app.use("/auth", authRoutes);            // 🔐 login
app.use("/admin", adminUploadRoutes);    // 🔐 admin protected
app.use("/admin", adminUpdateRoutes);    // 🔐 admin protected
app.use("/admin", readyStockAdminRoutes); // 🔐 admin ready stock
app.use("/products", readyStockPublicRoutes); // 🌍 public ready stock
app.use("/products", productRoutes);     // 🌍 public
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/gallery", galleryRoutes);
module.exports = app;