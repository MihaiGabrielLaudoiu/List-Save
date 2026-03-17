// API auth: registro/login (C sesion), lectura perfil (R), cierre (D cookie).
const express = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

module.exports = router;
