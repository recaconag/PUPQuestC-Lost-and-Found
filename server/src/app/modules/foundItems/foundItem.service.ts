import { FoundItem, Prisma } from "@prisma/client";
import { TFilter } from "../../global/interface";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { systemSettingsService } from "../systemSettings/systemSettings.service";

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
  };

  // 1. Filter by category
  if (data.categoryId) {
    whereConditions.categoryId = data.categoryId;
  }

  // 2. Hide claimed items from public list by default
  whereConditions.isClaimed = false;

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

  const result = await prisma.foundItem.findMany({
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
  });

  return result;
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

// get my lost item
const getMyFoundItem = async (user: JwtPayload) => {
  const result = await prisma.foundItem.findMany({
    where: {
      userId: user.id,
      isDeleted: false,
    },
    include: {
      user: true,
      category: true,
    },
  });
  return result;
};

const editMyFoundItem = async (data: any, user: JwtPayload) => {
  const { id, ...payload } = data;

  const isExist = await prisma.foundItem.findFirst({
    where: { id, userId: user.id, isDeleted: false },
  });

  if (!isExist) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Found item not found or you are not authorized to edit this report.",
    );
  }

  if (payload.date) {
    payload.date = new Date(payload.date);
  }

  const result = await prisma.foundItem.update({
    where: { id },
    data: payload,
  });
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
