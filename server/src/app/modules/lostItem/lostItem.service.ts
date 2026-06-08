import { LostItem } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { systemSettingsService } from "../systemSettings/systemSettings.service";

const toggleFoundStatus = async (id: string) => {
  // First get the current item to check its status
  const currentItem = await prisma.lostItem.findUnique({
    where: { id },
    select: { isFound: true },
  });

  if (!currentItem) {
    throw new AppError(StatusCodes.NOT_FOUND, "Lost item report not found.");
  }

  // Toggle the found status
  const result = await prisma.lostItem.update({
    where: {
      id,
    },
    data: {
      isFound: !currentItem.isFound,
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

const createLostItem = async (userId: string, item: any) => {
  const settings = await systemSettingsService.getSettings();
  const approvalStatus = settings.requireItemApproval ? "PENDING" : "PUBLISHED";

  const result = await prisma.lostItem.create({
    data: {
      lostItemName: item.lostItemName,
      description: item.description,
      categoryId: item.categoryId,
      img: item.img || "",
      location: item.location,
      date: new Date(item.date),
      userId,
      approvalStatus,
      aiTags: item.aiTags || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      category: true,
    },
  });
  return result;
};

const getLostItem = async () => {
  const result = await prisma.lostItem.findMany({
    where: {
      isDeleted: false,
      isExpired: false,
      approvalStatus: "PUBLISHED",
      isFound: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, userImg: true },
      },
      category: true,
    },
  });
  return result;
};

// get single lost item
const getSingleLostItem = async (singleId: string) => {
  const result = await prisma.lostItem.findFirst({
    where: {
      id: singleId,
      isDeleted: false, // Only get non-deleted items
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, userImg: true },
      },
      category: true,
    },
  });
  return result;
};
// get my lost item
const getMyLostItem = async (user: JwtPayload) => {
  const result = await prisma.lostItem.findMany({
    where: {
      userId: user.id,
      isDeleted: false,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, userImg: true },
      },
      category: true,
    },
  });
  return result;
};

const editMyLostItem = async (data: any, user: JwtPayload) => {
  const { id, ...updateData } = data;

  // Check ownership
  const isExist = await prisma.lostItem.findFirst({
    where: { id, userId: user.id, isDeleted: false },
  });

  if (!isExist) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to edit this item",
    );
  }

  if (updateData.date) {
    updateData.date = new Date(updateData.date);
  }

  const result = await prisma.lostItem.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true, userImg: true } },
      category: true,
    },
  });
  return result;
};
const deleteMyLostItem = async (id: string, user: JwtPayload) => {
  const isExist = await prisma.lostItem.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "Item not found");
  }

  // Admin OR Owner can delete
  if (user.role !== "ADMIN" && isExist.userId !== user.id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to delete this item",
    );
  }

  const result = await prisma.lostItem.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
  return result;
};
const getAllLostItemsAdmin = async (user: JwtPayload, page: number = 1, limit: number = 10, search: string = "") => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }

  const skip = (page - 1) * limit;

  const where: any = { isDeleted: false };

  if (search) {
    where.OR = [
      { lostItemName: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.lostItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, userImg: true } },
        category: true,
      },
      skip,
      take: limit,
    }),
    prisma.lostItem.count({
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

const approveLostItem = async (id: string, user: JwtPayload) => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }
  const item = await prisma.lostItem.findFirst({
    where: { id, isDeleted: false },
  });
  if (!item) throw new AppError(StatusCodes.NOT_FOUND, "Lost item not found.");
  return prisma.lostItem.update({
    where: { id },
    data: { approvalStatus: "PUBLISHED" },
  });
};

export const lostItemServices = {
  toggleFoundStatus,
  createLostItem,
  getLostItem,
  getSingleLostItem,
  getMyLostItem,
  editMyLostItem,
  deleteMyLostItem,
  approveLostItem,
  getAllLostItemsAdmin,
};
