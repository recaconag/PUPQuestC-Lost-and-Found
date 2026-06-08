import { Response } from "express";
import config from "../config/config";

/**
 * Standardized error response utility for consistent error formatting across all controllers.
 * Ensures no sensitive data leaks in production and provides clean, user-friendly messages.
 */
export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errorDetails?: unknown
) => {
  const response: {
    success: false;
    message: string;
    errorDetails?: unknown;
    stack?: string;
  } = {
    success: false,
    message,
  };

  // Only include error details in development
  if (config.env === "development" && errorDetails) {
    response.errorDetails = errorDetails;
  }

  // Only include stack trace in development
  if (config.env === "development") {
    const error = new Error(message);
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Pre-configured error response helpers for common scenarios
 */
export const errorResponses = {
  badRequest: (res: Response, message: string = "Bad request", details?: unknown) =>
    sendErrorResponse(res, 400, message, details),
  
  unauthorized: (res: Response, message: string = "Unauthorized access", details?: unknown) =>
    sendErrorResponse(res, 401, message, details),
  
  forbidden: (res: Response, message: string = "Access denied", details?: unknown) =>
    sendErrorResponse(res, 403, message, details),
  
  notFound: (res: Response, message: string = "Resource not found", details?: unknown) =>
    sendErrorResponse(res, 404, message, details),
  
  conflict: (res: Response, message: string = "Resource conflict", details?: unknown) =>
    sendErrorResponse(res, 409, message, details),
  
  tooManyRequests: (res: Response, message: string = "Too many requests", details?: unknown) =>
    sendErrorResponse(res, 429, message, details),
  
  internalServerError: (res: Response, message: string = "Internal server error", details?: unknown) =>
    sendErrorResponse(res, 500, message, details),
  
  serviceUnavailable: (res: Response, message: string = "Service unavailable", details?: unknown) =>
    sendErrorResponse(res, 503, message, details),
};
