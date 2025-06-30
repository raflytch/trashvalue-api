import {
  createChatWithAiService,
  getChatHistoryService,
  getChatByIdService,
  deleteChatService,
  getAllChatsService,
} from "../services/chatWithAiService.js";
import { response } from "../core/response.js";

// Controller untuk membuat chat baru dengan AI
export const createChatController = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!message) {
      return response.validation(res, {
        message: "Message is required",
      });
    }

    // Proses chat dengan AI
    const chat = await createChatWithAiService(userId, message);

    return response.success(res, chat, "Chat processed successfully", 201);
  } catch (error) {
    console.error("Error in createChatController:", error);
    return response.error(res, error.message);
  }
};

// Controller untuk mendapatkan riwayat chat user
export const getChatHistoryController = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getChatHistoryService(userId, page, limit);

    return response.success(
      res,
      result.data,
      "Chat history retrieved successfully",
      200,
      result.metadata
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};

// Controller untuk mendapatkan chat berdasarkan ID
export const getChatByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const chat = await getChatByIdService(id, userId, userRole);

    return response.success(res, chat, "Chat retrieved successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("Unauthorized")) {
      return response.error(res, error.message, 403);
    }
    return response.error(res, error.message);
  }
};

// Controller untuk menghapus chat
export const deleteChatController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await deleteChatService(id, userId, userRole);

    return response.success(res, null, result.message);
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("Unauthorized")) {
      return response.error(res, error.message, 403);
    }
    return response.error(res, error.message);
  }
};

// Controller untuk admin mendapatkan semua chat
export const getAllChatsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getAllChatsService(page, limit);

    return response.success(
      res,
      result.data,
      "All chats retrieved successfully",
      200,
      result.metadata
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};
