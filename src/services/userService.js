import {
  findUserByEmail,
  findUserByPhone,
  createUser,
  findAllUsers,
  findUserById,
  deleteUser,
  updateUserRole,
  updateUserProfile,
  findUserByPhoneExcludingId,
} from "../models/userModel.js";
import { findUserByEmailOrPhone } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (userData) => {
  if (userData.email) {
    const existingUserByEmail = await findUserByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error("User with this email already exists");
    }
  }

  const existingUserByPhone = await findUserByPhone(userData.phone);
  if (existingUserByPhone) {
    throw new Error("User with this phone number already exists");
  }

  const newUser = await createUser(userData);

  const { password, ...userWithoutPassword } = newUser;

  return userWithoutPassword;
};

export const loginUser = async (email, password) => {
  const user = await findUserByEmailOrPhone(email);

  if (!user) {
    throw new Error("Email tidak ditemukan");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Password salah");
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  const { password: _, ...userWithoutPassword } = user;

  return {
    data: userWithoutPassword,
    token,
  };
};

export const getAllUsers = async (page = 1, limit = 10) => {
  const { users, totalUsers } = await findAllUsers(page, limit);

  const usersWithoutPassword = users.map(
    ({ password, ...userWithoutPassword }) => userWithoutPassword
  );

  return {
    data: usersWithoutPassword,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    },
  };
};

export const getUserById = async (id) => {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("User not found");
  }

  const { password, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

export const removeUser = async (id) => {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("User not found");
  }

  await deleteUser(id);

  return { message: "User deleted successfully" };
};

export const updateRole = async (id, role) => {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await updateUserRole(id, role);

  const { password, ...userWithoutPassword } = updatedUser;

  return userWithoutPassword;
};

export const updateUserById = async (id, userData) => {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("User not found");
  }

  const { name, phone, address, password } = userData;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (address !== undefined) updateData.address = address;

  if (phone && phone !== user.phone) {
    const existingUserByPhone = await findUserByPhoneExcludingId(phone, id);
    if (existingUserByPhone) {
      throw new Error("Phone number already in use by another user");
    }
    updateData.phone = phone;
  }

  if (userData.profileImage) {
    updateData.profileImage = userData.profileImage;
  }

  if (userData.backgroundPhoto) {
    updateData.backgroundPhoto = userData.backgroundPhoto;
  }

  if (password) {
    updateData.password = password;
  }

  const updatedUser = await updateUserProfile(id, updateData);

  const { password: _, ...userWithoutPassword } = updatedUser;

  return userWithoutPassword;
};
