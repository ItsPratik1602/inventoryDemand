import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

// Validation constants
const COUPON_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED'
};

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));
const toNumber = (value) => Number(value || 0);

const recoverDiscountFromFinalTotal = (coupon, orderTotalAmount) => {
  const finalTotal = toNumber(orderTotalAmount);

  if (!coupon || finalTotal < 0) {
    return null;
  }

  if (coupon.type === COUPON_TYPES.FIXED) {
    return roundCurrency(coupon.value);
  }

  if (coupon.type === COUPON_TYPES.PERCENTAGE) {
    const percentage = toNumber(coupon.value);

    if (percentage <= 0 || percentage >= 100) {
      return null;
    }

    const derivedDiscount = finalTotal * (percentage / (100 - percentage));
    const cappedDiscount = coupon.maxDiscount
      ? Math.min(derivedDiscount, toNumber(coupon.maxDiscount))
      : derivedDiscount;

    return roundCurrency(cappedDiscount);
  }

  return null;
};

// Calculate discount based on coupon type
const calculateDiscount = (coupon, cartTotal) => {
  if (coupon.type === COUPON_TYPES.FIXED) {
    return coupon.value;
  } else if (coupon.type === COUPON_TYPES.PERCENTAGE) {
    const discount = cartTotal * (coupon.value / 100);
    // Apply max discount cap if specified
    if (coupon.maxDiscount) {
      return Math.min(discount, coupon.maxDiscount);
    }
    return discount;
  }
  return 0;
};

const ensureCouponUserAccess = (coupon, currentUserId) => {
  const allowedUsers = coupon.assignedUsers || [];

  if (allowedUsers.length === 0) {
    return true;
  }

  if (!currentUserId) {
    throw new AppError("This coupon is not valid for this user", 400);
  }

  const isAllowed = allowedUsers.some((assignment) => assignment.userId === currentUserId);

  if (!isAllowed) {
    throw new AppError("This coupon is not valid for this user", 400);
  }

  return true;
};

// Check if coupon can be applied
const canApplyCoupon = (coupon, cartTotal, userOrderCount) => {
  // Check if coupon is active
  if (!coupon.isActive) {
    throw new AppError('Coupon is not active', 400);
  }

  // Check if coupon has expired
  const now = new Date();
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    throw new AppError('Coupon has expired', 400);
  }

  // Check if coupon has started
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    throw new AppError('Coupon is not yet active', 400);
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit exceeded', 400);
  }

  // Check per-user limit
  const userUsageCount = coupon.couponUsages?.length || 0;
  if (userUsageCount >= coupon.perUserLimit) {
    throw new AppError('Per-user usage limit exceeded', 400);
  }

  // Check first-order-only restriction
  if (coupon.isFirstOrderOnly && userOrderCount > 0) {
    throw new AppError('Coupon is for first-time users only', 400);
  }

  // Check minimum cart value
  if (coupon.minCartValue && cartTotal < coupon.minCartValue) {
    throw new AppError(`Minimum cart value of $${coupon.minCartValue} required`, 400);
  }

  return true;
};

// Create coupon usage record
const createCouponUsage = async (userId, couponId, orderId, discount) => {
  return await prisma.couponUsage.create({
    data: {
      userId,
      couponId,
      orderId,
      discount: roundCurrency(discount)
    }
  });
};

// Get user's coupon usage history
const getUserCouponUsage = async (userId) => {
  return await prisma.couponUsage.findMany({
    where: { userId },
    include: {
      coupon: {
        select: {
          id: true,
          code: true,
          type: true,
          value: true,
          expiresAt: true,
          isActive: true
        }
      },
      order: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true
        }
      }
    },
    orderBy: { usedAt: 'desc' }
  });
};

