import { prisma } from "../config/prisma.js";
import pkg from "@prisma/client";
const { Prisma } = pkg;
import { AppError } from "../utils/app-error.js";

// REWARD SYSTEM CONFIGURATION
// Users earn 1 point for every ORDER_REWARD_SPEND_UNIT currency units spent
// This value should match the frontend display and be easily configurable
const ORDER_REWARD_SPEND_UNIT = 100; // 1 point per $100 spent
const POINT_VALUE = 1; // Each point is worth 1 currency unit
const DEFAULT_REWARD_RULES = [
  { actionType: "ORDER", points: 1, isActive: true },
  { actionType: "SIGNUP", points: 50, isActive: true },
  { actionType: "REFERRAL", points: 100, isActive: false }
];

const isRewardSchemaUnavailable = (error) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (["P2021", "P2022"].includes(error.code)) {
    return true;
  }

  const message = String(error.message || "");
  return ["RewardWallet", "RewardTransaction", "RewardRule", "RewardRedemption"].some((modelName) =>
    message.includes(modelName)
  );
};

const getDefaultRewardBalance = () => ({
  userId: null,
  totalPoints: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
  pointValue: POINT_VALUE,
  orderSpendUnit: ORDER_REWARD_SPEND_UNIT,
  rules: DEFAULT_REWARD_RULES
});

const getDefaultRewardHistory = (query = {}) => {
  const { page, limit } = normalizePagination(query);

  return {
    items: [],
    total: 0,
    page,
    limit
  };
};

const normalizePagination = (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

export const ensureRewardRules = async () => {
  try {
    await Promise.all(
      DEFAULT_REWARD_RULES.map((rule) =>
        prisma.rewardRule.upsert({
          where: { actionType: rule.actionType },
          update: {},
          create: rule
        })
      )
    );
  } catch (error) {
    console.error("Error in ensureRewardRules:", error);
    throw error;
  }
};

export const ensureRewardConfig = async () => {
  await prisma.rewardConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      earnRate: 1, // 1 coin per ₹100
      coinValue: 1.00, // ₹1 per coin
      maxRedeemPercent: 10, // max 10% of order total
      monthlyEarnLimit: 500, // max 500 coins per month
      isActive: true
    }
  });
};

const getRuleMap = (rules = []) =>
  rules.reduce((accumulator, rule) => {
    accumulator[rule.actionType] = rule;
    return accumulator;
  }, {});

export const ensureRewardWallet = async (tx, userId) =>
  tx.rewardWallet.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });

const buildWalletUpdateData = (points) => {
  const updateData = {
    totalPoints: { increment: points }
  };

  if (points > 0) {
    updateData.lifetimeEarned = { increment: points };
  }

  if (points < 0) {
    updateData.lifetimeSpent = { increment: Math.abs(points) };
  }

  return updateData;
};

export const recordRewardTransaction = async (
  tx,
  { userId, type, points, source, referenceId = "", description = null }
) => {
  if (!points) {
    return null;
  }

  await ensureRewardWallet(tx, userId);

  const wallet = await tx.rewardWallet.findUnique({
    where: { userId }
  });

  if (points < 0 && (wallet?.totalPoints || 0) < Math.abs(points)) {
    throw new AppError("Insufficient reward points", 400);
  }

  await tx.rewardWallet.update({
    where: { userId },
    data: buildWalletUpdateData(points)
  });

  return tx.rewardTransaction.create({
    data: {
      userId,
      type,
      points,
      source,
      referenceId,
      description
    }
  });
};

export const getRewardRules = async ({ includeInactive = false } = {}) => {
  try {
    await ensureRewardRules();

    const rules = await prisma.rewardRule.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { id: "asc" }
    });

    return rules || [];
  } catch (error) {
    console.error("Error in getRewardRules:", error);
    return [];
  }
};

export const getRewardConfig = async () => {
  await ensureRewardConfig();
  return prisma.rewardConfig.findFirst({ where: { id: 1 } });
};

export const calculateEarnableCoins = async (userId, orderAmount) => {
  const config = await getRewardConfig();
  
  if (!config?.isActive) {
    return 0;
  }

  // Calculate coins based on earn rate (coins per ₹100)
  const coins = Math.floor((Number(orderAmount) || 0) / 100) * config.earnRate;
  
  // Check monthly limit
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const monthlyEarned = await prisma.rewardTransaction.aggregate({
    where: {
      userId,
      type: "EARN",
      source: "ORDER",
      createdAt: {
        gte: currentMonth,
        lt: nextMonth
      }
    },
    _sum: {
      points: true
    }
  });

  const monthlyTotal = monthlyEarned._sum.points || 0;
  const availableLimit = Math.max(0, config.monthlyEarnLimit - monthlyTotal);
  
  return Math.min(coins, availableLimit);
};

