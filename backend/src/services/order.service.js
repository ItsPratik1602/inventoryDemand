import { prisma } from "../config/prisma.js";
import { applyCouponUsageById, validateCouponById } from "./coupon.service.js";
import {
  attachRewardRedemptionToOrder,
  awardOrderRewardPoints,
  calculateEarnableOrderPoints,
  earnCoins,
  previewRewardRedemption,
  redeemCoins,
  reverseOrderRewardEffects
} from "./reward.service.js";
import { generateStockAlerts, autoResolveAlerts } from "./alert.service.js";

export const createOrder = async (userId, orderData) => {
  console.log("=== ORDER SERVICE START ===");
  const { shippingAddress, paymentMethod, items, couponId, rewardPointsToUse = 0 } = orderData;
  
  console.log("CREATE ORDER SERVICE - couponId:", couponId);
  console.log("CREATE ORDER SERVICE - couponId type:", typeof couponId);
  console.log("CREATE ORDER SERVICE - rewardPointsToUse:", rewardPointsToUse);
  console.log("CREATE ORDER SERVICE - userId:", userId);

  if (!items || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  if (!shippingAddress) {
    throw new Error("Shipping address is required");
  }

  if (!paymentMethod) {
    throw new Error("Payment method is required");
  }

  if (!['COD', 'ONLINE'].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  // Validate items and check stock
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: true }
  });

  if (products.length !== productIds.length) {
    throw new Error("Some products not found");
  }

  // Calculate total amount and check stock
  let totalAmount = 0;
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    
    if (product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }

    totalAmount += Number(product.price) * item.quantity;
  }

  // Apply coupon discount if provided
  let discountAmount = 0;
  let appliedCoupon = null;
  let rewardRedemption = {
    pointsUsed: 0,
    discountAmount: 0
  };

  if (couponId) {
    console.log("=== COUPON VALIDATION BLOCK ENTERED ===");
    try {
      const validationResult = await validateCouponById(String(couponId), totalAmount, userId);
      
      discountAmount = validationResult.discount;
      appliedCoupon = validationResult.coupon;
      totalAmount = totalAmount - discountAmount;
    } catch (error) {
      throw new Error(`Invalid coupon: ${error.message}`);
    }
  }

  if (rewardPointsToUse) {
    try {
      rewardRedemption = await previewRewardRedemption({
        userId,
        cartTotal: totalAmount,
        couponDiscount: discountAmount,
        requestedPoints: rewardPointsToUse
      });
      totalAmount -= rewardRedemption.discountAmount;
    } catch (error) {
      throw new Error(`Invalid reward redemption: ${error.message}`);
    }
  }

  const rewardPointsToEarn = await calculateEarnableOrderPoints(totalAmount);
  let coinsEarned = 0;

  // Create order with items in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        shippingAddress,
        paymentMethod,
        couponId: appliedCoupon?.id ?? null,
        rewardPointsUsed: rewardRedemption.pointsUsed,
        rewardDiscountAmount: rewardRedemption.discountAmount
      }
    });

    // Create order items and update stock
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      // Create order item
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: Number(product.price),
        }
      });

      // Update product stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: product.stockQuantity - item.quantity
        }
      });
    }

    if (rewardRedemption && rewardRedemption.pointsUsed > 0) {
      await attachRewardRedemptionToOrder(tx, {
        userId,
        orderId: order.id,
        pointsUsed: rewardRedemption.pointsUsed,
        discountAmount: rewardRedemption.discountAmount
      });
    }

    // Earn coins for the order (replaces awardOrderRewardPoints)
    coinsEarned = await earnCoins(tx, {
      userId,
      orderId: order.id,
      orderAmount: totalAmount
    });

    return order;
  });

  // Apply coupon and create usage record if coupon was used
  if (couponId && appliedCoupon) {
    console.log("=== COUPON BLOCK ENTERED ===");
    try {
      console.log("ORDER SERVICE - Applying coupon with id:", couponId);
      console.log("ORDER SERVICE - Discount amount:", discountAmount);
      console.log("ORDER SERVICE - User ID:", userId);
      console.log("ORDER SERVICE - Order ID:", result.id);
      
      await applyCouponUsageById(String(couponId), totalAmount + discountAmount, userId, result.id);
      
      console.log("ORDER SERVICE - Coupon applied successfully");
    } catch (error) {
      console.error("COUPON APPLICATION ERROR:", error);
      console.error("ERROR DETAILS:", {
        message: error.message,
        stack: error.stack
      });
    }
  } else {
    console.log("=== NO COUPON ID PROVIDED ===");
  }

  // Clear user's cart
  const cart = await prisma.cart.findUnique({
    where: { userId }
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
  }

  // Generate stock alerts after order completion
  try {
    // Get all products from the order to check stock levels
    const orderProducts = await prisma.product.findMany({
      where: {
        id: {
          in: items.map(item => item.productId)
        }
      },
      include: {
        inventory: true
      }
    });

    // Generate alerts for each product
    for (const product of orderProducts) {
      const currentStock = product.inventory?.quantity || product.stockQuantity || 0;
      
      await generateStockAlerts({
        id: product.id,
        name: product.name,
        currentStock,
        reorderLevel: product.reorderLevel
      });
    }
  } catch (error) {
    console.error("Failed to generate stock alerts after order:", error);
    // Don't fail the order if alert generation fails
  }

  return {
    ...result,
    discountAmount,
    appliedCoupon,
    rewardRedemption,
    rewardPointsEarned: rewardPointsToEarn,
    coinsEarned: coinsEarned
  };
};

