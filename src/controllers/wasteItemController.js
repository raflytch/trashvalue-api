import {
    getWasteItemsByDropoffIdService,
    getWasteItemByIdService,
    addWasteItemService,
    updateWasteItemService,
    removeWasteItemService,
  } from "../services/wasteItemService.js";
  import { getDropoffByIdService } from "../services/dropoffService.js";
  import { response } from "../core/response.js";
  import imagekit from "../utils/imagekit.js";
  
export const getWasteItemsController = async (req, res) => {
    try {
      const { dropoffId } = req.params;
  
      const dropoff = await getDropoffByIdService(dropoffId);

      if (req.user.role !== "ADMIN" && req.user.id !== dropoff.userId) {
        return response.error(res, "Unauthorized access", 403);
      }
  
      const wasteItems = await getWasteItemsByDropoffIdService(dropoffId);
  
      return response.success(
        res,
        wasteItems,
        "Successfully retrieved waste items"
      );
    } catch (error) {
      if (error.message.includes("not found")) {
        return response.error(res, error.message, 404);
      }
      return response.error(res, error.message);
    }
};
  
export const getWasteItemByIdController = async (req, res) => {
    try {
      const { id } = req.params;
  
      const wasteItem = await getWasteItemByIdService(id);
      
      const dropoff = await getDropoffByIdService(wasteItem.dropoffId);
      
      if (req.user.role !== "ADMIN" && req.user.id !== dropoff.userId) {
        return response.error(res, "Unauthorized access", 403);
      }
  
      return response.success(res, wasteItem, "Waste item found successfully");
    } catch (error) {
      if (error.message.includes("not found")) {
        return response.error(res, error.message, 404);
      }
      return response.error(res, error.message);
    }
};
  
export const createWasteItemController = async (req, res) => {
    try {
      const { dropoffId } = req.params;
      const { wasteTypeId, weight, notes } = req.body;
  
      if (!wasteTypeId || !weight) {
        return response.validation(res, {
          message: "Waste type ID and weight are required",
        });
      }

      const dropoff = await getDropoffByIdService(dropoffId);
      
      if (req.user.role !== "ADMIN" && req.user.id !== dropoff.userId) {
        return response.error(res, "Unauthorized access", 403);
      }
  
      let image = null;
      if (req.file) {
        const file = req.file;
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: `waste_item_${Date.now()}`,
          folder: "/waste-items",
        });
        image = uploadResponse.url;
      }
  
      const wasteItemData = {
        wasteTypeId,
        weight: parseFloat(weight),
        notes,
        image,
      };
  
      const wasteItem = await addWasteItemService(dropoffId, wasteItemData);
  
      return response.success(
        res,
        wasteItem,
        "Waste item created successfully",
        201
      );
    } catch (error) {
      if (error.message.includes("not found")) {
        return response.error(res, error.message, 404);
      }
      if (error.message.includes("not active")) {
        return response.validation(res, { message: error.message });
      }
      if (error.message.includes("Can only add items")) {
        return response.validation(res, { message: error.message });
      }
      return response.error(res, error.message);
    }
};
  
export const updateWasteItemController = async (req, res) => {
    try {
      const { id } = req.params;
      const { wasteTypeId, weight, notes } = req.body;
  
      const wasteItem = await getWasteItemByIdService(id);
      
      const dropoff = await getDropoffByIdService(wasteItem.dropoffId);
      
      if (req.user.role !== "ADMIN" && req.user.id !== dropoff.userId) {
        return response.error(res, "Unauthorized access", 403);
      }
  
      let updateData = {};
  
      if (wasteTypeId !== undefined) updateData.wasteTypeId = wasteTypeId;
      if (weight !== undefined) updateData.weight = parseFloat(weight);
      if (notes !== undefined) updateData.notes = notes;
  
      if (req.file) {
        const file = req.file;
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: `waste_item_${Date.now()}`,
          folder: "/waste-items",
        });
        updateData.image = uploadResponse.url;
      }
  
      const updatedWasteItem = await updateWasteItemService(id, updateData);
  
      return response.success(
        res,
        updatedWasteItem,
        "Waste item updated successfully"
      );
    } catch (error) {
      if (error.message.includes("not found")) {
        return response.error(res, error.message, 404);
      }
      if (error.message.includes("not active")) {
        return response.validation(res, { message: error.message });
      }
      if (error.message.includes("Can only update items")) {
        return response.validation(res, { message: error.message });
      }
      return response.error(res, error.message);
    }
};
  
export const deleteWasteItemController = async (req, res) => {
    try {
      const { id } = req.params;
  
      const wasteItem = await getWasteItemByIdService(id);
      
      const dropoff = await getDropoffByIdService(wasteItem.dropoffId);
      
      // Only admin or the owner can delete waste items
      if (req.user.role !== "ADMIN" && req.user.id !== dropoff.userId) {
        return response.error(res, "Unauthorized access", 403);
      }
  
      await removeWasteItemService(id);
  
      return response.success(res, null, "Waste item deleted successfully");
    } catch (error) {
      if (error.message.includes("not found")) {
        return response.error(res, error.message, 404);
      }
      if (error.message.includes("Can only delete items")) {
        return response.validation(res, { message: error.message });
      }
      return response.error(res, error.message);
    }
};