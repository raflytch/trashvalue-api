import {
  findWasteItemsByDropoffIdModel,
  findWasteItemByIdModel,
  createWasteItemModel,
  updateWasteItemModel,
  deleteWasteItemModel,
} from "../models/wasteItemModel.js";
import { getWasteTypeByIdService } from "./wasteTypeService.js";
import { getDropoffByIdService } from "./dropoffService.js";
import prisma from "../config/prisma.js";
import { STATUS } from "../core/constant.js";

export const getWasteItemsByDropoffIdService = async (dropoffId) => {
  await getDropoffByIdService(dropoffId);

  const wasteItems = await findWasteItemsByDropoffIdModel(dropoffId);
  return wasteItems;
};

export const getWasteItemByIdService = async (id) => {
  const wasteItem = await findWasteItemByIdModel(id);

  if (!wasteItem) {
    throw new Error("Waste item not found");
  }

  return wasteItem;
};

export const addWasteItemService = async (dropoffId, wasteItemData) => {
  const dropoff = await getDropoffByIdService(dropoffId);

  if (dropoff.status !== STATUS.PENDING) {
    throw new Error("Can only add items to pending dropoffs");
  }

  const wasteType = await getWasteTypeByIdService(wasteItemData.wasteTypeId);
  if (!wasteType.isActive) {
    throw new Error("Selected waste type is not active");
  }

  const amount = wasteItemData.weight * wasteType.pricePerKg;

  const requiredReduction = Math.ceil(wasteItemData.weight * 10000);

  const user = await prisma.user.findUnique({
    where: { id: dropoff.userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const result = await prisma.$transaction(async (prisma) => {
    const wasteItem = await prisma.wasteItem.create({
      data: {
        dropoffId,
        wasteTypeId: wasteItemData.wasteTypeId,
        weight: parseFloat(wasteItemData.weight),
        amount,
        notes: wasteItemData.notes,
        image: wasteItemData.image,
      },
      include: {
        wasteType: true,
      },
    });

    await prisma.dropoff.update({
      where: {
        id: dropoffId,
      },
      data: {
        totalWeight: {
          increment: parseFloat(wasteItemData.weight),
        },
        totalAmount: {
          increment: amount,
        },
      },
    });

    if (user.points >= requiredReduction) {
      await prisma.user.update({
        where: { id: dropoff.userId },
        data: {
          points: {
            decrement: requiredReduction,
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: dropoff.userId },
        data: {
          balance: {
            decrement: requiredReduction,
          },
        },
      });
    }

    return wasteItem;
  });

  return result;
};

export const updateWasteItemService = async (id, wasteItemData) => {
  const wasteItem = await getWasteItemByIdService(id);

  if (wasteItem.dropoff.status !== STATUS.PENDING) {
    throw new Error("Can only update items in pending dropoffs");
  }

  let newWasteType = null;
  if (
    wasteItemData.wasteTypeId &&
    wasteItemData.wasteTypeId !== wasteItem.wasteTypeId
  ) {
    newWasteType = await getWasteTypeByIdService(wasteItemData.wasteTypeId);
    if (!newWasteType.isActive) {
      throw new Error("Selected waste type is not active");
    }
  }

  const updateData = {};
  if (wasteItemData.wasteTypeId)
    updateData.wasteTypeId = wasteItemData.wasteTypeId;
  if (wasteItemData.notes !== undefined) updateData.notes = wasteItemData.notes;
  if (wasteItemData.image !== undefined) updateData.image = wasteItemData.image;

  const result = await prisma.$transaction(async (prisma) => {
    let updatedWasteItem;
    let oldAmount = wasteItem.amount;
    let newAmount = oldAmount;
    let weightDifference = 0;

    if (wasteItemData.weight !== undefined) {
      const newWeight = parseFloat(wasteItemData.weight);
      weightDifference = newWeight - wasteItem.weight;

      const pointsAdjustment = Math.ceil(weightDifference * 10000);

      const pricePerKg = newWasteType
        ? newWasteType.pricePerKg
        : wasteItem.wasteType.pricePerKg;
      newAmount = newWeight * pricePerKg;

      updateData.weight = newWeight;
      updateData.amount = newAmount;

      const user = await prisma.user.findUnique({
        where: { id: wasteItem.dropoff.userId },
      });

      if (pointsAdjustment > 0) {
        if (user.points >= pointsAdjustment) {
          await prisma.user.update({
            where: { id: wasteItem.dropoff.userId },
            data: {
              points: { decrement: pointsAdjustment },
            },
          });
        } else {
          await prisma.user.update({
            where: { id: wasteItem.dropoff.userId },
            data: {
              balance: { decrement: pointsAdjustment },
            },
          });
        }
      } else if (pointsAdjustment < 0) {
        await prisma.user.update({
          where: { id: wasteItem.dropoff.userId },
          data: {
            balance: { increment: Math.abs(pointsAdjustment) },
          },
        });
      }
    } else if (newWasteType) {
      newAmount = wasteItem.weight * newWasteType.pricePerKg;
      updateData.amount = newAmount;
    }

    updatedWasteItem = await prisma.wasteItem.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        wasteType: true,
      },
    });

    if (weightDifference !== 0 || newAmount !== oldAmount) {
      await prisma.dropoff.update({
        where: {
          id: wasteItem.dropoffId,
        },
        data: {
          totalWeight: {
            increment: weightDifference,
          },
          totalAmount: {
            increment: newAmount - oldAmount,
          },
        },
      });
    }

    return updatedWasteItem;
  });

  return result;
};

export const removeWasteItemService = async (id) => {
  const wasteItem = await getWasteItemByIdService(id);

  if (wasteItem.dropoff.status !== STATUS.PENDING) {
    throw new Error("Can only delete items from pending dropoffs");
  }

  await prisma.$transaction(async (prisma) => {
    await prisma.wasteItem.delete({
      where: {
        id,
      },
    });

    await prisma.dropoff.update({
      where: {
        id: wasteItem.dropoffId,
      },
      data: {
        totalWeight: {
          decrement: wasteItem.weight,
        },
        totalAmount: {
          decrement: wasteItem.amount,
        },
      },
    });

    const refundAmount = Math.ceil(wasteItem.weight * 10000);

    await prisma.user.update({
      where: {
        id: wasteItem.dropoff.userId,
      },
      data: {
        balance: {
          increment: refundAmount,
        },
      },
    });
  });

  return { message: "Waste item deleted successfully" };
};
