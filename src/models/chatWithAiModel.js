import prisma from "../config/prisma.js";

// Fungsi untuk menyimpan chat baru ke database (dengan dukungan gambar)
export const createChatModel = async (chatData) => {
  return prisma.chat.create({
    data: {
      userId: chatData.userId,
      message: chatData.message,
      response: chatData.response,
      // Tambahkan field image jika ada (akan ditambah ke schema nanti)
      ...(chatData.imageUrl && { imageUrl: chatData.imageUrl }),
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

// Fungsi untuk mendapatkan riwayat chat user dengan pagination
export const findChatsByUserIdModel = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const chats = await prisma.chat.findMany({
    where: {
      userId,
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
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

  const totalChats = await prisma.chat.count({
    where: {
      userId,
    },
  });

  return { chats, totalChats };
};

// Fungsi untuk mendapatkan chat berdasarkan ID
export const findChatByIdModel = async (id) => {
  return prisma.chat.findUnique({
    where: {
      id,
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

// Fungsi untuk menghapus chat
export const deleteChatModel = async (id) => {
  return prisma.chat.delete({
    where: {
      id,
    },
  });
};

// Fungsi untuk mendapatkan semua chat (untuk admin) dengan filter
export const findAllChatsModel = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;

  const whereClause = {};

  // Filter berdasarkan user jika diperlukan
  if (filters.userId) {
    whereClause.userId = filters.userId;
  }

  // Filter berdasarkan tanggal jika diperlukan
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
    orderBy: {
      createdAt: "desc",
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

  const totalChats = await prisma.chat.count({
    where: whereClause,
  });

  return { chats, totalChats };
};

// Fungsi untuk mencari chat berdasarkan keyword
export const searchChatsModel = async (
  userId,
  keyword,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  const chats = await prisma.chat.findMany({
    where: {
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
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
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

  const totalChats = await prisma.chat.count({
    where: {
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
    },
  });

  return { chats, totalChats };
};
