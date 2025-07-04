import {
  generateGeminiResponse,
  generateGeminiResponseWithImage,
} from "../utils/gemini.js";
import {
  createChatModel,
  findChatsByUserIdModel,
  findChatByIdModel,
  deleteChatModel,
  findAllChatsModel,
  searchChatsModel,
} from "../models/chat-with-ai.model.js";
import { getUserById } from "./user.service.js";
import imagekit from "../utils/imagekit.js";
import prisma from "../config/prisma.js";

// Service untuk membuat chat baru dengan AI (upload gambar dulu jika ada)
export const createChatWithAiService = async (
  userId,
  message,
  imageFile = null
) => {
  // Validasi user exists
  await getUserById(userId);

  // Validasi input minimal ada message atau gambar
  if (!message?.trim() && !imageFile) {
    throw new Error("Message or image is required");
  }

  try {
    let imageUrl = null;
    let aiResponse;

    // STEP 1: Upload gambar ke ImageKit terlebih dahulu jika ada
    if (imageFile) {
      try {
        const uploadResponse = await imagekit.upload({
          file: imageFile.buffer.toString("base64"),
          fileName: `chat_image_${userId}_${Date.now()}`,
          folder: "/chat-images",
        });
        imageUrl = uploadResponse.url;
        console.log("Image uploaded successfully:", imageUrl);
      } catch (uploadError) {
        console.error("Error uploading image to ImageKit:", uploadError);
        // Jika upload gagal, lanjut tanpa gambar
        imageUrl = null;
      }
    }

    // STEP 2: Generate AI response setelah upload selesai
    if (imageFile && imageUrl) {
      // Jika ada gambar dan berhasil diupload, analisis dengan AI
      aiResponse = await generateGeminiResponseWithImage(
        message || "Tolong analisis gambar ini untuk TrashValue",
        imageFile.buffer.toString("base64"),
        imageFile.mimetype
      );
    } else if (imageFile && !imageUrl) {
      // Jika ada gambar tapi gagal upload, beri respons tanpa analisis gambar
      aiResponse = await generateGeminiResponse(
        message ||
          "Maaf, gambar tidak dapat diproses. Bagaimana TrashValue bisa membantu Anda hari ini?"
      );
    } else {
      // Jika tidak ada gambar, proses text biasa
      aiResponse = await generateGeminiResponse(message.trim());
    }

    // STEP 3: Simpan ke database setelah semua proses selesai
    const chatData = {
      userId,
      message: message?.trim() || "[Mengirim gambar]",
      response: aiResponse,
      imageUrl, // Akan null jika tidak ada gambar atau gagal upload
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
      hasNextPage: page < Math.ceil(totalChats / limit),
      hasPrevPage: page > 1,
    },
  };
};

// Service untuk mencari chat
export const searchChatHistoryService = async (
  userId,
  keyword,
  page = 1,
  limit = 10
) => {
  await getUserById(userId);

  if (!keyword?.trim()) {
    throw new Error("Search keyword is required");
  }

  const { chats, totalChats } = await searchChatsModel(
    userId,
    keyword.trim(),
    page,
    limit
  );

  return {
    data: chats,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalChats / limit),
      totalChats,
      keyword: keyword.trim(),
      hasNextPage: page < Math.ceil(totalChats / limit),
      hasPrevPage: page > 1,
    },
  };
};

// Service untuk mendapatkan chat berdasarkan ID
export const getChatByIdService = async (id, userId, userRole) => {
  const chat = await findChatByIdModel(id);

  if (!chat) {
    throw new Error("Chat not found");
  }

  // User hanya bisa akses chat miliknya, admin bisa akses semua
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

  // User hanya bisa hapus chat miliknya, admin bisa hapus semua
  if (userRole !== "ADMIN" && chat.userId !== userId) {
    throw new Error("Unauthorized to delete this chat");
  }

  await deleteChatModel(id);
  return { message: "Chat deleted successfully" };
};

// Service untuk admin mendapatkan semua chat dengan filter
export const getAllChatsService = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  const { chats, totalChats } = await findAllChatsModel(page, limit, filters);

  return {
    data: chats,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalChats / limit),
      totalChats,
      filters,
      hasNextPage: page < Math.ceil(totalChats / limit),
      hasPrevPage: page > 1,
    },
  };
};

// Service untuk mendapatkan statistik chat
export const getChatStatisticsService = async () => {
  const totalChats = await prisma.chat.count();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayChats = await prisma.chat.count({
    where: {
      createdAt: { gte: todayStart },
    },
  });

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const weeklyChats = await prisma.chat.count({
    where: {
      createdAt: { gte: last7Days },
    },
  });

  const activeUsers = await prisma.chat.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: last7Days },
    },
  });

  return {
    totalChats,
    todayChats,
    weeklyChats,
    activeUsers: activeUsers.length,
  };
};
