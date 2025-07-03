import express from "express";
import {
  getAllWasteBanksController,
  getWasteBankByIdController,
  createWasteBankController,
  updateWasteBankController,
  deleteWasteBankController,
} from "../controllers/waste-bank.controller.js";
import roleMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", roleMiddleware("ADMIN"), getAllWasteBanksController);
router.get("/:id", roleMiddleware("ADMIN"), getWasteBankByIdController);
router.post("/", roleMiddleware("ADMIN"), createWasteBankController);
router.patch("/:id", roleMiddleware("ADMIN"), updateWasteBankController);
router.delete("/:id", roleMiddleware("ADMIN"), deleteWasteBankController);

export default router;
