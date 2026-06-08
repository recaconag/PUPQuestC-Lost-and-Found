import prisma from "../../config/prisma";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";

const SETTINGS_ID = "singleton";

const getSettings = async () => {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: SETTINGS_ID,
        passwordExpiryDays: 90,
        sessionTimeoutMinutes: 30,
        maxLoginAttempts: 5,
        enable2FA: false,
        itemExpiryDays: 30,
        maxImageSizeMb: 5,
        autoDeleteExpiredItems: true,
        requireItemApproval: false,
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        smtpSecure: false,
        smtpFromName: "PUPQuestC Support",
        smtpFromEmail: "",
      },
    });
  }

  return settings;
};

const updateSettings = async (data: {
  passwordExpiryDays?: number;
  sessionTimeoutMinutes?: number;
  maxLoginAttempts?: number;
  enable2FA?: boolean;
  itemExpiryDays?: number;
  maxImageSizeMb?: number;
  autoDeleteExpiredItems?: boolean;
  requireItemApproval?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  smtpFromName?: string;
  smtpFromEmail?: string;
}, user: JwtPayload) => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }
  await getSettings();
  return prisma.systemSettings.update({
    where: { id: SETTINGS_ID },
    data,
  });
};

export const systemSettingsService = { getSettings, updateSettings };
