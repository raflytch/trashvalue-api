import express from "express";
import {
  getWasteItemsController,
  getWasteItemByIdController,
  createWasteItemController,
  updateWasteItemController,
  deleteWasteItemController,
} from "../controllers/wasteItemController.js";
import upload from "../middlewares/upload.js";
import roleMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Get all waste items for a dropoff
router.get("/dropoffs/:dropoffId/items", roleMiddleware("USER", "ADMIN"), getWasteItemsController);

// Get a specific waste item
router.get("/items/:id", roleMiddleware("USER", "ADMIN"), getWasteItemByIdController);

// Create a new waste item for a dropoff
router.post(
  "/dropoffs/:dropoffId/items",
  roleMiddleware("USER", "ADMIN"),
  upload.single("image"),
  createWasteItemController
);

// Update a waste item
router.patch(
  "/items/:id",
  roleMiddleware("USER", "ADMIN"),
  upload.single("image"),
  updateWasteItemController
);

// Delete a waste item
router.delete("/items/:id", roleMiddleware("USER", "ADMIN"), deleteWasteItemController);

export default router;