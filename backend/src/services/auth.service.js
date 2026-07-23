import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { signToken } from "../utils/jwt.js";
import { sendResetPasswordEmail } from "./email.service.js";
import pkg from "@prisma/client";
const { Role } = pkg;
import { awardSignupRewardPoints } from "./reward.service.js";

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  gender: user.gender,
  mobileNumber: user.mobileNumber,
  profileImage: user.profileImage,
  createdAt: user.createdAt
});

export const registerUser = async ({
  name,
  email,
  password,
  gender,
  mobileNumber,
  profileImage
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.$transaction(async (tx) => {
    return tx.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: Role.CUSTOMER,
        gender: gender ?? null,
        mobileNumber: mobileNumber ?? null,
        profileImage: profileImage ?? null
      }
    });
  });

  await awardSignupRewardPoints(user.id);

  console.info(`[auth] registered ${email} with role CUSTOMER`);

  const token = signToken({ id: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    console.warn(`[auth] login failed for ${email}`);
    throw new AppError("Invalid email or password", 401);
  }

  console.info(`[auth] login succeeded for ${email}`);
  const token = signToken({ id: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
};

export const requestPasswordReset = async ({ email }) => {
  console.info(`[auth] forgot password request received for ${email}`);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.info(`[auth] forgot password ignored for unknown email ${email}`);
    return;
  }

  console.info(`[auth] forgot password user found for ${email}`);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  console.info(
    `[auth] reset token created for ${email} expiring at ${expiresAt.toISOString()}`
  );

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id }
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt
    }
  });

  console.info(`[auth] reset token persisted for ${email}`);

  await sendResetPasswordEmail({
    to: user.email,
    name: user.name,
    token: rawToken
  });
};

export const resetPassword = async ({ token, password }) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  console.info("[auth] validating reset token");

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token: hashedToken,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!resetRecord) {
    console.warn("[auth] reset password failed: token invalid or expired");
    throw new AppError("Reset token is invalid or expired", 400);
  }

  console.info(
    `[auth] reset token valid for ${resetRecord.user.email} until ${resetRecord.expiresAt.toISOString()}`
  );

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword }
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetRecord.userId }
    })
  ]);

  console.info(`[auth] password reset succeeded for user ${resetRecord.user.email}`);
};
