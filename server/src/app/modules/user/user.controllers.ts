import { NextFunction, Request, Response } from "express";
import { userService } from "./user.service";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.body;
    const result = await userService.registerUser(user);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};
const blockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const result = await userService.blockUser(id, req.user);

    if (result == "active") {
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User Activated successfully",
        data: result,
      });
    } else {
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User Blocked successfully",
        data: result,
      });
    }
  } catch (error) {
    next(error);
  }
};
const changeUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { role } = req.body;
    const result = await userService.changeUserRole(id, role, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User role changed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
const softDeleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const result = await userService.softDeleteUser(id, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const result = await userService.verifyOtp(email, otp);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Email verified successfully. Welcome to PUPQuestC!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await userService.resendOtp(email);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "A new verification code has been sent to your email.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const allUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const result = await userService.allUsers(req.user, page, limit, search);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User retrieved successfully",
      data: result.data,
      meta: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPage: result.pagination.totalPages,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const userController = {
  registerUser,
  verifyOtp,
  resendOtp,
  allUsers,
  blockUser,
  changeUserRole,
  softDeleteUser,
};
