import { utils } from "../utils/utils";
import AppError from "../global/error";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../config/prisma";
import { send2FAEmail, sendPasswordRecoveryEmail, validateSmtpConfig } from "../utils/emailService";
import { systemSettingsService } from "../modules/systemSettings/systemSettings.service";
import config from "../config/config";

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const loginUser = async (data: any) => {
  const settings = await systemSettingsService.getSettings();
  const { password, username: identifier } = data;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }],
      activated: true,
      isDeleted: false,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials or account is deactivated");
  }

  // 1. Account lock check
  if ((user as any).lockedUntil && (user as any).lockedUntil > new Date()) {
    const mins = Math.ceil(((user as any).lockedUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      `Account temporarily locked due to too many failed attempts. Try again in ${mins} minute(s).`
    );
  }

  // 2. Password verification
  if (!(await utils.comparePasswords(password, user.password))) {
    const newAttempts = ((user as any).failedLoginAttempts ?? 0) + 1;
    const updateData: any = { failedLoginAttempts: newAttempts };
    if (newAttempts >= settings.maxLoginAttempts) {
      updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    throw new AppError(StatusCodes.FORBIDDEN, "Password is incorrect");
  }

  // 3. Reset failed attempts on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  // 4. Password expiry check
  const lastChange: Date | null = (user as any).lastPasswordChange ?? null;
  if (settings.passwordExpiryDays > 0 && lastChange) {
    const expiryDate = new Date(lastChange.getTime() + settings.passwordExpiryDays * 86400000);
    if (new Date() > expiryDate) {
      return { passwordExpired: true, email: user.email };
    }
  }

  // 5a. Super-admin break-glass — skip 2FA for the primary admin account.
  //     bcrypt verification (step 2) still runs; only OTP generation is bypassed.
  const SUPER_ADMIN_EMAIL = "admin.pupquestc@pup.edu.ph";
  if (user.email === SUPER_ADMIN_EMAIL) {
    const sessionMinutes = settings.sessionTimeoutMinutes;
    const expiresIn = sessionMinutes > 0 ? `${sessionMinutes}m` : (config.jwt.expires_in as string);
    const { id, name, email, role, userImg } = user;
    const accessToken = utils.createToken({ id, name, email, role, userImg }, expiresIn);
    console.log(`[Auth] Super-admin break-glass login — 2FA bypassed for ${email}`);
    return { id, name: name || "User", email, role, token: accessToken };
  }

  // 5b. 2FA: send OTP, withhold JWT until code is verified
  if (settings.enable2FA) {
    await validateSmtpConfig();
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
    await send2FAEmail(user.email, otp);
    return { twoFactorRequired: true, userId: user.id };
  }

  // 6. Issue JWT with admin-configured session timeout
  const sessionMinutes = settings.sessionTimeoutMinutes;
  const expiresIn = sessionMinutes > 0 ? `${sessionMinutes}m` : (config.jwt.expires_in as string);
  const { id, name, email, role, userImg } = user;
  const accessToken = utils.createToken({ id, name, email, role, userImg }, expiresIn);

  return { id, name: name || "User", email, role, token: accessToken };
};

const verify2FA = async (userId: string, otp: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, activated: true, isDeleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  if (!user.otpCode || user.otpCode !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid 2FA code. Please check and try again.");
  }

  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    throw new AppError(StatusCodes.GONE, "2FA code has expired. Please log in again.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: null, otpExpiry: null },
  });

  const settings = await systemSettingsService.getSettings();
  const sessionMinutes = settings.sessionTimeoutMinutes;
  const expiresIn = sessionMinutes > 0 ? `${sessionMinutes}m` : (config.jwt.expires_in as string);
  const { id, name, email, role, userImg } = user;
  const accessToken = utils.createToken({ id, name, email, role, userImg }, expiresIn);

  return { id, name: name || "User", email, role, token: accessToken };
};

const newPasswords = async (data: any, user: JwtPayload) => {
  console.log(data.newPassword);
  if (data.currentPassword === data.newPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is same");
  }
  const existedUser = await prisma.user.findFirst({
      where: {
        id: user.id,
        isDeleted: false,
      },
    });
  // console.log(user)
  if (
    data.currentPassword &&
    existedUser &&
    !(await utils.comparePasswords(data.currentPassword, existedUser.password))
  ) {
    throw new AppError(StatusCodes.FORBIDDEN, "Current password provided is incorrect");
  }

  const newHashPassword = await utils.passwordHash(data.newPassword);
  await prisma.user.update({
    where: {
      email: existedUser?.email,
    },
    data: {
      password: newHashPassword,
      lastPasswordChange: new Date(),
    },
  });
};

const changeEmail = async (email: any, user: JwtPayload) => {
  // console.log(email);
  const existedUser: any = await prisma.user.findFirst({
    where: { ...email, isDeleted: false },
  });
  // console.log(user);

  // console.log(existedUser);
  if (existedUser) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Email already exists. Try new one!"
    );
  }
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: email,
  });
};

const updateProfileImage = async (userId: string, userImg: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { userImg },
  });

  const newToken = utils.createToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    userImg,
  });

  return { token: newToken, userImg };
};

const updateProfileName = async (
  userId: string,
  firstName: string,
  middleName: string,
  lastName: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found.");
  }

  const fullName = [firstName, middleName, lastName]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ");

  await prisma.user.update({
    where: { id: userId },
    data: { name: fullName },
  });

  const newToken = utils.createToken({
    id: user.id,
    name: fullName,
    email: user.email,
    role: user.role,
    userImg: user.userImg,
  });

  return { token: newToken, name: fullName };
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false, activated: true },
  });

  if (!user) {
    return;
  }

  await validateSmtpConfig();

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: otp, otpExpiry },
  });

  await sendPasswordRecoveryEmail(email, otp);
};

const verifyRecoveryOtp = async (email: string, otp: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "No account found with this email address.");
  }

  if (!user.otpCode || user.otpCode !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid recovery code. Please check and try again.");
  }

  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    throw new AppError(StatusCodes.GONE, "Recovery code has expired. Please request a new one.");
  }
};

const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "No account found with this email address.");
  }

  if (!user.otpCode || user.otpCode !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid or expired recovery code.");
  }

  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    throw new AppError(StatusCodes.GONE, "Recovery code has expired. Please request a new one.");
  }

  const hashedPassword = await utils.passwordHash(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otpCode: null,
      otpExpiry: null,
    },
  });
};

export const authServices = {
  loginUser,
  verify2FA,
  newPasswords,
  changeEmail,
  updateProfileImage,
  updateProfileName,
  forgotPassword,
  verifyRecoveryOtp,
  resetPassword,
};