// Get coupon usage details
const getCouponUsageDetails = async (couponId) => {
  console.log("Coupon lookup for id:", couponId);
  
  // Get coupon details
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId }
  });

  console.log("Fetched coupon:", coupon);

  if (!coupon) {
    console.error("Coupon lookup failed for id:", couponId);
    throw new AppError('Coupon not found', 404);
  }

  // Get all usage records
  const usages = await prisma.couponUsage.findMany({
    where: { couponId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      order: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          paymentStatus: true
        }
      }
    },
    orderBy: { usedAt: 'desc' }
  });

  const usageRows = usages.map((usage) => {
    const storedDiscount = usage.discount !== null && usage.discount !== undefined
      ? roundCurrency(usage.discount)
      : null;
    const recoveredDiscount = storedDiscount ?? recoverDiscountFromFinalTotal(coupon, usage.order?.totalAmount);
    const hasDiscount = recoveredDiscount !== null && recoveredDiscount !== undefined;
    const isCancelled = usage.order?.status === 'CANCELLED';
    const hasFailedPayment = usage.order?.paymentStatus === 'FAILED';
    const invalidReason = !hasDiscount
      ? 'Invalid usage record (missing discount)'
      : null;
    const exclusionReason = isCancelled
      ? 'Excluded from stats: cancelled order'
      : hasFailedPayment
        ? 'Excluded from stats: failed payment'
        : null;

    return {
      ...usage,
      discount: hasDiscount ? recoveredDiscount : null,
      usedRecoveredDiscount: storedDiscount === null && hasDiscount,
      invalidReason,
      exclusionReason,
      includedInStats: !invalidReason && !exclusionReason
    };
  });

  const validStatUsages = usageRows.filter((usage) => usage.includedInStats);

  // Calculate statistics from stored discount values only
  const totalUsage = validStatUsages.length;
  const uniqueUsers = new Set(validStatUsages.map((usage) => usage.userId)).size;
  const totalDiscount = validStatUsages.reduce((sum, usage) => {
    return sum + toNumber(usage.discount);
  }, 0);
  const roundedTotalDiscount = roundCurrency(totalDiscount);
  const averageDiscount = totalUsage > 0 ? totalDiscount / totalUsage : 0;
  const roundedAverageDiscount = roundCurrency(averageDiscount);
  const invalidUsageCount = usageRows.filter((usage) => usage.invalidReason).length;
  const excludedUsageCount = usageRows.filter((usage) => !usage.includedInStats && usage.exclusionReason).length;

  // Calculate coupon status
  let status = "Active";
  const now = new Date();
  const expiryDate = new Date(coupon.expiresAt);
  
  if (!coupon.isActive) {
    status = "Disabled";
  } else if (expiryDate < now) {
    status = "Expired";
  } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    status = "Used Up";
  }

  // Add status to coupon object
  const couponWithStatus = {
    ...coupon,
    status
  };

  return {
    coupon: couponWithStatus,
    totalUsage,
    uniqueUsers,
    totalDiscount: roundedTotalDiscount,
    averageDiscount: roundedAverageDiscount,
    invalidUsageCount,
    excludedUsageCount,
    usages: usageRows
  };
};

// Get all coupons (for admin)
const getAllCoupons = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const status = typeof query.status === 'string' ? query.status : undefined;
  const search = typeof query.search === 'string' ? query.search : '';
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : 'createdAt';
  const order = query.order === 'asc' ? 'asc' : 'desc';

  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const skip = (safePage - 1) * safeLimit;
  const allowedSortFields = new Set(['createdAt', 'code', 'value', 'expiresAt', 'usedCount']);
  const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
  const trimmedSearch = search.trim();

  const andConditions = [];

  if (trimmedSearch) {
    andConditions.push({
      OR: [
        { code: { contains: trimmedSearch, mode: 'insensitive' } },
        {
          user: {
            name: { contains: trimmedSearch, mode: 'insensitive' }
          }
        }
      ]
    });
  }

  if (status && status !== 'all') {
    if (status === 'active') {
      andConditions.push({ isActive: true });
    } else if (status === 'inactive') {
      andConditions.push({ isActive: false });
    } else if (status === 'expired') {
      andConditions.push({ expiresAt: { lt: new Date() } });
    }
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  console.log("Query where:", where);

  try {
    const [total, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        include: {
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          couponUsages: {
            select: {
              id: true
            }
          }
        },
        orderBy: { [safeSortBy]: order },
        skip,
        take: safeLimit
      })
    ]);

    return {
      items: coupons.map((coupon) => ({
        ...coupon,
        assignedUsers: coupon.assignedUsers.map((assignment) => assignment.user)
      })),
      total,
      page: safePage,
      limit: safeLimit
    };
  } catch (error) {
    console.error("Coupons API error:", error);

    const relationFailed = /CouponUser|assignedUsers|couponuser/i.test(error.message || "");

    if (!relationFailed) {
      throw error;
    }

    console.warn("Retrying coupons query without assignedUsers relation data");

    const [total, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        include: {
          couponUsages: {
            select: {
              id: true
            }
          }
        },
        orderBy: { [safeSortBy]: order },
        skip,
        take: safeLimit
      })
    ]);

    return {
      items: coupons.map((coupon) => ({
        ...coupon,
        assignedUsers: []
      })),
      total,
      page: safePage,
      limit: safeLimit
    };
  }
};

