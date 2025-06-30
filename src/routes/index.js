import userRoutes from "./userRoutes.js";
import wasteTypeRoutes from "./wasteTypeRoutes.js";
import dropoffRoutes from "./dropoffRoutes.js";
import wasteItemRoutes from "./wasteItemRoutes.js";
import transactionRoutes from "./transactionRoutes.js";
import { Router } from "express";

const router = Router();

router.use("/users", userRoutes);
router.use("/waste-types", wasteTypeRoutes);
router.use("/dropoffs", dropoffRoutes);
router.use("/waste", wasteItemRoutes);
router.use("/transactions", transactionRoutes);

export default router;
