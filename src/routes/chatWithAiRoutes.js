import express from "express";
import {
  createChatController,
  getChatHistoryController,
  getChatByIdController,
  deleteChatController,
  getAllChatsController,
} from "../controllers/chatWithAiController.js";
import roleMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Route untuk membuat chat baru (USER & ADMIN)
router.post("/", roleMiddleware("USER", "ADMIN"), createChatController);

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

// Route untuk admin mendapatkan semua chat (ADMIN only)
router.get("/admin/all", roleMiddleware("ADMIN"), getAllChatsController);

export default router;
