import {
  findAllDropoffsModel,
  findDropoffsByUserIdModel,
  findDropoffByIdModel,
  createDropoffModel,
  updateDropoffStatusModel,
  updateDropoffModel,
  deleteDropoffModel,
} from "../models/dropoff.model.js";
import { STATUS, TRANSACTION_TYPE, PICKUP_METHOD } from "../core/constant.js";
import prisma from "../config/prisma.js";

export const getAllDropoffsService = async (page = 1, limit = 10, status) => {
  const { dropoffs, totalDropoffs } = await findAllDropoffsModel(
    page,
    limit,
    status
  );

  return {
    data: dropoffs,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalDropoffs / limit),
      totalDropoffs,
    },
  };
};

export const getDropoffsByUserIdService = async (
  userId,
  page = 1,
  limit = 10,
  status
) => {
  const { dropoffs, totalDropoffs } = await findDropoffsByUserIdModel(
    userId,
    page,
    limit,
    status
  );

  return {
    data: dropoffs,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalDropoffs / limit),
      totalDropoffs,
    },
  };
};

export const getDropoffByIdService = async (id) => {
  const dropoff = await findDropoffByIdModel(id);

  if (!dropoff) {
    throw new Error("Dropoff not found");
  }

  return dropoff;
};

export const createDropoffService = async (userId, dropoffData) => {
  let totalWeight = 0;
  let totalAmount = 0;

  const result = await prisma.$transaction(async (prisma) => {
    const dropoff = await prisma.dropoff.create({
      data: {
        userId,
        totalWeight,
        totalAmount,
        pickupAddress: dropoffData.pickupAddress,
        pickupDate: dropoffData.pickupDate
          ? new Date(dropoffData.pickupDate)
          : null,
        pickupMethod: dropoffData.pickupMethod || PICKUP_METHOD.DROPOFF,
        notes: dropoffData.notes,
        status: STATUS.PENDING,
      },
    });

    return dropoff;
  });

  return result;
};

export const updateDropoffStatusService = async (id, status) => {
  const dropoff = await findDropoffByIdModel(id);

  if (!dropoff) {
    throw new Error("Dropoff not found");
  }

  const validTransitions = {
    [STATUS.PENDING]: [STATUS.PROCESSING, STATUS.REJECTED, STATUS.CANCELLED],
    [STATUS.PROCESSING]: [STATUS.COMPLETED, STATUS.REJECTED],
    [STATUS.COMPLETED]: [],
    [STATUS.REJECTED]: [],
    [STATUS.CANCELLED]: [],
  };

  if (!validTransitions[dropoff.status].includes(status)) {
    throw new Error(
      `Invalid status transition from ${dropoff.status} to ${status}`
    );
  }

  const updatedDropoff = await updateDropoffStatusModel(id, status);

  if (status === STATUS.COMPLETED) {
    await prisma.user.update({
      where: {
        id: dropoff.userId,
      },
      data: {
        balance: {
          increment: dropoff.totalAmount,
        },
        points: {
          increment: Math.floor(dropoff.totalAmount),
        },
      },
    });

    await prisma.transaction.create({
      data: {
        userId: dropoff.userId,
        amount: dropoff.totalAmount,
        type: TRANSACTION_TYPE.DEPOSIT,
        status: STATUS.COMPLETED,
        description: `Completed dropoff #${id}`,
      },
    });
  }

  return updatedDropoff;
};

export const cancelDropoffService = async (id, userId) => {
  const dropoff = await findDropoffByIdModel(id);

  if (!dropoff) {
    throw new Error("Dropoff not found");
  }

  if (dropoff.status !== STATUS.PENDING) {
    throw new Error("Only pending dropoffs can be cancelled");
  }

  if (userId && dropoff.userId !== userId) {
    throw new Error("You are not authorized to cancel this dropoff");
  }

  const updatedDropoff = await updateDropoffStatusModel(id, STATUS.CANCELLED);

  return updatedDropoff;
};

export const deleteDropoffService = async (id) => {
  const dropoff = await findDropoffByIdModel(id);

  if (!dropoff) {
    throw new Error("Dropoff not found");
  }

  if (dropoff.status !== STATUS.PENDING) {
    throw new Error("Only pending dropoffs can be deleted");
  }

  await deleteDropoffModel(id);

  return { message: "Dropoff deleted successfully" };
};
