import { NextFunction, Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { claimsService } from "./claim.service";
import QRCode from "qrcode";
import crypto from "crypto";
import prisma from "../../config/prisma"; // Tiyaking tama ang path na ito patungo sa iyong prisma client config

const createClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await claimsService.createClaim(req.body, req.user);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Claim created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const result = await claimsService.getClaim(page, limit, search);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claims retrieved successfully",
      data: result.data,
      meta: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPage: result.pagination.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await claimsService.getMyClaim(req.user);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claims retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateClaimStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await claimsService.updateClaimStatus(
      req.params.claimId,
      req.body,
      req.user,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claims updated successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const generateClaimQRCodeImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { claimId } = req.params;

    const existingClaim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { foundItem: true },
    });

    if (!existingClaim) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Claim record not found",
      });
      return;
    }

    // Guard: User must be ADMIN or the owner of the claim
    if (req.user.role !== "ADMIN" && existingClaim.userId !== req.user.id) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to view this QR code",
      });
      return;
    }

    // M4: Guard — if a token already exists, return it without regenerating
    if (existingClaim.qrCodeToken) {
      const existingQrCode = await QRCode.toDataURL(existingClaim.qrCodeToken, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 300,
      });
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Existing verification QR Code returned",
        data: {
          token: existingClaim.qrCodeToken,
          qrCodeImage: existingQrCode,
        },
      });
      return;
    }

    const secureRandomToken = `PUPQC-CLAIM-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    // Execute in a transaction to approve claim, update item status, and reject other pending claims
    await prisma.$transaction([
      prisma.claim.update({
        where: { id: claimId },
        data: {
          qrCodeToken: secureRandomToken,
          status: "APPROVED",
        },
      }),
      prisma.foundItem.update({
        where: { id: existingClaim.foundItemId },
        data: { isClaimed: true },
      }),
      prisma.claim.updateMany({
        where: {
          foundItemId: existingClaim.foundItemId,
          id: { not: claimId },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      }),
    ]);

    const generatedQrCodeBase64String = await QRCode.toDataURL(
      secureRandomToken,
      {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 300,
      },
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Verification QR Code generated successfully",
      data: {
        token: secureRandomToken,
        qrCodeImage: generatedQrCodeBase64String,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyClaimQRCodeScanner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { scannedToken } = req.body;
    const { claimId } = req.params;

    let targetClaimRecord = null;

    if (scannedToken) {
      targetClaimRecord = await prisma.claim.findUnique({
        where: { qrCodeToken: scannedToken },
        include: { foundItem: true, user: true },
      });
    } else if (claimId) {
      targetClaimRecord = await prisma.claim.findUnique({
        where: { id: claimId },
        include: { foundItem: true, user: true },
      });
    }

    if (!targetClaimRecord) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Invalid or forged claim verification token",
      });
      return;
    }

    if (targetClaimRecord.status === "CLAIMED") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "This token has already been used. The item was previously released.",
      });
      return;
    }

    // M3: Use a transaction to mark CLAIMED, set isClaimed, and clear the QR token
    await prisma.$transaction([
      prisma.claim.update({
        where: { id: targetClaimRecord.id },
        data: { status: "CLAIMED", qrCodeToken: null },
      }),
      prisma.foundItem.update({
        where: { id: targetClaimRecord.foundItemId },
        data: { isClaimed: true },
      }),
    ]);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Verification successful! The item has been officially released to the rightful owner.",
      data: {
        claimDetails: targetClaimRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const claimsController = {
  createClaim,
  getClaim,
  updateClaimStatus,
  getMyClaim,
  generateClaimQRCodeImage, // New entry point exposed
  verifyClaimQRCodeScanner, // New entry point exposed
};
