import { FoundItem, Prisma } from "@prisma/client";
import { TFilter } from "../../global/interface";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { systemSettingsService } from "../systemSettings/systemSettings.service";
import { updateItemEmbedding } from "../aiSearch/aiSearch.service";

const toggleFoundStatus = async (id: string, requestingUser: JwtPayload) => {
  const currentItem = await prisma.foundItem.findUnique({
    where: { id },
    select: { isClaimed: true, userId: true },
  });

  if (!currentItem) {
    throw new AppError(StatusCodes.NOT_FOUND, "Found item report not found.");
  }

  // Only the owner or an admin can toggle the found status
  if (requestingUser.role !== "ADMIN" && currentItem.userId !== requestingUser.id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this item."
    );
  }

  const result = await prisma.foundItem.update({
    where: { id },
    data: { isClaimed: !currentItem.isClaimed },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: true,
    },
  });
  return result;
};

const createFoundItem = async (data: any, userId: string) => {
  const settings = await systemSettingsService.getSettings();
  const approvalStatus = settings.requireItemApproval ? "PENDING" : "PUBLISHED";

  const result = await prisma.foundItem.create({
    data: {
      categoryId: data.categoryId,
      description: data.description,
      date: new Date(data.date),
      claimProcess: data.claimProcess || "",
      img: data.img || "",
      foundItemName: data.foundItemName,
      location: data.location,
      userId,
      approvalStatus,
      aiTags: data.aiTags || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      category: true,
    },
  });

  // Generate and save embedding asynchronously
  updateItemEmbedding(
    "foundItems",
    result.id,
    `${result.foundItemName}. ${result.description}`
  ).catch((err) => console.error("Failed to update found item embedding on create:", err));

  return result;
};

const getFoundItem = async (data: TFilter) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "foundItemName",
    sortOrder = "asc",
    foundItemName,
  } = data;

  const whereConditions: Prisma.FoundItemWhereInput = {
    isDeleted: false,
    isExpired: false,
    approvalStatus: "PUBLISHED",
    isClaimed: false,
  };

  if (data.categoryId) {
    whereConditions.categoryId = data.categoryId;
  }

  if (foundItemName) {
    whereConditions.foundItemName = {
      contains: foundItemName,
      mode: "insensitive",
    };
  }

  if (searchTerm) {
    whereConditions.OR = [
      { foundItemName: { contains: searchTerm, mode: "insensitive" } },
      { location: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const [result, total] = await Promise.all([
    prisma.foundItem.findMany({
      where: whereConditions,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
    }),
    prisma.foundItem.count({ where: whereConditions }),
  ]);

  return {
    data: result,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};
const getSingleFoundItem = async (id: string) => {
  const result = await prisma.foundItem.findFirst({
    where: {
      id,
      isDeleted: false, // Only get non-deleted items
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      category: true,
    },
  });
  return result;
};

const getMyFoundItem = async (user: JwtPayload) => {
  const result = await prisma.foundItem.findMany({
    where: {
      userId: user.id,
      isDeleted: false,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      category: true,
    },
  });
  return result;
};

const editMyFoundItem = async (data: any, user: JwtPayload) => {
  const { id, foundItemName, description, location, date, claimProcess, img } = data;

  const isExist = await prisma.foundItem.findFirst({
    where: { id, userId: user.id, isDeleted: false },
  });

  if (!isExist) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Found item not found or you are not authorized to edit this report.",
    );
  }

  const updatePayload: any = {};
  if (foundItemName !== undefined) updatePayload.foundItemName = foundItemName;
  if (description !== undefined) updatePayload.description = description;
  if (location !== undefined) updatePayload.location = location;
  if (date !== undefined) updatePayload.date = new Date(date);
  if (claimProcess !== undefined) updatePayload.claimProcess = claimProcess;
  if (img !== undefined) updatePayload.img = img;

  const result = await prisma.foundItem.update({
    where: { id },
    data: updatePayload,
  });

  if (foundItemName !== undefined || description !== undefined) {
    updateItemEmbedding(
      "foundItems",
      result.id,
      `${result.foundItemName}. ${result.description}`
    ).catch((err) => console.error("Failed to update found item embedding on edit:", err));
  }

  return result;
};
const deleteMyFoundItem = async (id: string, user?: JwtPayload) => {
  const whereCondition: any = { id };

  if (user && user.role !== "ADMIN") {
    whereCondition.userId = user.id;
  }

  const result = await prisma.foundItem.update({
    where: whereCondition,
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
  return result;
};

const getAllFoundItemsAdmin = async (user: JwtPayload, page: number = 1, limit: number = 10, search: string = "") => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }

  const skip = (page - 1) * limit;

  const where: any = { isDeleted: false };

  if (search) {
    where.OR = [
      { foundItemName: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.foundItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
      },
      skip,
      take: limit,
    }),
    prisma.foundItem.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

const approveFoundItem = async (id: string, user: JwtPayload) => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }
  const item = await prisma.foundItem.findFirst({
    where: { id, isDeleted: false },
  });
  if (!item) throw new AppError(StatusCodes.NOT_FOUND, "Found item not found.");
  return prisma.foundItem.update({
    where: { id },
    data: { approvalStatus: "PUBLISHED" },
  });
};

export const foundItemService = {
  createFoundItem,
  getFoundItem,
  getSingleFoundItem,
  getMyFoundItem,
  editMyFoundItem,
  deleteMyFoundItem,
  approveFoundItem,
  getAllFoundItemsAdmin,
};
