import { z } from "zod";

const updateSettingsSchema = z.object({
  body: z.object({
    passwordExpiryDays: z.number().min(1, "Password expiry days must be a positive number").optional(),
    sessionTimeoutMinutes: z.number().min(1, "Session timeout minutes must be a positive number").optional(),
    maxLoginAttempts: z.number().min(1, "Max login attempts must be a positive number").optional(),
    enable2FA: z.boolean().optional(),
    itemExpiryDays: z.number().min(1, "Item expiry days must be a positive number").optional(),
    maxImageSizeMb: z.number().min(1, "Max image size must be a positive number").optional(),
    autoDeleteExpiredItems: z.boolean().optional(),
    requireItemApproval: z.boolean().optional(),
    smtpHost: z.string().min(1, "SMTP host is required").optional(),
    smtpPort: z.number().min(1, "SMTP port must be a positive number").max(65535, "SMTP port must be between 1 and 65535").optional(),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(),
    smtpSecure: z.boolean().optional(),
    smtpFromName: z.string().min(1, "SMTP from name is required").optional(),
    smtpFromEmail: z.string().email("Invalid email format for SMTP from email").optional(),
  }),
});

export const SystemSettingsSchema = {
  updateSettingsSchema,
};
