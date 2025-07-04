import prisma from "../config/prisma.js";

export const findAllWasteBanksModel = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const wasteBanks = await prisma.wasteBank.findMany({
    skip,
    take: limit,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          dropoffs: true,
        },
      },
    },
  });

  const totalWasteBanks = await prisma.wasteBank.count();

  return { wasteBanks, totalWasteBanks };
};

export const findWasteBankByIdModel = async (id) => {
  return prisma.wasteBank.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          dropoffs: true,
        },
      },
    },
  });
};

export const createWasteBankModel = async (data) => {
  return prisma.wasteBank.create({
    data,
    include: {
      _count: {
        select: {
          dropoffs: true,
        },
      },
    },
  });
};

export const createManyWasteBanksModel = async (data) => {
  return prisma.wasteBank.createMany({
    data,
    skipDuplicates: true,
  });
};

export const updateWasteBankModel = async (id, data) => {
  return prisma.wasteBank.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          dropoffs: true,
        },
      },
    },
  });
};

export const deleteWasteBankModel = async (id) => {
  return prisma.wasteBank.delete({ where: { id } });
};

export const deleteManyWasteBanksModel = async (ids) => {
  return prisma.wasteBank.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
};

export const checkWasteBankNameExistsModel = async (name, excludeId = null) => {
  const whereClause = { name };
  if (excludeId) {
    whereClause.id = { not: excludeId };
  }

  return prisma.wasteBank.findFirst({
    where: whereClause,
  });
};

export const checkMultipleWasteBankNamesExistModel = async (names) => {
  return prisma.wasteBank.findMany({
    where: {
      name: {
        in: names,
      },
    },
    select: {
      name: true,
    },
  });
};

export const findWasteBanksByIdsModel = async (ids) => {
  return prisma.wasteBank.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: {
      _count: {
        select: {
          dropoffs: true,
        },
      },
    },
  });
};
