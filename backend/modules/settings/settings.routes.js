// API ajustes usuario (AjustesUsuario): R get | U update.
const express = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const settingsController = require("./settings.controller");

const router = express.Router();

router.get("/me", requireAuth, settingsController.getSettings);
router.put("/me", requireAuth, settingsController.updateSettings);

module.exports = router;
