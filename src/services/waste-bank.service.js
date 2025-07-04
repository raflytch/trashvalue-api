import {
  findAllWasteBanksModel,
  findWasteBankByIdModel,
  createWasteBankModel,
  createManyWasteBanksModel,
  updateWasteBankModel,
  deleteWasteBankModel,
  deleteManyWasteBanksModel,
  checkWasteBankNameExistsModel,
  checkMultipleWasteBankNamesExistModel,
  findWasteBanksByIdsModel,
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

export const createManyWasteBanksService = async (wasteBanks) => {
  if (!Array.isArray(wasteBanks) || wasteBanks.length === 0) {
    throw new Error("Waste banks array is required");
  }

  if (wasteBanks.length > 100) {
    throw new Error("Maximum 100 waste banks can be created at once");
  }

  const validatedWasteBanks = [];
  const errors = [];

  for (let i = 0; i < wasteBanks.length; i++) {
    const wasteBank = wasteBanks[i];

    if (!wasteBank.name || !wasteBank.address) {
      errors.push(`Item ${i + 1}: Name and address are required`);
      continue;
    }

    if (
      typeof wasteBank.name !== "string" ||
      typeof wasteBank.address !== "string"
    ) {
      errors.push(`Item ${i + 1}: Name and address must be strings`);
      continue;
    }

    if (
      wasteBank.name.trim().length === 0 ||
      wasteBank.address.trim().length === 0
    ) {
      errors.push(`Item ${i + 1}: Name and address cannot be empty`);
      continue;
    }

    validatedWasteBanks.push({
      name: wasteBank.name.trim(),
      address: wasteBank.address.trim(),
    });
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(", ")}`);
  }

  const names = validatedWasteBanks.map((wb) => wb.name);
  const uniqueNames = [...new Set(names)];

  if (names.length !== uniqueNames.length) {
    throw new Error("Duplicate names found in the request");
  }

  const existingWasteBanks = await checkMultipleWasteBankNamesExistModel(names);
  if (existingWasteBanks.length > 0) {
    const existingNames = existingWasteBanks.map((wb) => wb.name);
    throw new Error(
      `Waste banks with these names already exist: ${existingNames.join(", ")}`
    );
  }

  const result = await createManyWasteBanksModel(validatedWasteBanks);

  return {
    message: `Successfully created ${result.count} waste banks`,
    count: result.count,
    created: validatedWasteBanks,
  };
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

export const deleteManyWasteBanksService = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Waste bank IDs array is required");
  }

  if (ids.length > 50) {
    throw new Error("Maximum 50 waste banks can be deleted at once");
  }

  const wasteBanks = await findWasteBanksByIdsModel(ids);

  if (wasteBanks.length === 0) {
    throw new Error("No waste banks found with the provided IDs");
  }

  const wasteBanksWithDropoffs = wasteBanks.filter(
    (wb) => wb._count.dropoffs > 0
  );
  if (wasteBanksWithDropoffs.length > 0) {
    const names = wasteBanksWithDropoffs.map((wb) => wb.name);
    throw new Error(
      `Cannot delete waste banks that have dropoffs: ${names.join(", ")}`
    );
  }

  const result = await deleteManyWasteBanksModel(ids);

  return {
    message: `Successfully deleted ${result.count} waste banks`,
    count: result.count,
  };
};
