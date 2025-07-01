import prisma from "../config/prisma.js";

// Menyimpan chat baru ke database
export const createChatModel = async (chatData) => {
  return prisma.chat.create({
    data: {
      userId: chatData.userId,
      message: chatData.message,
      response: chatData.response,
      imageUrl: chatData.imageUrl || null, // Pastikan null jika tidak ada gambar
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

// Mendapatkan riwayat chat user dengan pagination
export const findChatsByUserIdModel = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const chats = await prisma.chat.findMany({
    where: { userId },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const totalChats = await prisma.chat.count({
    where: { userId },
  });

  return { chats, totalChats };
};

// Mendapatkan chat berdasarkan ID
export const findChatByIdModel = async (id) => {
  return prisma.chat.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

// Menghapus chat
export const deleteChatModel = async (id) => {
  return prisma.chat.delete({
    where: { id },
  });
};

// Mendapatkan semua chat untuk admin dengan filter
export const findAllChatsModel = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const whereClause = {};

  // Filter berdasarkan user
  if (filters.userId) {
    whereClause.userId = filters.userId;
  }

  // Filter berdasarkan tanggal
  if (filters.dateFrom || filters.dateTo) {
    whereClause.createdAt = {};
    if (filters.dateFrom) {
      whereClause.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      whereClause.createdAt.lte = new Date(filters.dateTo);
    }
  }

  const chats = await prisma.chat.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const totalChats = await prisma.chat.count({
    where: whereClause,
  });

  return { chats, totalChats };
};

// Mencari chat berdasarkan keyword
export const searchChatsModel = async (
  userId,
  keyword,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  const whereClause = {
    userId,
    OR: [
      {
        message: {
          contains: keyword,
          mode: "insensitive",
        },
      },
      {
        response: {
          contains: keyword,
          mode: "insensitive",
        },
      },
    ],
  };

  const chats = await prisma.chat.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const totalChats = await prisma.chat.count({
    where: whereClause,
  });

  return { chats, totalChats };
};
