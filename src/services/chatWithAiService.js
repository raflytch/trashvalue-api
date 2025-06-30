import { generateGeminiResponse } from "../utils/gemini.js";
import {
  createChatModel,
  findChatsByUserIdModel,
  findChatByIdModel,
  deleteChatModel,
  findAllChatsModel,
} from "../models/chatWithAiModel.js";
import { getUserById } from "./userService.js";

// Service untuk membuat chat baru dengan AI
export const createChatWithAiService = async (userId, message) => {
  // Validasi user exists
  await getUserById(userId);

  // Validasi message tidak kosong
  if (!message || message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  try {
    // Generate response dari Gemini AI
    const aiResponse = await generateGeminiResponse(message.trim());

    // Simpan chat ke database
    const chatData = {
      userId,
      message: message.trim(),
      response: aiResponse,
    };

    const chat = await createChatModel(chatData);
    return chat;
  } catch (error) {
    console.error("Error in createChatWithAiService:", error);
    throw new Error(error.message || "Failed to process chat with AI");
  }
};

// Service untuk mendapatkan riwayat chat user
export const getChatHistoryService = async (userId, page = 1, limit = 10) => {
  // Validasi user exists
  await getUserById(userId);

  const { chats, totalChats } = await findChatsByUserIdModel(
    userId,
    page,
    limit
  );

  return {
    data: chats,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalChats / limit),
      totalChats,
    },
  };
};

// Service untuk mendapatkan chat berdasarkan ID
export const getChatByIdService = async (id, userId, userRole) => {
  const chat = await findChatByIdModel(id);

  if (!chat) {
    throw new Error("Chat not found");
  }

  // User hanya bisa akses chat miliknya sendiri, admin bisa akses semua
  if (userRole !== "ADMIN" && chat.userId !== userId) {
    throw new Error("Unauthorized access to this chat");
  }

  return chat;
};

// Service untuk menghapus chat
export const deleteChatService = async (id, userId, userRole) => {
  const chat = await findChatByIdModel(id);

  if (!chat) {
    throw new Error("Chat not found");
  }

  // User hanya bisa hapus chat miliknya sendiri, admin bisa hapus semua
  if (userRole !== "ADMIN" && chat.userId !== userId) {
    throw new Error("Unauthorized to delete this chat");
  }

  await deleteChatModel(id);
  return { message: "Chat deleted successfully" };
};

// Service untuk admin mendapatkan semua chat
export const getAllChatsService = async (page = 1, limit = 10) => {
  const { chats, totalChats } = await findAllChatsModel(page, limit);

  return {
    data: chats,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalChats / limit),
      totalChats,
    },
  };
};
