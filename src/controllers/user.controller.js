import {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  removeUser,
  updateRole,
  updateUserById,
} from "../services/user.service.js";
import { response } from "../core/response.js";
import imagekit from "../utils/imagekit.js";

export const register = async (req, res) => {
  try {
    const { name, phone, email, password, address } = req.body;

    if (!name || !phone || !password || !address) {
      return response.validation(res, {
        message: "Name, phone, password, and address are required",
      });
    }

    let profileImage = null;
    let backgroundPhoto = null;

    if (req.files) {
      if (req.files.profileImage) {
        const file = req.files.profileImage[0];
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: `profile_${Date.now()}`,
          folder: "/users/profile",
        });
        profileImage = uploadResponse.url;
      }

      if (req.files.backgroundPhoto) {
        const file = req.files.backgroundPhoto[0];
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: `background_${Date.now()}`,
          folder: "/users/background",
        });
        backgroundPhoto = uploadResponse.url;
      }
    }

    const userData = {
      name,
      phone,
      email,
      password,
      address,
      profileImage,
      backgroundPhoto,
    };

    const user = await registerUser(userData);

    return response.success(res, user, "User registered successfully", 201);
  } catch (error) {
    if (error.message.includes("already exists")) {
      return response.error(res, error.message, 409);
    }
    return response.error(res, error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return response.validation(res, {
        message: "Email dan password wajib diisi",
      });
    }

    const { data, token } = await loginUser(email, password);
    return response.success(res, { ...data, token }, "Login berhasil");
  } catch (error) {
    return response.error(res, error.message, 401);
  }
};

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getAllUsers(page, limit);

    return response.success(
      res,
      result.data,
      "Berhasil mendapatkan semua user",
      200,
      result.metadata
    );
  } catch (error) {
    return response.error(res, error.message);
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    return response.success(res, user, "User found successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    await removeUser(id);

    return response.success(res, null, "User deleted successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return response.validation(res, {
        message: "Role is required",
      });
    }

    const validRoles = ["USER", "ADMIN"];
    if (!validRoles.includes(role)) {
      return response.validation(res, {
        message: "Invalid role. Must be USER or ADMIN",
      });
    }

    const updatedUser = await updateRole(id, role);

    return response.success(res, updatedUser, "User role updated successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    return response.error(res, error.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, password } = req.body;

    let updatedData = {};

    if (name !== undefined) updatedData.name = name;
    if (phone !== undefined) updatedData.phone = phone;
    if (address !== undefined) updatedData.address = address;
    if (password !== undefined) updatedData.password = password;

    if (req.files) {
      if (req.files.profileImage) {
        const file = req.files.profileImage[0];
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: `profile_${Date.now()}`,
          folder: "/users/profile",
        });
        updatedData.profileImage = uploadResponse.url;
      }

      if (req.files.backgroundPhoto) {
        const file = req.files.backgroundPhoto[0];
        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: `background_${Date.now()}`,
          folder: "/users/background",
        });
        updatedData.backgroundPhoto = uploadResponse.url;
      }
    }

    const updatedUser = await updateUserById(id, updatedData);

    return response.success(res, updatedUser, "User updated successfully");
  } catch (error) {
    if (error.message.includes("not found")) {
      return response.error(res, error.message, 404);
    }
    if (error.message.includes("already in use")) {
      return response.error(res, error.message, 409);
    }
    return response.error(res, error.message);
  }
};
