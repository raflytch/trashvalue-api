import express from "express";
import {
  getDropoffsController,
  getUserDropoffsController,
  getDropoffByIdController,
  createDropoffController,
  updateDropoffStatusController,
  cancelDropoffController,
  deleteDropoffController,
} from "../controllers/dropoffController.js";
import roleMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Get all dropoffs (filtered by the user's role)
router.get("/", roleMiddleware("USER", "ADMIN"), getDropoffsController);

// Get dropoffs for a specific user
router.get("/users/:userId", roleMiddleware("USER", "ADMIN"), getUserDropoffsController);

// Get a specific dropoff
router.get("/:id", roleMiddleware("USER", "ADMIN"), getDropoffByIdController);

// Create a new dropoff
router.post("/", roleMiddleware("USER", "ADMIN"), createDropoffController);

// Update dropoff status (admin only)
router.patch("/:id/status", roleMiddleware("ADMIN"), updateDropoffStatusController);

// Cancel a dropoff
router.patch("/:id/cancel", roleMiddleware("USER", "ADMIN"), cancelDropoffController);

// Delete a dropoff (admin only)
router.delete("/:id", roleMiddleware("ADMIN"), deleteDropoffController);

export default router;