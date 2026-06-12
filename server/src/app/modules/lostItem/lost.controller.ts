import { NextFunction, Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { lostItemServices } from "./lostItem.service";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { z } from "zod";
import { errorResponses } from "../../utils/errorResponse";

// Configure Cloudinary (Make sure these are set in your .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validation schema for toggle found status
const toggleFoundStatusSchema = z.object({
  body: z.object({
    id: z.string({ required_error: "Item ID is required" }).uuid("Invalid item ID format"),
  }),
});

const toggleFoundStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate input before database operation
    const validationResult = toggleFoundStatusSchema.safeParse(req);
    if (!validationResult.success) {
      return errorResponses.badRequest(
        res,
        validationResult.error.errors[0].message,
        validationResult.error.errors
      );
    }

    const { id } = req.body;
    const result = await lostItemServices.toggleFoundStatus(id, req.user);
    const message = result.isFound
      ? "Item marked as found successfully"
      : "Item marked as not found successfully";

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createLostItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let imageUrl = req.body.img || "";
    let aiTagsString: string | null = null;

    // 1 & 2. Check if a file is attached and upload it to Cloudinary with auto-tagging
    if (req.file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "pupquest_items",
          auto_tagging: 0.6, // Request Cloudinary to auto-tag with 60% confidence threshold
        });

        imageUrl = uploadResult.secure_url;

        // 3. Extract Cloudinary tags and format as JSON string
        if (
          uploadResult.tags &&
          Array.isArray(uploadResult.tags) &&
          uploadResult.tags.length > 0
        ) {
          aiTagsString = JSON.stringify(uploadResult.tags);
        }

        // Cleanup local Multer file after successful upload
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cloudinaryError) {
        // Cleanup local file if Cloudinary upload fails
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponses.internalServerError(
          res,
          "Image upload failed. Please try again."
        );
      }
    }

    // Attach processed image URL and generated tags to the payload
    const itemData = {
      ...req.body,
      img: imageUrl,
      aiTags: aiTagsString,
    };

    const result = await lostItemServices.createLostItem(req.user.id, itemData);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Lost item reported successfully",
      data: result,
    });
  } catch (error) {
    // Safety cleanup in case Cloudinary or Prisma crashes
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

const getLostItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await lostItemServices.getLostItem(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost items retrieved successfully",
      meta: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPage: result.pagination.totalPage,
      },
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleLostItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await lostItemServices.getSingleLostItem(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyLostItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await lostItemServices.getMyLostItem(req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your lost items retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const editMyLostItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await lostItemServices.editMyLostItem(req.body, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item edited successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMyLostItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    // Ipinapasa ang req.user para sa ownership check sa service
    await lostItemServices.deleteMyLostItem(id, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getAllLostItemsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const result = await lostItemServices.getAllLostItemsAdmin(req.user, page, limit, search);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "All lost items retrieved.",
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

const approveLostItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await lostItemServices.approveLostItem(id, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item approved and published.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const lostItemController = {
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
