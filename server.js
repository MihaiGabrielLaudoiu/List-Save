const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const authRoutes = require("./backend/modules/auth/auth.routes");
const productsRoutes = require("./backend/modules/products/products.routes");
const listsRoutes = require("./backend/modules/lists/lists.routes");
const settingsRoutes = require("./backend/modules/settings/settings.routes");
const statsRoutes = require("./backend/modules/stats/stats.routes");

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const publicRoot = path.join(__dirname);
app.use(
  express.static(publicRoot, {
    etag: true,
    lastModified: true,
    setHeaders: function (res, filePath) {
      const ext = path.extname(filePath).toLowerCase();
      const normalized = filePath.replace(/\\/g, "/");
      if (ext === ".html") {
        res.setHeader("Cache-Control", "no-cache, private, must-revalidate");
      } else if (ext === ".json" && normalized.indexOf("/translations/") !== -1) {
        res.setHeader("Cache-Control", "no-cache, private");
      }
    }
  })
);

app.get("/health", function (req, res) {
  res.json({ ok: true, service: "list-save-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/stats", statsRoutes);

app.use(function (err, req, res, next) {
  console.error("Error no controlado:", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

app.listen(PORT, function () {
  console.log("Servidor iniciado en http://localhost:" + PORT);
});