export const calculateRedeemableCoins = async (userId, orderTotal) => {
  const config = await getRewardConfig();
  
  if (!config?.isActive) {
    return { maxCoins: 0, maxDiscount: 0 };
  }

  const wallet = await prisma.rewardWallet.findUnique({
    where: { userId }
  });

  if (!wallet || wallet.totalPoints <= 0) {
    return { maxCoins: 0, maxDiscount: 0 };
  }

  // Calculate max coins based on percentage limit
  const maxDiscountByPercent = (Number(orderTotal) || 0) * (config.maxRedeemPercent / 100);
  const maxCoinsByPercent = Math.floor(maxDiscountByPercent / Number(config.coinValue));
  
  // Take the minimum of available coins and percentage limit
  const maxCoins = Math.min(wallet.totalPoints, maxCoinsByPercent);
  const maxDiscount = maxCoins * Number(config.coinValue);

  return { maxCoins, maxDiscount };
};

export const calculateEarnableOrderPoints = async (amount) => {
  const rules = await getRewardRules();
  const ruleMap = getRuleMap(rules);
  const orderRule = ruleMap.ORDER;

  if (!orderRule?.isActive) {
    return 0;
  }

  return Math.max(0, Math.floor(Math.max(Number(amount) || 0, 0) / ORDER_REWARD_SPEND_UNIT) * orderRule.points);
};

export const previewRewardRedemption = async ({
  userId,
  cartTotal,
  couponDiscount = 0,
  requestedPoints = 0
}) => {
  await ensureRewardRules();

  const wallet = await prisma.rewardWallet.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });

  const subtotal = Math.max(Number(cartTotal) || 0, 0);
  const couponApplied = Math.max(Number(couponDiscount) || 0, 0);
  const requested = Math.max(parseInt(requestedPoints, 10) || 0, 0);
  const redeemableAmount = Math.max(0, subtotal - couponApplied);

  if (requested === 0) {
    return {
      pointsUsed: 0,
      discountAmount: 0,
      remainingPoints: wallet.totalPoints,
      maxRedeemablePoints: Math.min(wallet.totalPoints, Math.floor(redeemableAmount / POINT_VALUE))
    };
  }

  if (wallet.totalPoints < requested) {
    throw new AppError("You do not have enough reward points", 400);
  }

  const maxRedeemablePoints = Math.min(wallet.totalPoints, Math.floor(redeemableAmount / POINT_VALUE));

  if (requested > maxRedeemablePoints) {
    throw new AppError("Reward points cannot exceed the order total", 400);
  }

  return {
    pointsUsed: requested,
    discountAmount: requested * POINT_VALUE,
    remainingPoints: wallet.totalPoints - requested,
    maxRedeemablePoints
  };
};

export const attachRewardRedemptionToOrder = async (
  tx,
  { userId, orderId, pointsUsed, discountAmount }
) => {
  if (!pointsUsed || !discountAmount) {
    return null;
  }

  await tx.rewardRedemption.create({
    data: {
      userId,
      orderId,
      pointsUsed,
      discountAmount
    }
  });

  await recordRewardTransaction(tx, {
    userId,
    type: "REDEEM",
    points: -pointsUsed,
    source: "REDEMPTION",
    referenceId: String(orderId),
    description: `Redeemed ${pointsUsed} reward points on order #${orderId}`
  });

  return {
    pointsUsed,
    discountAmount
  };
};

export const earnCoins = async (tx, { userId, orderId, orderAmount }) => {
  const coins = await calculateEarnableCoins(userId, orderAmount);

  if (coins <= 0) {
    return 0;
  }

  await recordRewardTransaction(tx, {
    userId,
    type: "EARN",
    points: coins,
    source: "ORDER",
    referenceId: String(orderId),
    description: `Earned ${coins} coins from order #${orderId}`
  });

  return coins;
};

export const redeemCoins = async (tx, { userId, orderId, coinsToRedeem }) => {
  const config = await getRewardConfig();
  
  if (!config?.isActive || coinsToRedeem <= 0) {
    return { coinsUsed: 0, discountAmount: 0 };
  }

  const wallet = await tx.rewardWallet.findUnique({
    where: { userId }
  });

  if (!wallet || wallet.totalPoints < coinsToRedeem) {
    throw new AppError("Insufficient coins balance", 400);
  }

  const discountAmount = coinsToRedeem * Number(config.coinValue);

  // Record redemption
  await tx.rewardRedemption.create({
    data: {
      userId,
      orderId,
      pointsUsed: coinsToRedeem,
      discountAmount
    }
  });

  // Deduct coins
  await recordRewardTransaction(tx, {
    userId,
    type: "REDEEM",
    points: -coinsToRedeem,
    source: "REDEMPTION",
    referenceId: String(orderId),
    description: `Redeemed ${coinsToRedeem} coins on order #${orderId}`
  });

  return {
    coinsUsed: coinsToRedeem,
    discountAmount
  };
};

