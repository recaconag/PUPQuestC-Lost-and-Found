/**
 * routes/routes.ts — All API Endpoint Definitions
 *
 * This file is the "table of contents" for the entire backend API.
 * Every URL that the frontend can call is registered here.
 *
 * Pattern: router.METHOD("/path", ...middlewares, controllerFunction)
 *
 * Middleware layers (applied in order before the controller runs):
 *   - upload.single()      → handles file/image uploads (Multer)
 *   - validateRequest()    → validates the request body against a Zod schema
 *   - auth("USER","ADMIN") → checks JWT token; rejects with 401 if not logged in
 *   - controllerFunction   → the actual business logic for that endpoint
 *
 * Sections in this file:
 *   1. User & Auth     — register, login, change password/email
 *   2. Found Items     — CRUD for found item reports
 *   3. Lost Items      — CRUD for lost item reports
 *   4. Claims          — submit and manage item claims
 *   5. Categories      — item category management
 *   6. AI Search       — Google Gemini natural language search
 *   7. Admin           — dashboard stats, user management
 *   8. System Settings — email config, 2FA settings
 */
import express from "express";
import { userController } from "../modules/user/user.controllers";
import { authController } from "../auth/auth.controller";
import { upload } from "../midddlewares/upload";
import { uploadController } from "../modules/upload/upload.controller";
import { itemcategoryController } from "../modules/itemCategory/itemcategory.controller";
import auth from "../midddlewares/auth";
import { foundItemController } from "../modules/foundItems/foundItem.controller";
import { claimsController } from "../modules/claim/claim.controller";
import validateRequest from "../midddlewares/validate";
import { UserSchema } from "../modules/user/user.validate";
import { FoundItemCategorySchema } from "../modules/itemCategory/itemCategory.validate";
import { FoundItemSchema } from "../modules/foundItems/foundItems.validate";
import { ItemClaimSchema } from "../modules/claim/claim.validate";
import { lostItemController } from "../modules/lostItem/lost.controller";
import { utils } from "../utils/utils";
import { adminStats } from "../utils/adminStats";
import { aiSearchController } from "../modules/aiSearch/aiSearch.controller";
import { aiSearchValidation } from "../modules/aiSearch/aiSearch.validate";
import { systemSettingsController } from "../modules/systemSettings/systemSettings.controller";
import { testEmailController } from "../modules/systemSettings/testEmail.controller";
import { SystemSettingsSchema } from "../modules/systemSettings/systemSettings.validate";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiters for authentication endpoints
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per window
  message: "Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 attempts per window
  message: "Too many registration attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // max 3 attempts per window
  message: "Too many OTP requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Temporary dynamic service matrix endpoints para hindi mag-error ang dashboard elements
router.get("/services", (_req, res) => {
  res.json({ success: true, data: [] });
});

router.get("/faqs", (_req, res) => {
  res.json({ success: true, data: [] });
});
////////////////////////////////////////////////// user //////////////////////////////////////////////
// user registration (accepts multipart/form-data for optional profile photo)
router.post(
  "/register",
  registrationRateLimiter,
  upload.single("idPicture"),
  (req, _res, next) => {
    if (req.file) {
      const serverUrl =
        process.env.SERVER_URL ||
        `http://localhost:${process.env.PORT || 5000}`;
      req.body.idPicture = `${serverUrl}/uploads/${req.file.filename}`;
    }
    next();
  },
  validateRequest(UserSchema.userRegisterSchema),
  userController.registerUser,
);

//get users
router.get(
  "/users",
  auth("ADMIN"),
  userController.allUsers,
);

// user login
router.post(
  "/login",
  loginRateLimiter,
  validateRequest(UserSchema.userLoginSchema),
  authController.login,
);

// email OTP verification
router.post("/verify-otp", otpRateLimiter, userController.verifyOtp);

// resend OTP
router.post("/resend-otp", otpRateLimiter, userController.resendOtp);

// forgot password — send recovery OTP
router.post(
  "/forgot-password",
  otpRateLimiter,
  validateRequest(UserSchema.forgotPasswordSchema),
  authController.forgotPassword,
);

// verify recovery OTP
router.post(
  "/verify-recovery-otp",
  otpRateLimiter,
  validateRequest(UserSchema.verifyRecoveryOtpSchema),
  authController.verifyRecoveryOtp,
);

// reset password
router.post(
  "/reset-password",
  validateRequest(UserSchema.resetPasswordSchema),
  authController.resetPassword,
);

// verify 2FA OTP (second step of login when 2FA is enabled)
router.post("/login/verify-2fa", authController.verify2FA);
///////////////////////////////////////////////////profile //////////////////////////////////////////////
// change password
router.post(
  "/change-password",
  auth("USER", "ADMIN"),
  validateRequest(UserSchema.changePasswordSchema),
  authController.newPasswords,
);
// change email
router.post(
  "/change-email",
  auth("USER", "ADMIN"),
  validateRequest(UserSchema.changeEmailSchema),
  authController.changeEmail,
);
// update profile image
router.patch(
  "/update-profile-image",
  auth("USER", "ADMIN"),
  authController.updateProfileImage,
);

// update profile name
router.patch(
  "/update-profile-name",
  auth("USER", "ADMIN"),
  validateRequest(UserSchema.updateProfileNameSchema),
  authController.updateProfileName,
);
///////////////////////////////////////////////////found item//////////////////////////////////////////////
// category create
router.post(
  "/item-categories",
  auth("ADMIN"),
  validateRequest(FoundItemCategorySchema.createItemCategory),
  itemcategoryController.createItemCategory,
);

