import { NextFunction, Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { systemSettingsService } from "./systemSettings.service";

const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await systemSettingsService.getSettings();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "System settings retrieved.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      passwordExpiryDays, sessionTimeoutMinutes, maxLoginAttempts, enable2FA,
      itemExpiryDays, maxImageSizeMb, autoDeleteExpiredItems, requireItemApproval,
      smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, smtpFromName, smtpFromEmail,
    } = req.body;
    const result = await systemSettingsService.updateSettings({
      passwordExpiryDays: passwordExpiryDays !== undefined ? Number(passwordExpiryDays) : undefined,
      sessionTimeoutMinutes: sessionTimeoutMinutes !== undefined ? Number(sessionTimeoutMinutes) : undefined,
      maxLoginAttempts: maxLoginAttempts !== undefined ? Number(maxLoginAttempts) : undefined,
      enable2FA: enable2FA !== undefined ? Boolean(enable2FA) : undefined,
      itemExpiryDays: itemExpiryDays !== undefined ? Number(itemExpiryDays) : undefined,
      maxImageSizeMb: maxImageSizeMb !== undefined ? Number(maxImageSizeMb) : undefined,
      autoDeleteExpiredItems: autoDeleteExpiredItems !== undefined ? Boolean(autoDeleteExpiredItems) : undefined,
      requireItemApproval: requireItemApproval !== undefined ? Boolean(requireItemApproval) : undefined,
      smtpHost: smtpHost !== undefined ? String(smtpHost) : undefined,
      smtpPort: smtpPort !== undefined ? Number(smtpPort) : undefined,
      smtpUser: smtpUser !== undefined ? String(smtpUser) : undefined,
      smtpPass: smtpPass !== undefined ? String(smtpPass) : undefined,
      smtpSecure: smtpSecure !== undefined ? Boolean(smtpSecure) : undefined,
      smtpFromName: smtpFromName !== undefined ? String(smtpFromName) : undefined,
      smtpFromEmail: smtpFromEmail !== undefined ? String(smtpFromEmail) : undefined,
    }, req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "System settings updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const systemSettingsController = { getSettings, updateSettings };
