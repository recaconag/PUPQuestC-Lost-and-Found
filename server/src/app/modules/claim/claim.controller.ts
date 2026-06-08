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

// =========================================================================
// EMERGING TECH PHASE 4: GENERATE QR CODE GENERATOR PIPELINE FOR ADMIN
// =========================================================================
const generateClaimQRCodeImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { claimId } = req.params;

    // A. I-verify kung umiiral ang claim record sa database via Prisma
    const existingClaim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { foundItem: true },
    });

    if (!existingClaim) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({
          success: false,
          message: "Claim record tracking hash not found",
        });
      return;
    }

    // B. Gumawa ng isang secure, cryptographically unique string token identifier
    const secureRandomToken = `PUPQC-CLAIM-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    // C. I-save ang token sa database at i-set ang state status bilang APPROVED
    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        qrCodeToken: secureRandomToken,
        status: "APPROVED", // Automatic status change to APPROVED
      },
    });

    // D. I-convert ang raw text token into a clean Base64 visual QR Code data-URI string
    const generatedQrCodeBase64String = await QRCode.toDataURL(
      secureRandomToken,
      {
        errorCorrectionLevel: "H", // High reliability verification mapping
        margin: 2,
        width: 300,
      },
    );

    console.log(
      "[Phase 4 Engine] Secure verification QR token mapped & rendered successfully!",
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Verification QR Code schema generated successfully",
      data: {
        token: secureRandomToken,
        qrCodeImage: generatedQrCodeBase64String, // Base64 string link for <img src={...}/> in React frontend
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
    const { claimId } = req.params; // Kumuha rin sa URL query fallback indicators

    console.log(
      "[Phase 4 Engine] Invoking scan verification metrics. Token:", scannedToken, "ID:", claimId
    );

    // A. Hanapin sa database gamit ang Token, kung wala, gamitin ang Claim ID mula sa scanner URL path
    let targetClaimRecord = null;

    if (scannedToken) {
      targetClaimRecord = await prisma.claim.findUnique({
        where: { qrCodeToken: scannedToken },
        include: { foundItem: true },
      });
    } else if (claimId) {
      targetClaimRecord = await prisma.claim.findUnique({
        where: { id: claimId },
        include: { foundItem: true },
      });
    }

    if (!targetClaimRecord) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({
          success: false,
          message: "Invalid or forged claim verification security token code string",
        });
      return;
    }

    if (targetClaimRecord.status === "CLAIMED") {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({
          success: false,
          message: "Security Warning: This token has already been scanned and item was successfully released previously!",
        });
      return;
    }

    // B. I-update ang Claim status to CLAIMED at FoundItem to isClaimed = true sa isang secure atomic database transaction
    await prisma.$transaction([
      prisma.claim.update({
        where: { id: targetClaimRecord.id },
        data: { status: "CLAIMED" },
      }),
      prisma.foundItem.update({
        where: { id: targetClaimRecord.foundItemId },
        data: { isClaimed: true },
      }),
    ]);

    console.log(
      "[Phase 4 Engine] Transaction database update success. Item officially released safely!",
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Verification successful! The item has been officially authenticated and successfully released to the rightful owner.",
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
