import prisma from "../config/prisma.js";

export const findAllWasteTypesModel = async (page, limit, isActive) => {
  const skip = (page - 1) * limit;

  let whereClause = {};
  if (isActive !== undefined) {
    whereClause.isActive = isActive === "true";
  }

  const wasteTypes = await prisma.wasteType.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: {
      name: "asc",
    },
  });

  const totalWasteTypes = await prisma.wasteType.count({
    where: whereClause,
  });

  return { wasteTypes, totalWasteTypes };
};

export const findWasteTypeByIdModel = async (id) => {
  return prisma.wasteType.findUnique({
    where: {
      id,
    },
  });
};

export const findWasteTypeByNameModel = async (name) => {
  return prisma.wasteType.findUnique({
    where: {
      name,
    },
  });
};

export const createWasteTypeModel = async (wasteTypeData) => {
  return prisma.wasteType.create({
    data: wasteTypeData,
  });
};

export const updateWasteTypeModel = async (id, wasteTypeData) => {
  return prisma.wasteType.update({
    where: {
      id,
    },
    data: wasteTypeData,
  });
};

export const deleteWasteTypeModel = async (id) => {
  return prisma.wasteType.delete({
    where: {
      id,
    },
  });
};

export const findWasteTypeByNameExcludingIdModel = async (name, id) => {
  return prisma.wasteType.findFirst({
    where: {
      name,
      id: { not: id },
    },
  });
};
