import {
  findAllWasteBanksModel,
  findWasteBankByIdModel,
  createWasteBankModel,
  updateWasteBankModel,
  deleteWasteBankModel,
  checkWasteBankNameExistsModel,
} from "../models/waste-bank.model.js";

export const getAllWasteBanksService = async (page = 1, limit = 10) => {
  const { wasteBanks, totalWasteBanks } = await findAllWasteBanksModel(
    page,
    limit
  );

  return {
    data: wasteBanks,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalWasteBanks / limit),
      totalWasteBanks,
      hasNextPage: page < Math.ceil(totalWasteBanks / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getWasteBankByIdService = async (id) => {
  const wasteBank = await findWasteBankByIdModel(id);
  if (!wasteBank) {
    throw new Error("Waste bank not found");
  }
  return wasteBank;
};

export const createWasteBankService = async (data) => {
  const { name, address } = data;

  if (!name || !address) {
    throw new Error("Name and address are required");
  }

  const existingWasteBank = await checkWasteBankNameExistsModel(name);
  if (existingWasteBank) {
    throw new Error("Waste bank with this name already exists");
  }

  return await createWasteBankModel({
    name: name.trim(),
    address: address.trim(),
  });
};

export const updateWasteBankService = async (id, data) => {
  const wasteBank = await findWasteBankByIdModel(id);
  if (!wasteBank) {
    throw new Error("Waste bank not found");
  }

  const updateData = {};

  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw new Error("Name cannot be empty");
    }

    const existingWasteBank = await checkWasteBankNameExistsModel(
      data.name.trim(),
      id
    );
    if (existingWasteBank) {
      throw new Error("Waste bank with this name already exists");
    }

    updateData.name = data.name.trim();
  }

  if (data.address !== undefined) {
    if (!data.address.trim()) {
      throw new Error("Address cannot be empty");
    }
    updateData.address = data.address.trim();
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields to update");
  }

  return await updateWasteBankModel(id, updateData);
};

export const deleteWasteBankService = async (id) => {
  const wasteBank = await findWasteBankByIdModel(id);
  if (!wasteBank) {
    throw new Error("Waste bank not found");
  }

  if (wasteBank._count.dropoffs > 0) {
    throw new Error(
      "Cannot delete waste bank that has dropoffs associated with it"
    );
  }

  await deleteWasteBankModel(id);
  return { message: "Waste bank deleted successfully" };
};
