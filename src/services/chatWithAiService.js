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
} from "../models/chatWithAiModel.js";
import { getUserById } from "./userService.js";
import imagekit from "../utils/imagekit.js";

// Service untuk membuat chat baru dengan AI (dengan dukungan gambar)
export const createChatWithAiService = async (
  userId,
  message,
  imageFile = null
) => {
  // Validasi user exists
  await getUserById(userId);

  // Validasi message tidak kosong (kecuali ada gambar)
  if (!message?.trim() && !imageFile) {
    throw new Error("Message or image is required");
  }

  try {
    let aiResponse;
    let imageUrl = null;

    // Jika ada gambar, upload ke ImageKit terlebih dahulu
    if (imageFile) {
      try {
        const uploadResponse = await imagekit.upload({
          file: imageFile.buffer.toString("base64"),
          fileName: `chat_image_${userId}_${Date.now()}`,
          folder: "/chat-images",
        });
        imageUrl = uploadResponse.url;

        // Generate response dengan analisis gambar
        aiResponse = await generateGeminiResponseWithImage(
          message || "Tolong analisis gambar ini",
          imageFile.buffer.toString("base64"),
          imageFile.mimetype
        );
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        // Jika upload gagal, tetap proses text saja
        aiResponse = await generateGeminiResponse(
          message ||
            "Maaf, gambar tidak dapat diproses. Bagaimana saya bisa membantu Anda?"
        );
      }
    } else {
      // Generate response normal tanpa gambar
      aiResponse = await generateGeminiResponse(message.trim());
    }

    // Simpan chat ke database
    const chatData = {
      userId,
      message: message?.trim() || "[Mengirim gambar]",
      response: aiResponse,
      imageUrl,
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
  // Validasi user exists
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

// Service untuk mendapatkan statistik chat (untuk admin)
export const getChatStatisticsService = async () => {
  const totalChats = await prisma.chat.count();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayChats = await prisma.chat.count({
    where: {
      createdAt: {
        gte: todayStart,
      },
    },
  });

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const weeklyChats = await prisma.chat.count({
    where: {
      createdAt: {
        gte: last7Days,
      },
    },
  });

  const activeUsers = await prisma.chat.groupBy({
    by: ["userId"],
    where: {
      createdAt: {
        gte: last7Days,
      },
    },
  });

  return {
    totalChats,
    todayChats,
    weeklyChats,
    activeUsers: activeUsers.length,
  };
};
