import { z } from "zod";
const PUP_DOMAINS = ["@iskolarngbayan.pup.edu.ph", "@pup.edu.ph"];

const userRegisterSchema = z.object({
  body: z.object({
    name: z.string().trim().optional().default(""),
    email: z
      .string({ required_error: "PUP Webmail is required" })
      .trim()
      .email("Invalid email format")
      .refine((e) => PUP_DOMAINS.some((d) => e.endsWith(d)), {
        message: "Please use your official PUPQC email (@iskolarngbayan.pup.edu.ph or @pup.edu.ph) to register.",
      }),
    password: z.string({ required_error: "Password is required" }).min(8, "Password must be at least 8 characters"),
    idPicture: z.string().url("Invalid image URL").optional().or(z.literal("")),
  }),
});

const userLoginSchema = z.object({
  body: z.object({
    username: z.string({ required_error: "PUP Webmail is required" }).trim(),
    password: z.string({ required_error: "Password is required" }),
  }),
});
const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: "Current password is required" }),
    newPassword: z.string({ required_error: "New password is required" }).min(8, "New password must be at least 8 characters"),
  }),
});
const changeEmailSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).trim().email("Invalid email format"),
  }),
});

const updateProfileNameSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: "First name is required" })
      .trim()
      .min(1, "First name cannot be empty")
      .max(80, "First name is too long"),
    middleName: z.string().trim().max(80, "Middle name is too long").optional().default(""),
    lastName: z
      .string({ required_error: "Last name is required" })
      .trim()
      .min(1, "Last name cannot be empty")
      .max(80, "Last name is too long"),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Invalid email format"),
  }),
});

const verifyRecoveryOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email format"),
    otp: z.string().length(6, "Recovery code must be 6 digits"),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email format"),
    otp: z.string().length(6, "Recovery code must be 6 digits"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "Password must be at least 8 characters"),
  }),
});

export const UserSchema = {
  userRegisterSchema,
  userLoginSchema,
  changePasswordSchema,
  changeEmailSchema,
  updateProfileNameSchema,
  forgotPasswordSchema,
  verifyRecoveryOtpSchema,
  resetPasswordSchema,
};
