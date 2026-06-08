import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse, { TMeta } from "../../global/response";
import { foundItemService } from "./foundItem.service";
import { utils } from "../../utils/utils";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { errorResponses } from "../../utils/errorResponse";

// Configure Cloudinary (Make sure these are set in your .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createFoundItem = async (
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

    // Call service to save to DB
    const result = await foundItemService.createFoundItem(
      itemData,
      req.user.id,
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Found item reported successfully",
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

const getFoundItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const meta = await utils.calculateMeta(req.query);
    const result = await foundItemService.getFoundItem(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found items retrieved successfully",
      meta: meta as TMeta,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleFoundItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await foundItemService.getSingleFoundItem(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyFoundItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await foundItemService.getMyFoundItem(req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your found items retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const editMyFoundItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await foundItemService.editMyFoundItem(req.body, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item edited successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMyFoundItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    await foundItemService.deleteMyFoundItem(id, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getAllFoundItemsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const result = await foundItemService.getAllFoundItemsAdmin(req.user, page, limit, search);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "All found items retrieved.",
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

const approveFoundItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await foundItemService.approveFoundItem(id, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item approved and published.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const foundItemController = {
  createFoundItem,
  getFoundItem,
  getSingleFoundItem,
  getMyFoundItem,
  editMyFoundItem,
  deleteMyFoundItem,
  approveFoundItem,
  getAllFoundItemsAdmin,
};
