import {
  getAllDropoffsService,
  getDropoffsByUserIdService,
  getDropoffByIdService,
  createDropoffService,
  updateDropoffStatusService,
  cancelDropoffService,
  deleteDropoffService,
} from "../services/dropoff.service.js";
import { response } from "../core/response.js";
import { USER_ROLE } from "../core/constant.js";

export const getDropoffsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let result;
    if (req.user.role === USER_ROLE.ADMIN) {
      result = await getAllDropoffsService(page, limit, status);
    } else {
      result = await getDropoffsByUserIdService(
        req.user.id,
        page,
        limit,
        status
      );
    }

    return response.success(
      res,
      result.data,
      "Successfully retrieved dropoffs",
      200,
      result.metadata
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};

export const getUserDropoffsController = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    if (req.user.role !== USER_ROLE.ADMIN && req.user.id !== userId) {
      return response.error(res, "Unauthorized access", 403);
    }

    const result = await getDropoffsByUserIdService(
      userId,
      page,
      limit,
      status
    );

    return response.success(
      res,
      result.data,
      "Successfully retrieved user dropoffs",
      200,
      result.metadata
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};

export const getDropoffByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const dropoff = await getDropoffByIdService(id);

    if (req.user.role !== USER_ROLE.ADMIN && req.user.id !== dropoff.userId) {
      return response.error(res, "Unauthorized access", 403);
    }

    return response.success(res, dropoff, "Dropoff found successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const createDropoffController = async (req, res) => {
  try {
    const { pickupAddress, pickupDate, pickupMethod, notes, wasteBankId } =
      req.body;

    const dropoffData = {
      pickupAddress,
      pickupDate,
      pickupMethod,
      notes,
      wasteBankId,
    };

    const dropoff = await createDropoffService(req.user.id, dropoffData);

    return response.success(res, dropoff, "Dropoff created successfully", 201);
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const updateDropoffStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return response.validation(res, {
        message: "Status is required",
      });
    }

    if (req.user.role !== USER_ROLE.ADMIN) {
      return response.error(res, "Unauthorized access", 403);
    }

    const updatedDropoff = await updateDropoffStatusService(id, status);

    return response.success(
      res,
      updatedDropoff,
      "Dropoff status updated successfully"
    );
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("Invalid status")) {
      return response.validation(res, { message: error.message });
    }
    return response.error(res, error.message);
  }
};

export const cancelDropoffController = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user.role === USER_ROLE.ADMIN ? null : req.user.id;

    const updatedDropoff = await cancelDropoffService(id, userId);

    return response.success(
      res,
      updatedDropoff,
      "Dropoff cancelled successfully"
    );
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("Only pending")) {
      return response.validation(res, { message: error.message });
    }
    if (error.message.includes("not authorized")) {
      return response.error(res, error.message, 403);
    }
    return response.error(res, error.message);
  }
};

export const deleteDropoffController = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== USER_ROLE.ADMIN) {
      return response.error(res, "Unauthorized access", 403);
    }

    await deleteDropoffService(id);

    return response.success(res, null, "Dropoff deleted successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("Only pending")) {
      return response.validation(res, { message: error.message });
    }
    return response.error(res, error.message);
  }
};
