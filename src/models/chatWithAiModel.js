import prisma from "../config/prisma.js";

// Fungsi untuk menyimpan chat baru ke database
export const createChatModel = async (chatData) => {
  return prisma.chat.create({
    data: chatData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
        },
      },
    },
  });
};

// Fungsi untuk menghapus chat (jika diperlukan)
export const deleteChatModel = async (id) => {
  return prisma.chat.delete({
    where: {
      id,
    },
  });
};

// Fungsi untuk mendapatkan semua chat (untuk admin)
export const findAllChatsModel = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const chats = await prisma.chat.findMany({
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
        },
      },
    },
  });

  const totalChats = await prisma.chat.count();

  return { chats, totalChats };
};
