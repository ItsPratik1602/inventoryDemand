import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import bcrypt from "bcryptjs";

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

export const createUser = async (userData, currentUserId) => {
  const { name, email, password, role } = userData;

  // Validate required fields
  if (!name || !email || !password || !role) {
    throw new AppError("Name, email, password, and role are required", 400);
  }

  // Validate role
  if (!["ADMIN", "STAFF", "CUSTOMER"].includes(role)) {
    throw new AppError("Invalid role. Must be ADMIN, STAFF, or CUSTOMER", 400);
  }

  // Check if user already exists
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role
    }
  });

  return sanitizeUser(user);
};

const userSortFieldMap = {
  createdAt: "createdAt",
  name: "name",
  email: "email",
  mobileNumber: "mobileNumber"
};

export const listUsers = async (currentUserId, query = {}) => {
  const safePage = Math.max(Number(query.page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const safeSortBy = userSortFieldMap[query.sortBy] || "createdAt";
  const safeOrder = query.order === "asc" ? "asc" : "desc";
  const trimmedSearch = String(query.search || "").trim();
  const roleFilter = query.roleFilter || "ALL";
  const genderFilter = query.genderFilter || "ALL";

  const where = {
    AND: [
      {
        id: {
          not: currentUserId
        }
      },
      trimmedSearch
        ? {
            OR: [
              { name: { contains: trimmedSearch, mode: "insensitive" } },
              { email: { contains: trimmedSearch, mode: "insensitive" } },
              { mobileNumber: { contains: trimmedSearch, mode: "insensitive" } }
            ]
          }
        : {},
      roleFilter !== "ALL" ? { role: roleFilter } : {},
      genderFilter === "NONE"
        ? { gender: null }
        : genderFilter !== "ALL"
          ? { gender: genderFilter }
          : {}
    ]
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit
    })
  ]);

  return {
    items: users.map(sanitizeUser),
    total,
    page: safePage,
    limit: safeLimit
  };
};

export const getUsersForExport = async (currentUserId, query = {}, ids = []) => {
  const result = await listUsers(currentUserId, {
    ...query,
    page: 1,
    limit: 100000
  });

  return ids.length
    ? result.items.filter((user) => ids.includes(user.id))
    : result.items;
};

export const getUsersByIds = async (currentUserId, ids = []) => {
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: ids.length ? ids : undefined,
        not: currentUserId
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return users.map(sanitizeUser);
};

export const updateUserRole = async (id, role, currentUserId) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent changing CUSTOMER roles
  if (user.role === "CUSTOMER") {
    throw new AppError("Cannot change role of CUSTOMER users", 400);
  }

  // Only allow changes between ADMIN and STAFF
  if (!["ADMIN", "STAFF"].includes(role)) {
    throw new AppError("Role can only be changed to ADMIN or STAFF", 400);
  }

  if (user.id === currentUserId && role !== "ADMIN") {
    throw new AppError("You cannot remove your own admin access", 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role }
  });

  return sanitizeUser(updatedUser);
};

export const updateProfile = async (id, data) => {
  console.log("updateProfile called with:", { id, data });
  
  const user = await prisma.user.findUnique({ where: { id } });
  console.log("Found user:", user);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updateData = {
    name: data.name,
    gender: data.gender ?? null,
    mobileNumber: data.mobileNumber ?? null,
    profileImage: data.profileImage ?? null
  };
  
  console.log("Updating user with:", updateData);
  
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData
  });

  console.log("Updated user:", updatedUser);
  return sanitizeUser(updatedUser);
};

export const deleteUser = async (id, currentUserId) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.id === currentUserId) {
    throw new AppError("You cannot delete your own account", 400);
  }

  await prisma.user.delete({ where: { id } });
};
