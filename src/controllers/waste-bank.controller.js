import {
  getAllWasteBanksService,
  getWasteBankByIdService,
  createWasteBankService,
  createManyWasteBanksService,
  updateWasteBankService,
  deleteWasteBankService,
  deleteManyWasteBanksService,
} from "../services/waste-bank.service.js";
import { response } from "../core/response.js";

export const getAllWasteBanksController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1) {
      return response.validation(res, { page: "Page must be greater than 0" });
    }

    if (limit < 1 || limit > 100) {
      return response.validation(res, {
        limit: "Limit must be between 1 and 100",
      });
    }

    const result = await getAllWasteBanksService(page, limit);

    return response.success(
      res,
      result.data,
      "Successfully retrieved waste banks",
      200,
      result.metadata
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};

export const getWasteBankByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return response.validation(res, { id: "Waste bank ID is required" });
    }

    const wasteBank = await getWasteBankByIdService(id);

    return response.success(res, wasteBank, "Waste bank found successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const createWasteBankController = async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name || !address) {
      return response.validation(res, {
        message: "Name and address are required",
      });
    }

    const wasteBank = await createWasteBankService({ name, address });

    return response.success(
      res,
      wasteBank,
      "Waste bank created successfully",
      201
    );
  } catch (error) {
    if (error.message.includes("already exists")) {
      return response.error(res, error.message, 409);
    }
    return response.error(res, error.message);
  }
};

export const createManyWasteBanksController = async (req, res) => {
  try {
    const { wasteBanks } = req.body;

    if (!wasteBanks) {
      return response.validation(res, {
        message: "wasteBanks array is required",
      });
    }

    const result = await createManyWasteBanksService(wasteBanks);

    return response.success(
      res,
      result,
      "Waste banks created successfully",
      201
    );
  } catch (error) {
    if (
      error.message.includes("already exist") ||
      error.message.includes("Duplicate")
    ) {
      return response.error(res, error.message, 409);
    }
    if (
      error.message.includes("Validation errors") ||
      error.message.includes("Maximum")
    ) {
      return response.validation(res, { message: error.message });
    }
    return response.error(res, error.message);
  }
};

export const updateWasteBankController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    if (!id) {
      return response.validation(res, { id: "Waste bank ID is required" });
    }

    if (!name && !address) {
      return response.validation(res, {
        message: "At least one field (name or address) is required for update",
      });
    }

    const wasteBank = await updateWasteBankService(id, { name, address });

    return response.success(res, wasteBank, "Waste bank updated successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("already exists")) {
      return response.error(res, error.message, 409);
    }
    if (
      error.message.includes("cannot be empty") ||
      error.message.includes("No valid fields")
    ) {
      return response.validation(res, { message: error.message });
    }
    return response.error(res, error.message);
  }
};

export const deleteWasteBankController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return response.validation(res, { id: "Waste bank ID is required" });
    }

    const result = await deleteWasteBankService(id);

    return response.success(res, null, result.message);
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("Cannot delete")) {
      return response.validation(res, { message: error.message });
    }
    return response.error(res, error.message);
  }
};

export const deleteManyWasteBanksController = async (req, res) => {
  try {
    const { wasteBankIds } = req.body;

    if (!wasteBankIds) {
      return response.validation(res, {
        message: "wasteBankIds array is required",
      });
    }

    const result = await deleteManyWasteBanksService(wasteBankIds);

    return response.success(res, result, "Waste banks deleted successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (
      error.message.includes("Cannot delete") ||
      error.message.includes("Maximum")
    ) {
      return response.validation(res, { message: error.message });
    }
    return response.error(res, error.message);
  }
};
