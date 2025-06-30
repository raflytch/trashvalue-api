import {
  findAllWasteTypesModel,
  findWasteTypeByIdModel,
  findWasteTypeByNameModel,
  createWasteTypeModel,
  updateWasteTypeModel,
  deleteWasteTypeModel,
  findWasteTypeByNameExcludingIdModel,
} from "../models/wasteTypeModel.js";

export const getAllWasteTypesService = async (
  page = 1,
  limit = 10,
  isActive
) => {
  const { wasteTypes, totalWasteTypes } = await findAllWasteTypesModel(
    page,
    limit,
    isActive
  );

  return {
    data: wasteTypes,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalWasteTypes / limit),
      totalWasteTypes,
    },
  };
};

export const getWasteTypeByIdService = async (id) => {
  const wasteType = await findWasteTypeByIdModel(id);

  if (!wasteType) {
    throw new Error("Waste type not found");
  }

  return wasteType;
};

export const addWasteTypeService = async (wasteTypeData) => {
  const existingWasteType = await findWasteTypeByNameModel(wasteTypeData.name);
  if (existingWasteType) {
    throw new Error("Waste type with this name already exists");
  }

  return await createWasteTypeModel(wasteTypeData);
};

export const updateWasteTypeService = async (id, wasteTypeData) => {
  const wasteType = await findWasteTypeByIdModel(id);

  if (!wasteType) {
    throw new Error("Waste type not found");
  }

  if (wasteTypeData.name && wasteTypeData.name !== wasteType.name) {
    const existingWasteType = await findWasteTypeByNameExcludingIdModel(
      wasteTypeData.name,
      id
    );
    if (existingWasteType) {
      throw new Error("Waste type with this name already exists");
    }
  }

  return await updateWasteTypeModel(id, wasteTypeData);
};

export const removeWasteTypeService = async (id) => {
  const wasteType = await findWasteTypeByIdModel(id);

  if (!wasteType) {
    throw new Error("Waste type not found");
  }

  await deleteWasteTypeModel(id);

  return { message: "Waste type deleted successfully" };
};
