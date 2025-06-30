import {
  createChatWithAiService,
  getChatHistoryService,
  searchChatHistoryService,
  getChatByIdService,
  deleteChatService,
  getAllChatsService,
  getChatStatisticsService,
} from "../services/chatWithAiService.js";
import { response } from "../core/response.js";

// Controller untuk membuat chat baru dengan AI (dengan dukungan gambar)
export const createChatController = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    const imageFile = req.file;

    // Validasi input minimal ada message atau gambar
    if (!message?.trim() && !imageFile) {
      return response.validation(res, {
        message: "Message or image is required",
      });
    }

    // Validasi tipe file jika ada gambar
    if (imageFile) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(imageFile.mimetype)) {
        return response.validation(res, {
          message: "Only JPEG, JPG, and PNG images are allowed",
        });
      }

      // Validasi ukuran file (max 5MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        return response.validation(res, {
          message: "Image size must be less than 5MB",
        });
      }
    }

    // Proses chat dengan AI
    const chat = await createChatWithAiService(userId, message, imageFile);

    return response.success(
      res,
      chat,
      imageFile
        ? "Chat with image processed successfully"
        : "Chat processed successfully",
      201
    );
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
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

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

// Controller untuk mencari chat
export const searchChatController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyword } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!keyword?.trim()) {
      return response.validation(res, {
        message: "Search keyword is required",
      });
    }

    const result = await searchChatHistoryService(userId, keyword, page, limit);

    return response.success(
      res,
      result.data,
      "Chat search completed successfully",
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

// Controller untuk admin mendapatkan semua chat dengan filter
export const getAllChatsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;

    const result = await getAllChatsService(page, limit, filters);

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

// Controller untuk mendapatkan statistik chat (admin only)
export const getChatStatisticsController = async (req, res) => {
  try {
    const statistics = await getChatStatisticsService();

    return response.success(
      res,
      statistics,
      "Chat statistics retrieved successfully"
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};

// Controller untuk bulk delete chats (admin only)
export const bulkDeleteChatsController = async (req, res) => {
  try {
    const { chatIds } = req.body;

    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return response.validation(res, {
        message: "Chat IDs array is required",
      });
    }

    if (chatIds.length > 50) {
      return response.validation(res, {
        message: "Maximum 50 chats can be deleted at once",
      });
    }

    const results = await Promise.allSettled(
      chatIds.map((id) => deleteChatService(id, req.user.id, req.user.role))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return response.success(
      res,
      {
        successful,
        failed,
        total: chatIds.length,
      },
      `Bulk delete completed: ${successful} successful, ${failed} failed`
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};