export const awardOrderRewardPoints = async (tx, { userId, orderId, orderAmount }) => {
  console.log("=== AWARD ORDER REWARD POINTS START ===");
  console.log("userId:", userId);
  console.log("orderId:", orderId);
  console.log("orderAmount:", orderAmount);
  
  const points = await calculateEarnableOrderPoints(orderAmount);
  console.log("calculated points:", points);

  if (points <= 0) {
    console.log("No points to award, returning");
    return 0;
  }

  console.log("Creating reward transaction with referenceId:", String(orderId));
  await recordRewardTransaction(tx, {
    userId,
    type: "EARN",
    points,
    source: "ORDER",
    referenceId: String(orderId),
    description: `Earned ${points} reward points from order #${orderId}`
  });

  console.log("Reward transaction created successfully");
  return points;
};

export const awardSignupRewardPoints = async (userId) => {
  await ensureRewardRules();

  const rules = await getRewardRules();
  const ruleMap = getRuleMap(rules);
  const signupRule = ruleMap.SIGNUP;

  if (!signupRule?.isActive || signupRule.points <= 0) {
    await prisma.rewardWallet.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });
    return 0;
  }

  await prisma.$transaction(async (tx) => {
    await recordRewardTransaction(tx, {
      userId,
      type: "EARN",
      points: signupRule.points,
      source: "SIGNUP",
      referenceId: String(userId),
      description: "Signup reward bonus"
    });
  });

  return signupRule.points;
};

export const getRewardBalance = async (userId) => {
  try {
    const [wallet, rules] = await Promise.all([
      prisma.rewardWallet.upsert({
        where: { userId },
        update: {},
        create: { userId }
      }),
      getRewardRules({ includeInactive: true })
    ]);

    return {
      ...wallet,
      pointValue: POINT_VALUE,
      orderSpendUnit: ORDER_REWARD_SPEND_UNIT,
      rules
    };
  } catch (error) {
    if (!isRewardSchemaUnavailable(error)) {
      throw error;
    }

    console.warn("Reward schema is unavailable. Returning default balance payload.");

    return {
      ...getDefaultRewardBalance(),
      userId
    };
  }
};

export const getRewardHistory = async (userId, query = {}) => {
  try {
    const { page, limit, skip } = normalizePagination(query);

    const [total, items] = await Promise.all([
      prisma.rewardTransaction.count({
        where: { userId }
      }),
      prisma.rewardTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      })
    ]);

    return {
      items,
      total,
      page,
      limit
    };
  } catch (error) {
    if (!isRewardSchemaUnavailable(error)) {
      throw error;
    }

    console.warn("Reward schema is unavailable. Returning empty reward history.");

    return getDefaultRewardHistory(query);
  }
};

export const reverseOrderRewardEffects = async (orderId) => {
  const parsedOrderId = Number(orderId);

  if (!parsedOrderId) {
    throw new AppError("Invalid order id", 400);
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: parsedOrderId },
      include: {
        rewardRedemption: true
      }
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const orderReference = String(parsedOrderId);
    const earnTransaction = await tx.rewardTransaction.findFirst({
      where: {
        userId: order.userId,
        type: "EARN",
        source: "ORDER",
        referenceId: orderReference
      }
    });

    if (earnTransaction) {
      const reversalReference = `earn:${orderReference}`;
      const existingEarnReversal = await tx.rewardTransaction.findFirst({
        where: {
          userId: order.userId,
          source: "ORDER_REVERSAL",
          referenceId: reversalReference
        }
      });

      if (!existingEarnReversal) {
        await recordRewardTransaction(tx, {
          userId: order.userId,
          type: "ADJUST",
          points: -earnTransaction.points,
          source: "ORDER_REVERSAL",
          referenceId: reversalReference,
          description: `Reversed earned reward points for cancelled order #${parsedOrderId}`
        });
      }
    }

    if (order.rewardRedemption?.pointsUsed) {
      const reversalReference = `redeem:${orderReference}`;
      const existingRedeemReversal = await tx.rewardTransaction.findFirst({
        where: {
          userId: order.userId,
          source: "ORDER_REVERSAL",
          referenceId: reversalReference
        }
      });

      if (!existingRedeemReversal) {
        await recordRewardTransaction(tx, {
          userId: order.userId,
          type: "ADJUST",
          points: order.rewardRedemption.pointsUsed,
          source: "ORDER_REVERSAL",
          referenceId: reversalReference,
          description: `Restored redeemed reward points for cancelled order #${parsedOrderId}`
        });
      }
    }

    return true;
  });
};

