const express = require("express");
const statsController = require("./stats.controller");

const router = express.Router();

router.get("/catalog", statsController.getCatalogStats);

module.exports = router;
