const express = require("express");
const { requireAuth } = require("../../middleware/auth.middleware");
const listsController = require("./lists.controller");

const router = express.Router();

router.get("/cabeceras", requireAuth, listsController.getCabeceras);
router.post("/cabeceras", requireAuth, listsController.createCabecera);
router.put("/cabeceras/:cabeceraId", requireAuth, listsController.updateCabecera);
router.delete("/cabeceras/:cabeceraId", requireAuth, listsController.deleteCabecera);

router.get("/mine", requireAuth, listsController.getMyList);
router.post("/mine", requireAuth, listsController.addItem);
router.put("/mine/:listId", requireAuth, listsController.updateItem);
router.delete("/mine/:listId", requireAuth, listsController.deleteItem);

module.exports = router;