export const updateRewardRules = async (rules = []) => {
  await ensureRewardRules();

  const normalizedRules = (Array.isArray(rules) ? rules : []).map((rule) => ({
    actionType: rule.actionType,
    points: Math.max(parseInt(rule.points, 10) || 0, 0),
    isActive: rule.isActive !== false
  }));

  await prisma.$transaction(
    normalizedRules.map((rule) =>
      prisma.rewardRule.upsert({
        where: { actionType: rule.actionType },
        update: {
          points: rule.points,
          isActive: rule.isActive
        },
        create: rule
      })
    )
  );

  return getRewardRules({ includeInactive: true });
};

export const adjustUserCoins = async ({
  userId,
  coins,
  description,
  adminUserId
}) => {
  const parsedUserId = Number(userId);
  const parsedCoins = parseInt(coins, 10);

  if (!parsedUserId || !Number.isInteger(parsedCoins) || parsedCoins === 0) {
    throw new AppError("Valid userId and non-zero coins are required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: parsedUserId },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const referenceId = `${adminUserId}:${parsedUserId}:${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    await recordRewardTransaction(tx, {
      userId: parsedUserId,
      type: "ADJUST",
      points: parsedCoins,
      source: "ADMIN",
      referenceId,
      description: description || "Manual coin balance adjustment"
    });
  });

  return {
    user,
    wallet: await prisma.rewardWallet.findUnique({
      where: { userId: parsedUserId }
    })
  };
};

export const updateRewardConfig = async (configData) => {
  await ensureRewardConfig();
  
  const config = await prisma.rewardConfig.update({
    where: { id: 1 },
    data: {
      earnRate: configData.earnRate,
      coinValue: configData.coinValue,
      maxRedeemPercent: configData.maxRedeemPercent,
      monthlyEarnLimit: configData.monthlyEarnLimit,
      isActive: configData.isActive
    }
  });

  return config;
};

export const adjustRewardPoints = async ({
  userId,
  points,
  description,
  adminUserId
}) => {
  const parsedUserId = Number(userId);
  const parsedPoints = parseInt(points, 10);

  if (!parsedUserId || !Number.isInteger(parsedPoints) || parsedPoints === 0) {
    throw new AppError("Valid userId and non-zero points are required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: parsedUserId },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const referenceId = `${adminUserId}:${parsedUserId}:${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    await recordRewardTransaction(tx, {
      userId: parsedUserId,
      type: "ADJUST",
      points: parsedPoints,
      source: "ADMIN",
      referenceId,
      description: description || "Manual reward point adjustment"
    });
  });

  return {
    user,
    wallet: await prisma.rewardWallet.findUnique({
      where: { userId: parsedUserId }
    })
  };
};

export const getRewardOverview = async () => {
  await ensureRewardRules();

  const [wallets, transactions, topUsers, rules] = await Promise.all([
    prisma.rewardWallet.findMany(),
    prisma.rewardTransaction.findMany(),
    prisma.rewardWallet.findMany({
      take: 10,
      orderBy: { totalPoints: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    getRewardRules({ includeInactive: true })
  ]);

  const totalPointsIssued = transactions
    .filter((transaction) => transaction.points > 0)
    .reduce((sum, transaction) => sum + transaction.points, 0);

  const totalPointsRedeemed = transactions
    .filter((transaction) => transaction.points < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.points), 0);

  return {
    totals: {
      activeWallets: wallets.length,
      totalOutstandingPoints: wallets.reduce((sum, wallet) => sum + wallet.totalPoints, 0),
      totalLifetimeEarned: wallets.reduce((sum, wallet) => sum + wallet.lifetimeEarned, 0),
      totalLifetimeSpent: wallets.reduce((sum, wallet) => sum + wallet.lifetimeSpent, 0),
      totalPointsIssued,
      totalPointsRedeemed
    },
    topUsers: topUsers.map((wallet) => ({
      user: wallet.user,
      totalPoints: wallet.totalPoints,
      lifetimeEarned: wallet.lifetimeEarned,
      lifetimeSpent: wallet.lifetimeSpent
    })),
    rules
  };
};

export const getUserRewardHistoryAdmin = async (userId, query = {}) => {
  const parsedUserId = Number(userId);

  if (!parsedUserId) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: parsedUserId },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const history = await getRewardHistory(parsedUserId, query);

  return {
    user,
    ...history
  };
};
