import { z } from "zod";

const mobileNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10,15}$/, "Mobile number must contain 10 to 15 digits");

const profileImageSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      /^data:image\/(png|jpeg|jpg);base64,/.test(value) &&
      Buffer.byteLength(value.split(",")[1] || "", "base64") <= 2 * 1024 * 1024,
    "Profile image must be PNG/JPG/JPEG and 2MB or smaller"
  );

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
  mobileNumber: mobileNumberSchema.nullable().optional(),
  profileImage: profileImageSchema.nullable().optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(100)
});

export const couponCreateSchema = z.object({
  code: z.string().trim().min(3).max(20),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive("Discount value must be positive"),
  minCartValue: z.number().nonnegative("Minimum cart value must be non-negative").optional(),
  maxDiscount: z.number().positive("Maximum discount must be positive").optional(),
  usageLimit: z.number().positive("Usage limit must be positive").optional(),
  perUserLimit: z.number().positive("Per-user limit must be positive").optional(),
  isFirstOrderOnly: z.boolean().optional(),
  startsAt: z.string().datetime("Start date must be a valid datetime").optional(),
  expiresAt: z.string().datetime("Expiry date must be a valid datetime"),
  isActive: z.boolean().optional()
});

export const couponUpdateSchema = z.object({
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive("Discount value must be positive"),
  minCartValue: z.number().nonnegative("Minimum cart value must be non-negative").optional(),
  maxDiscount: z.number().positive("Maximum discount must be positive").optional(),
  usageLimit: z.number().positive("Usage limit must be positive").optional(),
  perUserLimit: z.number().positive("Per-user limit must be positive").optional(),
  isFirstOrderOnly: z.boolean().optional(),
  startsAt: z.string().datetime("Start date must be a valid datetime").optional(),
  expiresAt: z.string().datetime("Expiry date must be a valid datetime"),
  isActive: z.boolean().optional()
});

export const couponApplySchema = z.object({
  code: z.string().trim().min(3),
  cartTotal: z.number().positive("Cart total must be positive")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6).max(100)
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["ADMIN", "STAFF", "CUSTOMER"])
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "STAFF", "CUSTOMER"])
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
  mobileNumber: mobileNumberSchema.nullable().optional(),
  profileImage: profileImageSchema.nullable().optional()
});

export const exportPdfSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).optional().default([]),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  roleFilter: z.string().optional(),
  genderFilter: z.string().optional(),
  categoryFilter: z.string().optional(),
  stockFilter: z.string().optional(),
  quantityFilter: z.string().optional()
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  price: z.coerce.number().positive(),
  stockQuantity: z.coerce.number().int().min(0),
  categoryId: z.coerce.number().int().positive(),
  reorderLevel: z.coerce.number().int().min(0)
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().or(z.literal(""))
});

export const importProductsCsvSchema = z.object({
  filename: z.string().trim().min(1).optional(),
  content: z.string().min(1, "CSV content is required")
});

export const importInventoryCsvSchema = z.object({
  filename: z.string().trim().min(1).optional(),
  content: z.string().min(1, "CSV content is required")
});

export const inventorySchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(0)
});

export const salesSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive()
});
