import prisma from "../config/prisma.js";

export const findAllDropoffsModel = async (page, limit, status, userId) => {
  const skip = (page - 1) * limit;

  let whereClause = {};
  if (status) {
    whereClause.status = status;
  }
  if (userId) {
    whereClause.userId = userId;
  }

  const dropoffs = await prisma.dropoff.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      wasteItems: {
        include: {
          wasteType: true,
        },
      },
    },
  });

  const totalDropoffs = await prisma.dropoff.count({
    where: whereClause,
  });

  return { dropoffs, totalDropoffs };
};

export const findDropoffsByUserIdModel = async (userId, page, limit, status) => {
  const skip = (page - 1) * limit;

  let whereClause = { userId };
  if (status) {
    whereClause.status = status;
  }

  const dropoffs = await prisma.dropoff.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      wasteItems: {
        include: {
          wasteType: true,
        },
      },
    },
  });

  const totalDropoffs = await prisma.dropoff.count({
    where: whereClause,
  });

  return { dropoffs, totalDropoffs };
};

export const findDropoffByIdModel = async (id) => {
  return prisma.dropoff.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      wasteItems: {
        include: {
          wasteType: true,
        },
      },
    },
  });
};

export const createDropoffModel = async (dropoffData) => {
  return prisma.dropoff.create({
    data: dropoffData,
    include: {
      wasteItems: true,
    },
  });
};

export const updateDropoffStatusModel = async (id, status) => {
  return prisma.dropoff.update({
    where: {
      id,
    },
    data: {
      status,
    },
    include: {
      wasteItems: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });
};

export const updateDropoffModel = async (id, dropoffData) => {
  return prisma.dropoff.update({
    where: {
      id,
    },
    data: dropoffData,
    include: {
      wasteItems: true,
    },
  });
};

export const deleteDropoffModel = async (id) => {
  await prisma.wasteItem.deleteMany({
    where: {
      dropoffId: id,
    },
  });

  return prisma.dropoff.delete({
    where: {
      id,
    },
  });
};