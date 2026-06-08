import { NextFunction, Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { aiSearchService } from "./aiSearch.service";

const aiSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;

    const result = await aiSearchService.aiSearchItems(query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "AI search completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const aiImageSearch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { vector } = req.body;

    if (!vector || !Array.isArray(vector)) {
      res
        .status(400)
        .json({
          success: false,
          message: "No visual query embedding array vector provided by client",
        });
      return;
    }

    const result = await aiSearchService.aiImageSearch(vector);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Image search completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const aiSearchController = {
  aiSearch,
  aiImageSearch,
};
