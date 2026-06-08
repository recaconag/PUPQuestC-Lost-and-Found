import { utils } from "../../utils/utils";
import AppError from "../../global/error";
import prisma from "../../config/prisma";
import { StatusCodes } from "http-status-codes";
import { sendOtpEmail, validateSmtpConfig } from "../../utils/emailService";
import { JwtPayload } from "jsonwebtoken";

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = async (user: Record<string, any>) => {
  const existedUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: user.email }],
    },
  });

  if (existedUser) {
    throw new AppError(StatusCodes.CONFLICT, "Email already registered. Please use a different email or sign in.");
  }

  await validateSmtpConfig();

  const hashedPassword = await utils.passwordHash(user.password);
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const createdUser = await prisma.user.create({
    data: {
      name: user.name ?? "",
      email: user.email,
      password: hashedPassword,
      idPicture: user.idPicture ?? "",
      activated: false,
      accountStatus: "PENDING",
      otpCode: otp,
      otpExpiry,
    },
  });

  try {
    await sendOtpEmail(createdUser.email, otp);
  } catch (err) {
    await prisma.user.delete({ where: { id: createdUser.id } });
    throw err;
  }

  return {
    id: createdUser.id,
    email: createdUser.email,
    accountStatus: createdUser.accountStatus,
    createdAt: createdUser.createdAt,
    updatedAt: createdUser.updatedAt,
  };
};

const verifyOtp = async (email: string, otp: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Account not found for this email address.");
  }

  if (user.activated) {
    throw new AppError(StatusCodes.CONFLICT, "This account is already verified.");
  }

  if (!user.otpCode || user.otpCode !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid verification code. Please check and try again.");
  }

  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    throw new AppError(StatusCodes.GONE, "Verification code has expired. Please request a new one.");
  }

  const verified = await prisma.user.update({
    where: { id: user.id },
    data: {
      activated: true,
      accountStatus: "APPROVED",
      otpCode: null,
      otpExpiry: null,
    },
  });

  const token = utils.createToken({
    id: verified.id,
    name: verified.name,
    email: verified.email,
    role: verified.role,
    userImg: verified.userImg,
  });

  return {
    token,
    id: verified.id,
    name: verified.name,
    email: verified.email,
    role: verified.role,
  };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Account not found for this email address.");
  }

  if (user.activated) {
    throw new AppError(StatusCodes.CONFLICT, "This account is already verified.");
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: otp, otpExpiry },
  });

  await sendOtpEmail(email, otp);
};

const allUsers = async (user: JwtPayload, page: number = 1, limit: number = 10, search: string = "") => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }

  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        activated: true,
        userImg: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

const blockUser = async (id: string, user: JwtPayload) => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }
  const userExists = await prisma.user.findUnique({ where: { id } });
  if (!userExists) {
    throw new AppError(StatusCodes.NOT_FOUND, "User account not found");
  }

  const activeUser = await prisma.user.findFirst({
    where: {
      AND: [{ id }, { activated: true }],
    },
  });

  if (activeUser) {
    await prisma.user.update({
      where: {
        id,
      },
      data: {
        activated: false,
      },
    });
    return "block";
  } else {
    await prisma.user.update({
      where: {
        id,
      },
      data: {
        activated: true,
      },
    });
    return "active";
  }
};

const changeUserRole = async (id: string, role: string, user: JwtPayload) => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }
  const updatedUser = await prisma.user.update({
    where: {
      id,
    },
    data: {
      role: role as any,
    },
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    activated: updatedUser.activated,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

const softDeleteUser = async (id: string, user: JwtPayload) => {
  if (user.role !== "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Access denied. Admin role required.");
  }
  const userRecord = await prisma.user.findUnique({
    where: { id },
  });

  if (!userRecord) {
    throw new AppError(404, "User not found");
  }

  if (userRecord.isDeleted) {
    throw new AppError(400, "User is already deleted");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      activated: false,
    },
  });

  return {
    id: updatedUser.id,
    email: userRecord.email,
    deleted: true,
    deletedAt: updatedUser.deletedAt,
  };
};

export const userService = {
  registerUser,
  verifyOtp,
  resendOtp,
  allUsers,
  blockUser,
  changeUserRole,
  softDeleteUser,
};
