import userRoutes from "./user.routes.js";
import wasteTypeRoutes from "./waste-type.routes.js";
import dropoffRoutes from "./dropoff.routes.js";
import wasteItemRoutes from "./waste-item.routes.js";
import transactionRoutes from "./transaction.routes.js";
import chatWithAitRoutes from "./chat-with-ai.routes.js";
import { Router } from "express";

const router = Router();

router.use("/users", userRoutes);
router.use("/waste-types", wasteTypeRoutes);
router.use("/dropoffs", dropoffRoutes);
router.use("/waste", wasteItemRoutes);
router.use("/transactions", transactionRoutes);
router.use("/chat", chatWithAitRoutes);

export default router;