// Get available coupons for a user
const getUserCoupons = async (userId) => {
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: { gt: new Date() } },
        { expiresAt: null }
      ],
      AND: [
        {
          OR: [
            { assignedUsers: { none: {} } },
            { assignedUsers: { some: { userId } } }
          ]
        }
      ]
    },
    orderBy: { expiresAt: 'asc' },
    include: {
      assignedUsers: {
        select: {
          userId: true
        }
      },
      couponUsages: {
        select: {
          id: true
        }
      }
    }
  });

  return coupons.map(coupon => ({
    ...coupon,
    usageCount: coupon.couponUsages?.length || 0,
    remainingUses: (coupon.usageLimit || null) - (coupon.couponUsages?.length || 0)
  }));
};

// Validate coupon (strict server-side validation)
const validateCoupon = async (code, cartTotal, userId) => {
  console.log('=== validateCoupon ===');
  console.log('Code:', code);
  console.log('Cart Total:', cartTotal);
  console.log('User ID:', userId);
  
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      assignedUsers: {
        select: {
          userId: true
        }
      },
      ...(userId ? {
        couponUsages: {
          where: { userId },
          select: {
            id: true
          }
        }
      } : {})
    }
  });

  console.log('Found coupon:', coupon);

  if (!coupon) {
    throw new AppError('Invalid coupon code', 404);
  }

  // Get user's order count
  const userOrderCount = userId ? await prisma.order.count({
    where: { userId }
  }) : 0;

  console.log('User order count:', userOrderCount);

  ensureCouponUserAccess(coupon, userId);

  // Validate coupon applicability
  canApplyCoupon(coupon, cartTotal, userOrderCount);

  return {
    coupon,
    discount: calculateDiscount(coupon, cartTotal)
  };
};

const validateCouponById = async (couponId, cartTotal, userId) => {
  console.log("=== validateCouponById ===");
  console.log("Coupon ID:", couponId);
  console.log("Cart Total:", cartTotal);
  console.log("User ID:", userId);

  const coupon = await prisma.coupon.findUnique({
    where: { id: String(couponId) },
    include: {
      assignedUsers: {
        select: {
          userId: true
        }
      },
      ...(userId ? {
        couponUsages: {
          where: { userId },
          select: {
            id: true
          }
        }
      } : {})
    }
  });

  console.log("Coupon lookup by id result:", coupon);

  if (!coupon) {
    throw new AppError("Invalid coupon", 404);
  }

  const userOrderCount = userId ? await prisma.order.count({
    where: { userId }
  }) : 0;

  console.log("User order count:", userOrderCount);

  ensureCouponUserAccess(coupon, userId);

  canApplyCoupon(coupon, cartTotal, userOrderCount);

  return {
    coupon,
    discount: calculateDiscount(coupon, cartTotal)
  };
};

// Apply coupon and create usage record
const applyCouponUsage = async (code, cartTotal, userId, orderId) => {
  console.log("=== APPLY COUPON USAGE START ===");
  console.log("Code:", code);
  console.log("Cart Total:", cartTotal);
  console.log("User ID:", userId);
  console.log("Order ID:", orderId);
  
  const validationResult = await validateCoupon(code, cartTotal, userId);
  const { coupon, discount } = validationResult;
  
  console.log("Validation result:", { couponId: coupon.id, discount });

  // Increment used count
  console.log("=== UPDATING COUPON ===");
  try {
    const updated = await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } }
    });
    console.log("Coupon update SUCCESS:", updated);
  } catch (err) {
    console.error("Coupon update FAILED:", err);
  }

  // Create usage record
  console.log("=== CREATING USAGE RECORD ===");
  try {
    const usage = await createCouponUsage(userId, coupon.id, orderId, discount);
    console.log("Usage record SUCCESS:", usage);
  } catch (err) {
    console.error("Usage record FAILED:", err);
  }

  return {
    couponId: coupon.id,
    discount,
    finalTotal: cartTotal - discount
  };
};

