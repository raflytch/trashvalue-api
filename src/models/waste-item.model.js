import prisma from "../config/prisma.js";

export const findWasteItemsByDropoffIdModel = async (dropoffId) => {
  return prisma.wasteItem.findMany({
    where: {
      dropoffId,
    },
    include: {
      wasteType: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findWasteItemByIdModel = async (id) => {
  return prisma.wasteItem.findUnique({
    where: {
      id,
    },
    include: {
      wasteType: true,
      dropoff: true,
    },
  });
};

export const createWasteItemModel = async (wasteItemData) => {
  return prisma.wasteItem.create({
    data: wasteItemData,
    include: {
      wasteType: true,
    },
  });
};

export const updateWasteItemModel = async (id, wasteItemData) => {
  return prisma.wasteItem.update({
    where: {
      id,
    },
    data: wasteItemData,
    include: {
      wasteType: true,
    },
  });
};

export const deleteWasteItemModel = async (id) => {
  return prisma.wasteItem.delete({
    where: {
      id,
    },
  });
};