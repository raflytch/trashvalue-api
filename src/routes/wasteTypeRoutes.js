import express from "express";
import {
  getWasteTypesController,
  getWasteTypeByIdController,
  createWasteTypeController,
  updateWasteTypeController,
  deleteWasteTypeController,
} from "../controllers/wasteTypeController.js";
import upload from "../middlewares/upload.js";
import roleMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getWasteTypesController);
router.get("/:id", getWasteTypeByIdController);
router.post(
  "/",
  roleMiddleware("ADMIN"),
  upload.single("image"),
  createWasteTypeController
);
router.patch(
  "/:id",
  roleMiddleware("ADMIN"),
  upload.single("image"),
  updateWasteTypeController
);
router.delete("/:id", roleMiddleware("ADMIN"), deleteWasteTypeController);

export default router;