export const getOrders = async (userId, query = {}) => {
  const safePage = Math.max(Number(query.page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const safeSortBy = query.sortBy || "createdAt";
  const safeOrder = query.order === "asc" ? "asc" : "desc";
  const trimmedSearch = String(query.search || "").trim();

  const where = userId ? { userId } : {};

  // Add search functionality
  if (trimmedSearch) {
    where.OR = [
      {
        user: {
          name: {
            contains: trimmedSearch,
            mode: "insensitive"
          }
        }
      },
      {
        user: {
          email: {
            contains: trimmedSearch,
            mode: "insensitive"
          }
        }
      },
      {
        items: {
          some: {
            product: {
              name: {
                contains: trimmedSearch,
                mode: "insensitive"
              }
            }
          }
        }
      }
    ];
  }

  // Add status filter
  if (query.status) {
    where.status = query.status;
  }

  // Add date filter
  if (query.date) {
    const filterDate = new Date(query.date);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    where.createdAt = {
      gte: filterDate,
      lt: nextDay
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: where,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                images: true
              }
            }
          }
        },
        user: userId ? false : {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        [safeSortBy]: safeOrder
      },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit
    }),
    prisma.order.count({
      where: where
    })
  ]);

  return {
    items: orders,
    total,
    page: safePage,
    limit: safeLimit
  };
};

export const getOrderById = async (userId, orderId) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              images: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

export const getAdminOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: {
      id: parseInt(orderId)
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      items: {
        include: {
          product: {
            include: {
              category: true,
              images: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

// Customer order functions
export const getCustomerOrders = async (userId, query = {}) => {
  const safePage = Math.max(Number(query.page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const safeSortBy = query.sortBy || "createdAt";
  const safeOrder = query.order === "asc" ? "asc" : "desc";

  const where = { userId };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { [safeSortBy]: safeOrder },
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true
            }
          }
        }
      }
    }
  });

  const total = await prisma.order.count({ where });

  return {
    items: orders,
    page: safePage,
    limit: safeLimit,
    total
  };
};

export const getCustomerOrderById = async (userId, orderId) => {
  const order = await prisma.order.findFirst({
    where: { 
      id: parseInt(orderId),
      userId 
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

// Status transition validation
export const validateOrderStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'PENDING': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [], // Terminal state
    'CANCELLED': []  // Terminal state
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Cannot change order from ${currentStatus} to ${newStatus}. Valid transitions: ${allowedTransitions.join(', ') || 'None (terminal state)'}`);
  }

  return true;
};

export const updateCustomerOrderStatus = async (userId, orderId, newStatus) => {
  const order = await prisma.order.findFirst({
    where: { 
      id: parseInt(orderId),
      userId 
    }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Validate transition
  validateOrderStatusTransition(order.status, newStatus);

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status: newStatus }
  });

  if (newStatus === 'CANCELLED') {
    await reverseOrderRewardEffects(orderId);
  }

  return updatedOrder;
};

export const updateOrderStatus = async (orderId, newStatus) => {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Validate transition
  validateOrderStatusTransition(order.status, newStatus);

  // For COD orders, automatically mark as paid when delivered
  const updateData = { status: newStatus };
  console.log(`Updating order ${orderId}: status=${newStatus}, paymentMethod=${order.paymentMethod}, currentPaymentStatus=${order.paymentStatus}`);
  
  if ((order.paymentMethod === 'COD' || order.paymentMethod === 'cod') && newStatus === 'DELIVERED') {
    updateData.paymentStatus = 'PAID';
    console.log(`COD Order ${orderId} marked as delivered - payment status automatically set to PAID`);
    console.log(`Update data:`, updateData);
  } else {
    console.log(`Not updating payment status. paymentMethod=${order.paymentMethod}, newStatus=${newStatus}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      items: {
        include: {
          product: {
            include: {
              images: true,
              category: true
            }
          }
        }
      }
    }
  });

  if (newStatus === 'CANCELLED') {
    await reverseOrderRewardEffects(orderId);
  }

  console.log(`After update - Order ${orderId}: status=${updatedOrder.status}, paymentStatus=${updatedOrder.paymentStatus}`);
  return updatedOrder;
};
