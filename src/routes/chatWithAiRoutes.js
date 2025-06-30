import express from "express";
import {
  createChatController,
  getChatHistoryController,
  searchChatController,
  getChatByIdController,
  deleteChatController,
  getAllChatsController,
  getChatStatisticsController,
  bulkDeleteChatsController,
} from "../controllers/chatWithAiController.js";
import roleMiddleware from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// Route untuk membuat chat baru dengan optional image upload
router.post(
  "/",
  roleMiddleware("USER", "ADMIN"),
  upload.single("image"),
  createChatController
);

// Route untuk mencari chat
router.get("/search", roleMiddleware("USER", "ADMIN"), searchChatController);

// Route untuk mendapatkan riwayat chat user
router.get(
  "/history",
  roleMiddleware("USER", "ADMIN"),
  getChatHistoryController
);

// Route untuk mendapatkan chat berdasarkan ID
router.get("/:id", roleMiddleware("USER", "ADMIN"), getChatByIdController);

// Route untuk menghapus chat
router.delete("/:id", roleMiddleware("USER", "ADMIN"), deleteChatController);

// Admin routes
router.get("/admin/all", roleMiddleware("ADMIN"), getAllChatsController);
router.get(
  "/admin/statistics",
  roleMiddleware("ADMIN"),
  getChatStatisticsController
);
router.delete(
  "/admin/bulk-delete",
  roleMiddleware("ADMIN"),
  bulkDeleteChatsController
);

export default router;
