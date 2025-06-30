import prisma from "../config/prisma.js";

export const findAllTransactionsModel = async (page, limit, status, type) => {
  const skip = (page - 1) * limit;

  let whereClause = {};
  if (status) {
    whereClause.status = status;
  }
  if (type) {
    whereClause.type = type;
  }

  const transactions = await prisma.transaction.findMany({
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
          phone: true,
          email: true,
        },
      },
    },
  });

  const totalTransactions = await prisma.transaction.count({
    where: whereClause,
  });

  return { transactions, totalTransactions };
};

export const findTransactionsByUserIdModel = async (
  userId,
  page,
  limit,
  status,
  type
) => {
  const skip = (page - 1) * limit;

  let whereClause = { userId };
  if (status) {
    whereClause.status = status;
  }
  if (type) {
    whereClause.type = type;
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalTransactions = await prisma.transaction.count({
    where: whereClause,
  });

  return { transactions, totalTransactions };
};

export const findTransactionByIdModel = async (id) => {
  return prisma.transaction.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });
};

export const createTransactionModel = async (transactionData) => {
  return prisma.transaction.create({
    data: transactionData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });
};

export const updateTransactionStatusModel = async (id, status) => {
  return prisma.transaction.update({
    where: {
      id,
    },
    data: {
      status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });
};

export const updateTransactionPaymentIdModel = async (id, paymentId) => {
  return prisma.transaction.update({
    where: {
      id,
    },
    data: {
      paymentId,
    },
  });
};

export const findTransactionByPaymentIdModel = async (paymentId) => {
  return prisma.transaction.findFirst({
    where: {
      paymentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });
};
