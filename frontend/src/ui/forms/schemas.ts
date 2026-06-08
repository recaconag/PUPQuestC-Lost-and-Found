import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "PUP Webmail is required")
    .max(120, "Too long"),
  password: z.string().min(1, "Password is required").max(200, "Too long"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const reportLostSchema = z.object({
  lostItemName: z
    .string()
    .trim()
    .min(1, "Lost item name is required")
    .max(200, "Too long"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Too long"),
  imgUrl: z.string().min(1, "Please upload an image"),
  location: z
    .string()
    .trim()
    .min(1, "Location is required")
    .max(500, "Too long"),
  categoryId: z.string().min(1, "Category is required"),
});

export type ReportLostValues = z.infer<typeof reportLostSchema>;

export const reportFoundSchema = z.object({
  foundItemName: z
    .string()
    .trim()
    .min(1, "Found item name is required")
    .max(200, "Too long"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Too long"),
  imgUrl: z.string().min(1, "Please upload an image"),
  location: z
    .string()
    .trim()
    .min(1, "Location is required")
    .max(500, "Too long"),
  claimProcess: z
    .string()
    .trim()
    .min(1, "Claim process is required")
    .max(1000, "Too long"),
  categoryId: z.string().min(1, "Category is required"),
});

export type ReportFoundValues = z.infer<typeof reportFoundSchema>;

export const editFoundItemSchema = z.object({
  foundItemName: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(200, "Too long"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Too long"),
  location: z
    .string()
    .trim()
    .min(1, "Location is required")
    .max(500, "Too long"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((d) => !Number.isNaN(Date.parse(d)), "Invalid date"),
  claimProcess: z
    .string()
    .trim()
    .max(1000, "Too long"),
});

export type EditFoundItemValues = z.infer<typeof editFoundItemSchema>;

export const editLostItemSchema = z.object({
  lostItemName: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(200, "Too long"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Too long"),
  location: z
    .string()
    .trim()
    .min(1, "Location is required")
    .max(500, "Too long"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((d) => !Number.isNaN(Date.parse(d)), "Invalid date"),
});

export type EditLostItemValues = z.infer<typeof editLostItemSchema>;

export const categoryNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(80, "Name is too long (max 80 characters)"),
});

export type CategoryNameValues = z.infer<typeof categoryNameSchema>;

const PUP_DOMAINS = ["@iskolarngbayan.pup.edu.ph", "@pup.edu.ph"];

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Too long"),
    email: z
      .string()
      .trim()
      .min(1, "PUP Webmail is required")
      .email("Enter a valid email address")
      .refine((e) => PUP_DOMAINS.some((d) => e.endsWith(d)), {
        message: "Please use your official PUPQC email (@iskolarngbayan.pup.edu.ph or @pup.edu.ph) to register.",
      }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200, "Too long"),
    conpassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.conpassword, {
    message: "Passwords do not match",
    path: ["conpassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your institutional email address")
    .email("Enter a valid email address"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const recoveryOtpSchema = z.object({
  otp: z
    .string()
    .min(6, "Please enter all 6 digits of your recovery code")
    .max(6, "Please enter all 6 digits of your recovery code"),
});

export type RecoveryOtpValues = z.infer<typeof recoveryOtpSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200, "Too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required")
      .max(200, "Too long"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200, "Too long"),
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const updateProfileNameSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "Too long"),
  middleName: z
    .string()
    .trim()
    .max(100, "Too long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Too long"),
});

export type UpdateProfileNameValues = z.infer<typeof updateProfileNameSchema>;

export const verifyEmailOtpSchema = z.object({
  otp: z
    .string()
    .min(6, "Please enter all 6 digits of your verification code")
    .max(6, "Please enter all 6 digits of your verification code"),
});

export type VerifyEmailOtpValues = z.infer<typeof verifyEmailOtpSchema>;

export const createClaimSchema = z.object({
  lostDate: z
    .string()
    .min(1, "Lost date is required")
    .refine((d) => !Number.isNaN(Date.parse(d)), "Invalid date"),
  distinguishingFeatures: z
    .string()
    .trim()
    .min(10, "Please provide at least 10 characters")
    .max(1000, "Too long"),
});

export type CreateClaimValues = z.infer<typeof createClaimSchema>;

