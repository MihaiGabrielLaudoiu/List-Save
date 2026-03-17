// API productos: lecturas (R) de catalogo/precios + accion sync (C precios en BD).
const express = require("express");
const productsController = require("./products.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/sources", productsController.getSources);
router.get("/catalog-meta", productsController.getCatalogMeta);
router.get("/list-wizard-products", productsController.getListWizardProducts);
router.get("/catalog", productsController.getCatalog);
router.get("/best-prices", productsController.getBestPrices);
router.get("/comparator-options", productsController.getComparatorOptions);
router.post("/sync", requireAuth, productsController.syncPrices);

module.exports = router;
