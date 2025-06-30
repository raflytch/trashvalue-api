import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const findUserByPhone = async (phone) => {
  return prisma.user.findUnique({
    where: {
      phone,
    },
  });
};

export const createUser = async (userData) => {
  const { password, ...otherData } = userData;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return prisma.user.create({
    data: {
      ...otherData,
      password: hashedPassword,
    },
  });
};

export const findUserByEmailOrPhone = async (email) => {
  return prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone: email }],
    },
  });
};

export const findAllUsers = async (page, limit) => {
  const skip = (page - 1) * limit;
  const users = await prisma.user.findMany({
    skip,
    take: limit,
  });
  const totalUsers = await prisma.user.count();
  return { users, totalUsers };
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const deleteUser = async (id) => {
  return prisma.user.delete({
    where: {
      id,
    },
  });
};

export const updateUserRole = async (id, role) => {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      role,
    },
  });
};

export const updateUserProfile = async (id, userData) => {
  const { password, ...updateData } = userData;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updateData.password = hashedPassword;
  }

  return prisma.user.update({
    where: {
      id,
    },
    data: updateData,
  });
};

export const findUserByPhoneExcludingId = async (phone, id) => {
  return prisma.user.findFirst({
    where: {
      phone,
      id: { not: id },
    },
  });
};