// category get (Public)
router.get("/item-categories", itemcategoryController.getItemCategory);

// category update
router.put(
  "/item-categories/:id",
  auth("ADMIN"),
  validateRequest(FoundItemCategorySchema.updateItemCategory),
  itemcategoryController.updateItemCategory,
);

// category delete
router.delete(
  "/item-categories/:id",
  auth("ADMIN"),
  itemcategoryController.deleteItemCategory,
);
// found item create
router.post(
  "/found-items",
  upload.single("image"),
  validateRequest(FoundItemSchema.createFoundItem),
  auth("USER", "ADMIN"),
  foundItemController.createFoundItem,
);
// found item get
router.get("/found-items", foundItemController.getFoundItem);
// single found item get
router.get("/found-items/:id", foundItemController.getSingleFoundItem);
///////////////////////////////////////////////////claim//////////////////////////////////////////////
// claim create
router.post(
  "/claims",
  validateRequest(ItemClaimSchema.createClaim),
  auth("USER", "ADMIN"),
  claimsController.createClaim,
);

// claims get all
router.get("/claims", auth("USER", "ADMIN"), claimsController.getClaim);

// my claims get
router.get("/my/claims", auth("USER", "ADMIN"), claimsController.getMyClaim);

// claims update
router.put(
  "/claims/:claimId",
  auth("ADMIN"),
  validateRequest(ItemClaimSchema.updateClaim),
  claimsController.updateClaimStatus,
);

// =========================================================================
// 🎫 NEW: QR CODE VERIFICATION & CLAIM TURNOVER HANDLER
// =========================================================================
router.post(
  "/claims/generate-qr/:claimId",
  auth("ADMIN"),
  claimsController.generateClaimQRCodeImage,
);

router.post(
  "/claims/verify-qr/:claimId",
  auth("ADMIN"),
  claimsController.verifyClaimQRCodeScanner,
);
///////////////////////////////////////////////////lost item//////////////////////////////////////////////

// lost item mark as found (Toggle status)
router.put(
  "/lost-items/toggle-status",
  auth("USER", "ADMIN"),
  lostItemController.toggleFoundStatus,
);

// create lost item
router.post(
  "/lost-items",
  upload.single("image"),
  auth("USER", "ADMIN"),
  lostItemController.createLostItem,
);

// get lost item (Public)
router.get("/lost-items", lostItemController.getLostItem);

// get single lost item (Public)
router.get("/lost-items/:id", lostItemController.getSingleLostItem);
// My Personal Reports
router.get(
  "/my/lost-items",
  auth("USER", "ADMIN"),
  lostItemController.getMyLostItem,
);
router.get(
  "/my/found-items",
  auth("USER", "ADMIN"),
  foundItemController.getMyFoundItem,
);

router.put(
  "/my/lost-items",
  auth("USER", "ADMIN"),
  lostItemController.editMyLostItem,
);
router.put(
  "/my/found-items",
  auth("USER", "ADMIN"),
  foundItemController.editMyFoundItem,
);

router.delete(
  "/my/lost-items/:id",
  auth("USER", "ADMIN"),
  lostItemController.deleteMyLostItem,
);
router.delete(
  "/my/found-items/:id",
  auth("USER", "ADMIN"),
  foundItemController.deleteMyFoundItem,
);

// get stats for admin
router.get("/admin/stats", auth("ADMIN"), adminStats);

// block a user
router.put("/block/user/:id", auth("ADMIN"), userController.blockUser);

// change user role
router.put("/change-role/:id", auth("ADMIN"), userController.changeUserRole);

// soft delete user
router.delete("/delete-user/:id", auth("ADMIN"), userController.softDeleteUser);

// =========================================================================
// 🎨 FOR REPORT FORMS: Saluhin ang regular image attachment updates ng forms
// =========================================================================
router.post(
  "/upload",
  auth("USER", "ADMIN"),
  upload.single("image"),
  uploadController.uploadAndAnalyzeImageAI,
);

// =========================================================================
// 🧠 FOR AI SEARCH MODULE: Saluhin ang dynamic upload-ai target ng Redux actions
// =========================================================================
router.post(
  "/upload-ai",
  auth("USER", "ADMIN"),
  upload.single("image"),
  uploadController.uploadAndAnalyzeImageAI,
);

// AI search — text query (public)
router.post(
  "/ai-search",
  validateRequest(aiSearchValidation.aiSearchSchema),
  aiSearchController.aiSearch,
);

// AI search — image query (authenticated; base64 image in request body)
router.post(
  "/ai-search/image",
  auth("USER", "ADMIN"),
  aiSearchController.aiImageSearch,
);

// System settings (admin only)
router.get(
  "/admin/system-settings",
  auth("ADMIN"),
  systemSettingsController.getSettings,
);
router.put(
  "/admin/system-settings",
  auth("ADMIN"),
  validateRequest(SystemSettingsSchema.updateSettingsSchema),
  systemSettingsController.updateSettings,
);
router.post("/admin/test-email", auth("ADMIN"), testEmailController.testEmail);

// Admin: get ALL items (including PENDING/expired) for management dashboard
router.get(
  "/admin/all-items/found",
  auth("ADMIN"),
  foundItemController.getAllFoundItemsAdmin,
);
router.get(
  "/admin/all-items/lost",
  auth("ADMIN"),
  lostItemController.getAllLostItemsAdmin,
);

// Approve items (admin only)
router.put(
  "/admin/approve/found/:id",
  auth("ADMIN"),
  foundItemController.approveFoundItem,
);
router.put(
  "/admin/approve/lost/:id",
  auth("ADMIN"),
  lostItemController.approveLostItem,
);

export default router;