const applyCouponUsageById = async (couponId, cartTotal, userId, orderId) => {
  console.log("=== APPLY COUPON USAGE BY ID START ===");
  console.log("Coupon ID:", couponId);
  console.log("Cart Total:", cartTotal);
  console.log("User ID:", userId);
  console.log("Order ID:", orderId);

  const validationResult = await validateCouponById(couponId, cartTotal, userId);
  const { coupon, discount } = validationResult;

  console.log("Validation result:", { couponId: coupon.id, discount });

  console.log("=== UPDATING COUPON ===");
  try {
    const updated = await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } }
    });
    console.log("Coupon update SUCCESS:", updated);
  } catch (err) {
    console.error("Coupon update FAILED:", err);
    throw err;
  }

  console.log("=== CREATING USAGE RECORD ===");
  try {
    const usage = await createCouponUsage(userId, coupon.id, orderId, discount);
    console.log("Usage record SUCCESS:", usage);
  } catch (err) {
    console.error("Usage record FAILED:", err);
    throw err;
  }

  return {
    couponId: coupon.id,
    discount,
    finalTotal: cartTotal - discount
  };
};

// Create new coupon
const createCoupon = async (couponData, userId) => {
  const coupon = await prisma.coupon.create({
    data: {
      code: couponData.code.toUpperCase(),
      type: couponData.type,
      value: couponData.value,
      minCartValue: couponData.minCartValue || null,
      maxDiscount: couponData.maxDiscount || null,
      usageLimit: couponData.usageLimit || null,
      perUserLimit: couponData.perUserLimit || 1,
      isFirstOrderOnly: couponData.isFirstOrderOnly || false,
      startsAt: couponData.startsAt || new Date(),
      expiresAt: couponData.expiresAt,
      isActive: couponData.isActive !== false,
      userId
    }
  });

  return coupon;
};

const getCouponAssignedUsers = async (couponId) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: { id: true }
  });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  const assignedUsers = await prisma.couponUser.findMany({
    where: { couponId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return assignedUsers.map((assignment) => assignment.user);
};

const assignUsersToCoupon = async (couponId, userIds = []) => {
  const normalizedUserIds = [...new Set(
    (Array.isArray(userIds) ? userIds : [])
      .map((userId) => Number(userId))
      .filter((userId) => Number.isInteger(userId) && userId > 0)
  )];

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: { id: true }
  });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  const users = normalizedUserIds.length
    ? await prisma.user.findMany({
        where: {
          id: { in: normalizedUserIds }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      })
    : [];

  if (users.length !== normalizedUserIds.length) {
    throw new AppError('One or more users were not found', 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.couponUser.deleteMany({
      where: {
        couponId,
        ...(normalizedUserIds.length
          ? { userId: { notIn: normalizedUserIds } }
          : {})
      }
    });

    if (normalizedUserIds.length > 0) {
      await tx.couponUser.createMany({
        data: normalizedUserIds.map((userId) => ({
          couponId,
          userId
        })),
        skipDuplicates: true
      });
    }
  });

  return getCouponAssignedUsers(couponId);
};

const removeUserFromCoupon = async (couponId, userId) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: { id: true }
  });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  await prisma.couponUser.deleteMany({
    where: {
      couponId,
      userId: Number(userId)
    }
  });

  return getCouponAssignedUsers(couponId);
};

// Update coupon
const updateCoupon = async (id, couponData) => {
  return await prisma.coupon.update({
    where: { id },
    data: {
      code: couponData.code?.toUpperCase(),
      type: couponData.type,
      value: couponData.value,
      minCartValue: couponData.minCartValue,
      maxDiscount: couponData.maxDiscount,
      usageLimit: couponData.usageLimit,
      perUserLimit: couponData.perUserLimit,
      isFirstOrderOnly: couponData.isFirstOrderOnly,
      startsAt: couponData.startsAt,
      expiresAt: couponData.expiresAt,
      isActive: couponData.isActive
    }
  });
};

// Delete coupon
const deleteCoupon = async (id) => {
  return await prisma.coupon.delete({
    where: { id }
  });
};

// Toggle coupon status
const toggleCouponStatus = async (id) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id }
  });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  return await prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive }
  });
};

export {
  calculateDiscount,
  canApplyCoupon,
  createCouponUsage,
  getCouponAssignedUsers,
  assignUsersToCoupon,
  removeUserFromCoupon,
  getUserCouponUsage,
  getCouponUsageDetails,
  getAllCoupons,
  getUserCoupons,
  validateCoupon,
  validateCouponById,
  applyCouponUsage,
  applyCouponUsageById,
  applyCouponUsage as applyCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
};
