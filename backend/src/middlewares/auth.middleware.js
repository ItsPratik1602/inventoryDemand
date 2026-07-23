import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { catchAsync } from "../utils/catch-async.js";

export const protect = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  const decoded = jwt.verify(token, env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      gender: true,
      mobileNumber: true,
      profileImage: true,
      createdAt: true
    }
  });

  if (!user) {
    return next(new AppError("User no longer exists", 401));
  }

  req.user = user;
  next();
});

export const requireAuth = protect;

export const optionalProtect = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gender: true,
        mobileNumber: true,
        profileImage: true,
        createdAt: true
      }
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
});

export const requireAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }

  next();
};

export const requireStaff = (req, _res, next) => {
  if (!req.user || !["ADMIN", "STAFF"].includes(req.user.role)) {
    return next(new AppError("Staff access required", 403));
  }

  next();
};

export const requireCustomer = (req, _res, next) => {
  if (!req.user || !["ADMIN", "STAFF", "CUSTOMER"].includes(req.user.role)) {
    return next(new AppError("Customer access required", 403));
  }

  next();
};
