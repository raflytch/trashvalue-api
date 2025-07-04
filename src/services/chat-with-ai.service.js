import {
  generateGeminiResponse,
  generateGeminiResponseWithImage,
} from "../utils/gemini.js";
import { getUserById } from "./user.service.js";

export const createChatWithAiService = async (
  userId,
  message,
  imageFile = null
) => {
  await getUserById(userId);

  if (!message?.trim() && !imageFile) {
    throw new Error("Message or image is required");
  }

  try {
    let aiResponse;

    if (imageFile) {
      aiResponse = await generateGeminiResponseWithImage(
        message || "Tolong analisis gambar ini untuk TrashValue",
        imageFile.buffer.toString("base64"),
        imageFile.mimetype
      );
    } else {
      aiResponse = await generateGeminiResponse(message.trim());
    }

    return {
      message: message?.trim() || "[Mengirim gambar]",
      response: aiResponse,
    };
  } catch (error) {
    console.error("Error in createChatWithAiService:", error);
    throw new Error(error.message || "Failed to process chat with AI");
  }
};

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

export const getChatByIdService = async (id, userId, userRole) => {
  const chat = await findChatByIdModel(id);

  if (!chat) {
    throw new Error("Chat not found");
  }

  if (userRole !== "ADMIN" && chat.userId !== userId) {
    throw new Error("Unauthorized access to this chat");
  }

  return chat;
};

export const deleteChatService = async (id, userId, userRole) => {
  const chat = await findChatByIdModel(id);

  if (!chat) {
    throw new Error("Chat not found");
  }

  if (userRole !== "ADMIN" && chat.userId !== userId) {
    throw new Error("Unauthorized to delete this chat");
  }

  await deleteChatModel(id);
  return { message: "Chat deleted successfully" };
};

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
