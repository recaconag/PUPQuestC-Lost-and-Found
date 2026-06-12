import { NextFunction, Request, Response } from "express";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma";

export const adminStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalFoundItems,
      totalLostItems,
      totalUsers,
      totalClaims,
      pendingClaims,
      approvedClaims,
    ] = await Promise.all([
      prisma.foundItem.count({ where: { isDeleted: false, approvalStatus: "PUBLISHED" } }),
      prisma.lostItem.count({ where: { isDeleted: false, approvalStatus: "PUBLISHED" } }),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.claim.count({ where: { isDeleted: false } }),
      prisma.claim.count({ where: { isDeleted: false, status: "PENDING" } }),
      prisma.claim.count({ where: { isDeleted: false, status: "APPROVED" } }),
    ]);

    const result = {
      foundItems: totalFoundItems,
      lostItems: totalLostItems,
      totalItems: totalFoundItems + totalLostItems,
      totalUsers,
      totalClaims,
      pendingClaims,
      approvedClaims,
    };

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Admin stats retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
