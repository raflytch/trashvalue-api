import {
  getAllWasteTypesService,
  getWasteTypeByIdService,
  addWasteTypeService,
  updateWasteTypeService,
  removeWasteTypeService,
} from "../services/waste-type.service.js";
import { response } from "../core/response.js";
import imagekit from "../utils/imagekit.js";

export const getWasteTypesController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const isActive = req.query.isActive;

    const result = await getAllWasteTypesService(page, limit, isActive);

    return response.success(
      res,
      result.data,
      "Successfully retrieved waste types",
      200,
      result.metadata
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};

export const getWasteTypeByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const wasteType = await getWasteTypeByIdService(id);

    return response.success(res, wasteType, "Waste type found successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const createWasteTypeController = async (req, res) => {
  try {
    const { name, pricePerKg, description, isActive } = req.body;

    if (!name || pricePerKg === undefined) {
      return response.validation(res, {
        message: "Name and pricePerKg are required",
      });
    }

    let image = null;
    if (req.file) {
      const file = req.file;
      const uploadResponse = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: `waste_type_${Date.now()}`,
        folder: "/waste-types",
      });
      image = uploadResponse.url;
    }

    const wasteTypeData = {
      name,
      pricePerKg: parseFloat(pricePerKg),
      description,
      image,
      isActive: isActive === "true" || isActive === true, // coba
    };

    const wasteType = await addWasteTypeService(wasteTypeData);

    return response.success(
      res,
      wasteType,
      "Waste type created successfully",
      201
    );
  } catch (error) {
    if (error.message.includes("already exists")) {
      return response.error(res, error.message, 409);
    }
    return response.error(res, error.message);
  }
};

export const updateWasteTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pricePerKg, description, isActive } = req.body;

    let updateData = {};

    if (name !== undefined) updateData.name = name;
    if (pricePerKg !== undefined)
      updateData.pricePerKg = parseFloat(pricePerKg);
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive === "true";

    if (req.file) {
      const file = req.file;
      const uploadResponse = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: `waste_type_${Date.now()}`,
        folder: "/waste-types",
      });
      updateData.image = uploadResponse.url;
    }

    const updatedWasteType = await updateWasteTypeService(id, updateData);

    return response.success(
      res,
      updatedWasteType,
      "Waste type updated successfully"
    );
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("already exists")) {
      return response.error(res, error.message, 409);
    }
    return response.error(res, error.message);
  }
};

export const deleteWasteTypeController = async (req, res) => {
  try {
    const { id } = req.params;

    await removeWasteTypeService(id);

    return response.success(res, null, "Waste type deleted successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};
