import express from "express";
import {
  getTransactionsController,
  getUserTransactionsController,
  getTransactionByIdController,
  createWithdrawalController,
  createTopupController,
  handlePaymentNotificationController,
  updateTransactionStatusController,
  getPaymentStatusController,
  cancelTransactionController,
} from "../controllers/transactionController.js";
import roleMiddleware from "../middlewares/auth.js";
import verifyMidtransSignature from "../middlewares/midtransAuth.js";

const router = express.Router();

router.get("/", roleMiddleware("ADMIN"), getTransactionsController);
router.get(
  "/users/:userId",
  roleMiddleware("USER", "ADMIN"),
  getUserTransactionsController
);
router.get(
  "/:id",
  roleMiddleware("USER", "ADMIN"),
  getTransactionByIdController
);
router.get(
  "/:id/status",
  roleMiddleware("USER", "ADMIN"),
  getPaymentStatusController
);
router.post(
  "/withdrawal",
  roleMiddleware("USER", "ADMIN"),
  createWithdrawalController
);
router.post("/topup", roleMiddleware("USER", "ADMIN"), createTopupController);
router.post(
  "/notification",
  verifyMidtransSignature,
  handlePaymentNotificationController
);
router.patch(
  "/:id/status",
  roleMiddleware("ADMIN"),
  updateTransactionStatusController
);
router.post(
  "/:id/cancel",
  roleMiddleware("USER", "ADMIN"),
  cancelTransactionController
);

export default router;
