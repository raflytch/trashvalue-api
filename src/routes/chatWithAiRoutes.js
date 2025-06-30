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

// Route untuk membuat chat baru dengan optional image upload (USER & ADMIN)
router.post(
  "/",
  roleMiddleware("USER", "ADMIN"),
  upload.single("image"), // Support single image upload
  createChatController
);

// Route untuk mencari chat (USER & ADMIN)
router.get("/search", roleMiddleware("USER", "ADMIN"), searchChatController);

// Route untuk mendapatkan riwayat chat user (USER & ADMIN)
router.get(
  "/history",
  roleMiddleware("USER", "ADMIN"),
  getChatHistoryController
);

// Route untuk mendapatkan chat berdasarkan ID (USER & ADMIN)
router.get("/:id", roleMiddleware("USER", "ADMIN"), getChatByIdController);

// Route untuk menghapus chat (USER & ADMIN)
router.delete("/:id", roleMiddleware("USER", "ADMIN"), deleteChatController);

// Admin-only routes
// Route untuk admin mendapatkan semua chat dengan filter (ADMIN only)
router.get("/admin/all", roleMiddleware("ADMIN"), getAllChatsController);

// Route untuk admin mendapatkan statistik chat (ADMIN only)
router.get(
  "/admin/statistics",
  roleMiddleware("ADMIN"),
  getChatStatisticsController
);

// Route untuk bulk delete chats (ADMIN only)
router.delete(
  "/admin/bulk-delete",
  roleMiddleware("ADMIN"),
  bulkDeleteChatsController
);

export default router;
